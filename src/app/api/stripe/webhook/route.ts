import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
// Credits system removed — freemium model uses daily AI limits instead

// Stripe API version 2026-02-25.clover moved current_period_end off the
// top-level Subscription object onto subscription.items[0]. Older API
// versions still have it at the top. Read both, fall back to items[0].
function getPeriodEnd(sub: Stripe.Subscription): number | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const top = (sub as any).current_period_end as number | undefined
  if (typeof top === 'number') return top
  const itemEnd = sub.items?.data?.[0]?.current_period_end as number | undefined
  return typeof itemEnd === 'number' ? itemEnd : null
}

function getTrialEnd(sub: Stripe.Subscription): number | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = (sub as any).trial_end as number | undefined
  return typeof v === 'number' ? v : null
}

function unixToISO(ts: number | null): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  // Defensive: trim whitespace from the env var. Vercel's env var UI has
  // historically allowed trailing newlines/spaces to slip in on paste,
  // which makes HMAC signature verification silently fail.
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? '').trim()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Deduplicate: skip if we've already processed this event
  const { error: dupError } = await supabase
    .from('stripe_webhook_events')
    .insert({ event_id: event.id })

  if (dupError?.code === '23505') {
    // Unique violation — already processed
    return NextResponse.json({ received: true })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Subscription checkout
      if (session.mode === 'subscription' && session.customer) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const interval = sub.items.data[0]?.price?.recurring?.interval
        await supabase
          .from('subscriptions')
          .update({
            stripe_subscription_id: sub.id,
            tier: 'pro',
            status: sub.status,
            billing_interval: interval === 'year' ? 'year' : 'month',
            current_period_end: unixToISO(getPeriodEnd(sub)),
            trial_end: unixToISO(getTrialEnd(sub)),
          })
          .eq('stripe_customer_id', session.customer as string)

      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free'
      const interval = sub.items.data[0]?.price?.recurring?.interval

      await supabase
        .from('subscriptions')
        .update({
          tier,
          status: sub.status,
          billing_interval: interval === 'year' ? 'year' : 'month',
          current_period_end: unixToISO(getPeriodEnd(sub)),
          cancel_at_period_end: sub.cancel_at_period_end,
          trial_end: unixToISO(getTrialEnd(sub)),
        })
        .eq('stripe_subscription_id', sub.id)

      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ tier: 'free', status: 'canceled', stripe_subscription_id: null })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'invoice.payment_failed': {
      // Stripe smart-retry will continue for up to ~3 weeks before giving up.
      // We don't change tier here — `customer.subscription.updated` fires when
      // status transitions to past_due/unpaid/canceled and the existing handler
      // catches it. This case exists to surface failures in Sentry so we can
      // spot dunning patterns and (later) trigger in-app banners or email.
      const invoice = event.data.object as Stripe.Invoice
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subscriptionId = (invoice as any).subscription as string | null
      Sentry.captureMessage('Stripe invoice payment failed', {
        level: 'warning',
        extra: {
          customerId: invoice.customer as string,
          subscriptionId,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt,
          billingReason: invoice.billing_reason,
        },
      })
      break
    }

    case 'customer.subscription.trial_will_end': {
      // Fires 3 days before trial converts. Visibility-only for now —
      // wire to email/in-app notification in a follow-up.
      const sub = event.data.object as Stripe.Subscription
      Sentry.captureMessage('Stripe trial ending in 3 days', {
        level: 'info',
        extra: {
          customerId: sub.customer as string,
          subscriptionId: sub.id,
          trialEnd: getTrialEnd(sub),
        },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
