/**
 * STRIPE SETUP — MANUAL STEPS REQUIRED BEFORE THIS ROUTE WORKS
 * ─────────────────────────────────────────────────────────────
 * 1. Go to Stripe Dashboard → Products → Pro product → Add Price:
 *      Amount: $79.00 | Billing period: Yearly
 *    Copy the new Price ID (e.g. price_xxxAnnual).
 *
 * 2. Add to .env (locally) and Vercel environment variables:
 *      STRIPE_PRO_ANNUAL_PRICE_ID=price_xxxAnnual
 *    The existing STRIPE_PRO_PRICE_ID (monthly) stays unchanged.
 *
 * 3. Stripe Billing Portal → Settings → Customer Portal:
 *      - Enable "Switch plans"
 *      - Add both monthly and annual prices to allowed products
 */

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const plan = body.plan === 'annual' ? 'annual' : 'monthly'

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('subscriptions').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
    }

    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
      : process.env.STRIPE_PRO_PRICE_ID!

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
