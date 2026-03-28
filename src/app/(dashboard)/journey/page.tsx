import { redirect } from 'next/navigation'
import { JourneyClient } from '@/components/dashboard/JourneyClient'
import { getAuthUser } from '@/lib/supabase/server'

export default async function JourneyPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')
  return <JourneyClient userId={user.id} />
}
