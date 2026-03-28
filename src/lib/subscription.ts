import { createClient } from '@/lib/supabase/server'

export type SubscriptionInfo = {
  isPro: boolean
  isTrialing: boolean
  trialDaysLeft: number | null
  tier: 'free' | 'pro'
  status: string | null
  trialEnd: string | null
}

export async function getSubscription(userId: string): Promise<SubscriptionInfo> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status, trial_end, stripe_subscription_id')
    .eq('user_id', userId)
    .single()

  if (!sub) {
    return { isPro: false, isTrialing: false, trialDaysLeft: null, tier: 'free', status: null, trialEnd: null }
  }

  const now = new Date()
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null
  const trialExpired = sub.status === 'trialing' && trialEnd !== null && trialEnd <= now
  const isTrialing = sub.status === 'trialing' && trialEnd !== null && trialEnd > now
  const isActiveSub = sub.status === 'active' && sub.stripe_subscription_id !== null
  const isPro = isTrialing || isActiveSub

  let trialDaysLeft: number | null = null
  if (isTrialing && trialEnd) {
    trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  if (trialExpired) {
    return { isPro: false, isTrialing: false, trialDaysLeft: 0, tier: 'free', status: sub.status, trialEnd: sub.trial_end }
  }

  return {
    isPro,
    isTrialing,
    trialDaysLeft,
    tier: isPro ? 'pro' : 'free',
    status: sub.status,
    trialEnd: sub.trial_end,
  }
}

/** Downgrades expired trials to free tier. Call from a server action, API route, or cron — not from reads. */
export async function downgradeExpiredTrial(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_end, tier')
    .eq('user_id', userId)
    .single()

  if (!sub) return false

  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null
  if (sub.status === 'trialing' && trialEnd && trialEnd <= new Date() && sub.tier === 'pro') {
    await supabase
      .from('subscriptions')
      .update({ tier: 'free', status: 'canceled' })
      .eq('user_id', userId)
    return true
  }

  return false
}

export async function requirePro(userId: string): Promise<{ allowed: boolean; subscription: SubscriptionInfo }> {
  const subscription = await getSubscription(userId)
  return { allowed: subscription.isPro, subscription }
}
