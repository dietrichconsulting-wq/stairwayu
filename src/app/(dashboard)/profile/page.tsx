import { redirect } from 'next/navigation'
import { ProfilePageClient } from '@/components/dashboard/ProfilePageClient'
import { getAuthUser } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')
  return <ProfilePageClient userId={user.id} />
}
