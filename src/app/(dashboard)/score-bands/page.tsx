export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScoreBandBrowser } from '@/components/dashboard/ScoreBandBrowser'

export default async function ScoreBandsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gpa, gpa_weighted, sat, act_score, home_state')
    .eq('id', user.id)
    .single()

  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')

  const collegeNames = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <ScoreBandBrowser profile={profile} collegeNames={collegeNames} userId={user.id} />
}
