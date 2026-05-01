import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { getStripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
// Credits system removed — freemium model uses daily AI limits instead

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trial_end: (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null,
          })
          .eq('stripe_customer_id', session.customer as string)

      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const tier = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free'
      const interval = sub.items.data[0]?.price?.recurring?.interval
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newPeriodEnd = new Date((sub as any).current_period_end * 1000).toISOString()

      // Check if period rolled over (renewal) — grant monthly credits
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('user_id, current_period_end')
        .eq('stripe_subscription_id', sub.id)
        .single()

      await supabase
        .from('subscriptions')
        .update({
          tier,
          status: sub.status,
          billing_interval: interval === 'year' ? 'year' : 'month',
          current_period_end: newPeriodEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trial_end: (sub as any).trial_end ? new Date((sub as any).trial_end * 1000).toISOString() : null,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trialEnd: (sub as any).trial_end,
        },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
