import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/server'

export async function GET() {
  const { user } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only allow admin users
  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier')
    .eq('id', user.id)
    .single()

  if (profile?.account_tier !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Run all queries in parallel
  const [tierBreakdown, aiUsage30d, totalUsers, recentSignups, topAiUsers] = await Promise.all([
    // 1. Users by tier + subscription status
    supabase.rpc('admin_tier_breakdown'),

    // 2. AI usage per tier per day (last 30 days)
    supabase.rpc('admin_ai_usage_30d'),

    // 3. Total user count
    supabase.from('profiles').select('id', { count: 'exact', head: true }),

    // 4. Recent signups (last 14 days)
    supabase
      .from('profiles')
      .select('id, display_name, account_tier, created_at')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(20),

    // 5. Top AI users (last 7 days)
    supabase.rpc('admin_top_ai_users'),
  ])

  return NextResponse.json({
    tierBreakdown: tierBreakdown.data ?? [],
    aiUsage30d: aiUsage30d.data ?? [],
    totalUsers: totalUsers.count ?? 0,
    recentSignups: recentSignups.data ?? [],
    topAiUsers: topAiUsers.data ?? [],
  })
}
