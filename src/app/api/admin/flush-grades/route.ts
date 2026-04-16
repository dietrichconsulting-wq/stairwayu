import { NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/supabase/server'

/**
 * POST /api/admin/flush-grades
 *
 * Truncates the program_grades cache table. Call this after a new
 * College Scorecard data release (~annually, every fall). Grades will
 * repopulate lazily as college pages are visited.
 *
 * Requires admin account_tier.
 */
export async function POST() {
  const { user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier')
    .eq('id', user.id)
    .single()

  if (profile?.account_tier !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Count before flush
  const { count } = await supabase
    .from('program_grades')
    .select('id', { count: 'exact', head: true })

  // Delete all cached grades
  const { error } = await supabase
    .from('program_grades')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Supabase requires a filter — this matches all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Program grades cache flushed',
    rowsDeleted: count ?? 0,
  })
}
