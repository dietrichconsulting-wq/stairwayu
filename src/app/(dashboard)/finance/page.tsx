export const dynamic = "force-dynamic"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinancialPlanner } from '@/components/dashboard/FinancialPlanner'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')
  const savedColleges = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <FinancialPlanner savedColleges={savedColleges} />
}
