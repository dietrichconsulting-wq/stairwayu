import { createServiceClient } from '@/lib/supabase/server'

export const CREDITS_PER_AI_CALL = 20
export const MONTHLY_CREDIT_GRANT = 1000
export const CREDIT_PACK_AMOUNT = 400
export const CREDIT_PACK_PRICE_CENTS = 500 // $5.00

export type CreditInfo = {
  balance: number
  callsRemaining: number
}

/** Get a user's current credit balance (service role — bypasses RLS). */
export async function getCredits(userId: string): Promise<CreditInfo> {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single()

  const balance = data?.balance ?? 0
  return { balance, callsRemaining: Math.floor(balance / CREDITS_PER_AI_CALL) }
}

/**
 * Deduct credits for an AI call. Returns true if successful, false if insufficient.
 * Uses a conditional update to prevent going negative (race-safe).
 */
export async function deductCredits(
  userId: string,
  amount: number = CREDITS_PER_AI_CALL,
  reason: string = 'ai_call',
): Promise<boolean> {
  const supabase = await createServiceClient()

  // Atomic deduct: only succeeds if balance >= amount
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
  })

  if (error || !data) return false
  return true
}

/**
 * Grant credits to a user (subscription renewal, credit pack purchase, etc).
 */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  stripeSessionId?: string,
): Promise<boolean> {
  const supabase = await createServiceClient()

  const { data, error } = await supabase.rpc('grant_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_stripe_session_id: stripeSessionId ?? null,
  })

  if (error || !data) return false
  return true
}
