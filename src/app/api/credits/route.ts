import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCredits, CREDITS_PER_AI_CALL } from '@/lib/credits'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const credits = await getCredits(user.id)
  return NextResponse.json({
    balance: credits.balance,
    callsRemaining: credits.callsRemaining,
    creditsPerCall: CREDITS_PER_AI_CALL,
  })
}
