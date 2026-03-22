import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Idempotency: already fulfilled?
  const { data: existingCompletion } = await supabase
    .from('referral_completions')
    .select('id')
    .eq('referred_id', user.id)
    .single()

  if (existingCompletion) {
    return NextResponse.json({ success: true, already_fulfilled: true })
  }

  // Get referral code: prefer user metadata, fall back to request body
  const body = await req.json().catch(() => ({}))
  const metaCode = user.user_metadata?.referral_code as string | undefined
  const code: string | undefined = metaCode || body.code

  if (!code) {
    return NextResponse.json({ error: 'No referral code' }, { status: 400 })
  }

  // Validate code exists
  const { data: referral } = await supabase
    .from('referrals')
    .select('referrer_id, referral_code')
    .eq('referral_code', code)
    .single()

  if (!referral) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 })
  }

  // Self-referral check
  if (referral.referrer_id === user.id) {
    return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 })
  }

  // Use service client for cross-user DB writes
  const service = await createServiceClient()

  // Insert completion row
  const { error: completionError } = await service
    .from('referral_completions')
    .insert({
      referral_code: code,
      referrer_id: referral.referrer_id,
      referred_id: user.id,
    })

  if (completionError) {
    // Unique constraint: already referred — idempotent
    if (completionError.code === '23505') {
      return NextResponse.json({ success: true, already_fulfilled: true })
    }
    return NextResponse.json({ error: 'Failed to record referral' }, { status: 500 })
  }

  // Apply bonus to referred friend (current user): extend their trial to 14 days
  const { error: referredBonusError } = await service
    .from('subscriptions')
    .update({
      trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('user_id', user.id)

  if (!referredBonusError) {
    await service
      .from('referral_completions')
      .update({ referred_bonus_applied: true })
      .eq('referred_id', user.id)
  }

  // Apply bonus to referrer: extend by 14 days based on their current status
  const { data: referrerSub } = await service
    .from('subscriptions')
    .select('status, tier, trial_end, current_period_end, stripe_subscription_id')
    .eq('user_id', referral.referrer_id)
    .single()

  if (referrerSub) {
    let referrerUpdate: Record<string, unknown> = {}

    if (referrerSub.status === 'trialing') {
      const base = referrerSub.trial_end ? new Date(referrerSub.trial_end) : new Date()
      base.setDate(base.getDate() + 14)
      referrerUpdate = { trial_end: base.toISOString() }
    } else if (referrerSub.status === 'active') {
      // TODO (v2): sync Stripe subscription period — for paid subscribers, extend
      // current_period_end via stripe.subscriptions.update(stripe_subscription_id, { trial_end })
      // or apply a Stripe credit. For now, only the local DB field is extended.
      const base = referrerSub.current_period_end
        ? new Date(referrerSub.current_period_end)
        : new Date()
      base.setDate(base.getDate() + 14)
      referrerUpdate = { current_period_end: base.toISOString() }
    } else {
      // canceled / free — reactivate with a 14-day trial
      referrerUpdate = {
        tier: 'pro',
        status: 'trialing',
        trial_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }

    const { error: referrerBonusError } = await service
      .from('subscriptions')
      .update(referrerUpdate)
      .eq('user_id', referral.referrer_id)

    if (!referrerBonusError) {
      await service
        .from('referral_completions')
        .update({ referrer_bonus_applied: true })
        .eq('referred_id', user.id)
    }
  }

  // Fetch referrer's first name for the welcome message
  const { data: referrerProfile } = await service
    .from('profiles')
    .select('display_name')
    .eq('id', referral.referrer_id)
    .single()

  const referrerFirstName = referrerProfile?.display_name?.split(' ')[0] || 'a friend'

  return NextResponse.json({
    success: true,
    referrer_name: referrerFirstName,
    bonus_days: 14,
  })
}
