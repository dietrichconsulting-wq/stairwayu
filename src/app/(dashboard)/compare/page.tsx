export const dynamic = "force-dynamic"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ComparePageClient } from '@/components/dashboard/ComparePageClient'

export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: colleges } = await supabase
    .from('user_colleges')
    .select('college_name')
    .eq('user_id', user.id)
    .order('sort_order')

  const collegeNames = (colleges ?? []).map((c: { college_name: string }) => c.college_name)

  return <ComparePageClient profile={profile} colleges={collegeNames} />
}
