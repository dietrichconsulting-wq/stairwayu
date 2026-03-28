import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { getAuthUser } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')
  if (!profile?.onboarding_complete) redirect('/onboarding')

  return <DashboardClient userId={user.id} />
}
