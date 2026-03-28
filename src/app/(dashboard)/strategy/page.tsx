import { redirect } from 'next/navigation'
import { StrategyPageClient } from '@/components/dashboard/StrategyPageClient'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export default async function StrategyPage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')

  const collegeNames = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <StrategyPageClient profile={profile} colleges={collegeNames} userId={user.id} />
}
