import { redirect } from 'next/navigation'
import { FinancialPlanner } from '@/components/dashboard/FinancialPlanner'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export default async function FinancePage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')
  const savedColleges = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <FinancialPlanner savedColleges={savedColleges} homeState={profile?.home_state ?? null} />
}
