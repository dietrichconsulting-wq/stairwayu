import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_CODES: Record<string, { days: number }> = {
  'stairway tester': { days: 7 },
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { code } = await req.json()
  const normalized = (code ?? '').trim().toLowerCase()
  const promo = VALID_CODES[normalized]

  if (!promo) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + promo.days)

  // Check if user already has a subscription row
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, tier, status')
    .eq('user_id', user.id)
    .single()

  if (existing?.tier === 'pro' && (existing?.status === 'active' || existing?.status === 'trialing')) {
    return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
  }

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({
        tier: 'pro',
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'pro',
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
        cancel_at_period_end: false,
      })
  }

  return NextResponse.json({ success: true, trial_end: trialEnd.toISOString() })
}
