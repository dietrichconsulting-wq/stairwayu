import { createServiceClient } from '@/lib/supabase/server'

/** Free-tier users get 3 AI calls per day. Pro users are unlimited. */
export const FREE_DAILY_AI_LIMIT = 3
export const FREE_COLLEGE_LIMIT = 4

export type UsageInfo = {
  used: number
  limit: number | null // null = unlimited (Pro)
  remaining: number | null // null = unlimited (Pro)
}

/** Get a user's AI usage for today (service role — bypasses RLS). */
export async function getUsage(userId: string, isPro: boolean): Promise<UsageInfo> {
  const supabase = await createServiceClient()
  const { data } = await supabase.rpc('get_daily_ai_usage', { p_user_id: userId })

  const used = data ?? 0

  if (isPro) {
    return { used, limit: null, remaining: null }
  }

  return {
    used,
    limit: FREE_DAILY_AI_LIMIT,
    remaining: Math.max(0, FREE_DAILY_AI_LIMIT - used),
  }
}

/**
 * Record an AI call and check the limit.
 * Returns true if the call is allowed, false if the daily limit is exceeded.
 * Pro users always return true.
 */
export async function recordAiUsage(userId: string, isPro: boolean): Promise<boolean> {
  if (isPro) {
    // Still record for analytics, but always allow
    const supabase = await createServiceClient()
    await supabase.rpc('record_ai_usage', { p_user_id: userId })
    return true
  }

  // Free tier: check limit before recording
  const supabase = await createServiceClient()
  const { data: currentCount } = await supabase.rpc('get_daily_ai_usage', { p_user_id: userId })

  if ((currentCount ?? 0) >= FREE_DAILY_AI_LIMIT) {
    return false
  }

  await supabase.rpc('record_ai_usage', { p_user_id: userId })
  return true
}
