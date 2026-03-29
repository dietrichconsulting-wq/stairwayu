import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUsage, FREE_DAILY_AI_LIMIT } from '@/lib/usage'
import { getSubscription } from '@/lib/subscription'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await getSubscription(user.id)
  const usage = await getUsage(user.id, subscription.isPro)

  return NextResponse.json({
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    isPro: subscription.isPro,
    dailyLimit: subscription.isPro ? null : FREE_DAILY_AI_LIMIT,
  })
}
