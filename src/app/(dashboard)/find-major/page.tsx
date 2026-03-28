import { redirect } from 'next/navigation'
import { FindMajorClient } from '@/components/dashboard/FindMajorClient'
import { getAuthUser } from '@/lib/supabase/server'

export default async function FindMajorPage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')
  if (!profile?.onboarding_complete) redirect('/onboarding')

  return <FindMajorClient userId={user.id} />
}
