import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const service = await createServiceClient()
  const uid = user.id

  // Delete all user data from every table (order matters for FK constraints).
  // NOTE: public.trial_claims is intentionally NOT listed — it persists past
  // deletion to prevent trial farming via delete-and-resignup. Do not add it.
  const tables = [
    { table: 'referral_completions', column: 'referrer_id' },
    { table: 'referral_completions', column: 'referred_id' },
    { table: 'referrals', column: 'referrer_id' },
    { table: 'ai_usage', column: 'user_id' },
    { table: 'email_preferences', column: 'user_id' },
    { table: 'progress', column: 'user_id' },
    { table: 'scholarships', column: 'user_id' },
    { table: 'tasks', column: 'user_id' },
    { table: 'user_colleges', column: 'user_id' },
    { table: 'subscriptions', column: 'user_id' },
    { table: 'profiles', column: 'id' },
  ]

  for (const { table, column } of tables) {
    const { error } = await service.from(table).delete().eq(column, uid)
    if (error) {
      console.error(`Failed to delete from ${table}:`, error.message)
    }
  }

  // Delete the auth user
  const { error: authError } = await service.auth.admin.deleteUser(uid)
  if (authError) {
    console.error('Failed to delete auth user:', authError.message)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
