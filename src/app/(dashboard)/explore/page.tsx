export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExplorePlayground } from '@/components/dashboard/ExplorePlayground'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('gpa, gpa_weighted, sat, act_score, home_state, proposed_major')
    .eq('id', user.id)
    .single()

  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')

  const collegeNames = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <ExplorePlayground profile={profile} collegeNames={collegeNames} userId={user.id} />
}
