export const dynamic = "force-dynamic"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StrategyPageClient } from '@/components/dashboard/StrategyPageClient'

export default async function StrategyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gpa, gpa_weighted, sat, proposed_major, strategy_result, strategy_generated_at')
    .eq('id', user.id)
    .single()

  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')

  const collegeNames = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <StrategyPageClient profile={profile} colleges={collegeNames} userId={user.id} />
}
