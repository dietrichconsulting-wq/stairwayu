import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_CODES: Record<string, { days: number; repeatable?: boolean }> = {
  'stairway tester': { days: 7 },
  'stairway climber': { days: 7, repeatable: true },
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

  if (!promo.repeatable && existing?.tier === 'pro' && (existing?.status === 'active' || existing?.status === 'trialing')) {
    return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 })
  }

  // Use service role client to bypass RLS for subscription writes
  const admin = await createServiceClient()

  if (existing) {
    const { error } = await admin
      .from('subscriptions')
      .update({
        tier: 'pro',
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
      })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 })
  } else {
    const { error } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier: 'pro',
        status: 'trialing',
        trial_end: trialEnd.toISOString(),
        current_period_end: trialEnd.toISOString(),
        cancel_at_period_end: false,
      })
    if (error) return NextResponse.json({ error: 'Failed to activate trial' }, { status: 500 })
  }

  // Bust the Next.js cache so the dashboard layout sees the updated subscription
  revalidatePath('/dashboard')
  revalidatePath('/(dashboard)', 'layout')

  return NextResponse.json({ success: true, trial_end: trialEnd.toISOString() })
}
