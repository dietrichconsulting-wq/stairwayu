import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/hooks/useXp'

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

  // Grant referrer 7 extra days based on their current subscription status
  const { data: referrerSub } = await service
    .from('subscriptions')
    .select('status, tier, trial_end, current_period_end, stripe_subscription_id')
    .eq('user_id', referral.referrer_id)
    .single()

  if (referrerSub) {
    let referrerUpdate: Record<string, unknown> = {}

    if (referrerSub.status === 'trialing') {
      const base = referrerSub.trial_end ? new Date(referrerSub.trial_end) : new Date()
      base.setDate(base.getDate() + 7)
      referrerUpdate = { trial_end: base.toISOString() }
    } else if (referrerSub.status === 'active') {
      const base = referrerSub.current_period_end
        ? new Date(referrerSub.current_period_end)
        : new Date()
      base.setDate(base.getDate() + 7)
      referrerUpdate = { current_period_end: base.toISOString() }
    } else {
      // canceled / free — reactivate with a 7-day trial
      referrerUpdate = {
        tier: 'pro',
        status: 'trialing',
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

  // Grant referred user (current user) 7 extra days of Pro
  const { data: referredSub } = await service
    .from('subscriptions')
    .select('status, tier, trial_end, current_period_end, stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (referredSub) {
    let referredUpdate: Record<string, unknown> = {}

    if (referredSub.status === 'trialing') {
      const base = referredSub.trial_end ? new Date(referredSub.trial_end) : new Date()
      base.setDate(base.getDate() + 7)
      referredUpdate = { trial_end: base.toISOString() }
    } else if (referredSub.status === 'active') {
      const base = referredSub.current_period_end
        ? new Date(referredSub.current_period_end)
        : new Date()
      base.setDate(base.getDate() + 7)
      referredUpdate = { current_period_end: base.toISOString() }
    } else {
      // canceled / free — reactivate with a 7-day trial
      referredUpdate = {
        tier: 'pro',
        status: 'trialing',
        trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }

    const { error: referredBonusError } = await service
      .from('subscriptions')
      .update(referredUpdate)
      .eq('user_id', user.id)

    if (!referredBonusError) {
      await service
        .from('referral_completions')
        .update({ referred_bonus_applied: true })
        .eq('referred_id', user.id)
    }
  }

  // Grant referrer XP for the referral
  await service
    .from('xp_ledger')
    .upsert(
      {
        user_id: referral.referrer_id,
        action: 'refer_friend',
        xp: XP_REWARDS.refer_friend,
        ref_id: user.id,
      },
      { onConflict: 'user_id,action,ref_id' },
    )

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
  })
}
