import { createServiceClient } from '@/lib/supabase/server'

/** Daily AI call caps by account tier. Pro users are unlimited. */
export const FREE_DAILY_AI_LIMIT = 3
export const PILOT_DAILY_AI_LIMIT = 20
export const FREE_COLLEGE_LIMIT = 8

export type UsageInfo = {
  used: number
  limit: number | null // null = unlimited (Pro)
  remaining: number | null // null = unlimited (Pro)
}

/** Resolve the daily AI limit for a user based on subscription + account_tier. */
async function getDailyLimit(userId: string, isPro: boolean): Promise<number | null> {
  if (isPro) return null // unlimited

  // Check for pilot_free tier on the profile
  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier')
    .eq('user_id', userId)
    .single()

  if (profile?.account_tier === 'pilot_free') return PILOT_DAILY_AI_LIMIT
  if (profile?.account_tier === 'admin') return null // unlimited

  return FREE_DAILY_AI_LIMIT
}

/** Get a user's AI usage for today (service role — bypasses RLS). */
export async function getUsage(userId: string, isPro: boolean): Promise<UsageInfo> {
  const supabase = await createServiceClient()
  const { data } = await supabase.rpc('get_daily_ai_usage', { p_user_id: userId })

  const used = data ?? 0
  const limit = await getDailyLimit(userId, isPro)

  if (limit === null) {
    return { used, limit: null, remaining: null }
  }

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

/**
 * Record an AI call and check the limit.
 * Returns true if the call is allowed, false if the daily limit is exceeded.
 * Pro users always return true.
 */
export async function recordAiUsage(userId: string, isPro: boolean): Promise<boolean> {
  const limit = await getDailyLimit(userId, isPro)

  if (limit === null) {
    // Unlimited — still record for analytics
    const supabase = await createServiceClient()
    await supabase.rpc('record_ai_usage', { p_user_id: userId })
    return true
  }

  // Capped tier: check limit before recording
  const supabase = await createServiceClient()
  const { data: currentCount } = await supabase.rpc('get_daily_ai_usage', { p_user_id: userId })

  if ((currentCount ?? 0) >= limit) {
    return false
  }

  await supabase.rpc('record_ai_usage', { p_user_id: userId })
  return true
}
