/**
 * STRIPE SETUP — MANUAL STEP REQUIRED
 * ────────────────────────────────────
 * 1. Go to Stripe Dashboard → Products → Create product:
 *      Name: "Credit Pack — 400 Credits"
 *      Price: $5.00 (one-time)
 *    Copy the Price ID.
 *
 * 2. Add to .env and Vercel environment variables:
 *      STRIPE_CREDIT_PACK_PRICE_ID=price_xxxCredits
 */

import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Must have an existing subscription record (i.e. be a pro user)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, tier, status')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: 'Active subscription required to purchase credits' }, { status: 403 })
    }

    const session = await stripe.checkout.sessions.create({
      customer: subscription.stripe_customer_id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_CREDIT_PACK_PRICE_ID!,
        quantity: 1,
      }],
      metadata: {
        type: 'credit_pack',
        user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
