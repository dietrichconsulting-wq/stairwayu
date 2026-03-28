import { redirect } from 'next/navigation'
import { ScholarshipsPageClient } from '@/components/dashboard/ScholarshipsPageClient'
import { getAuthUser } from '@/lib/supabase/server'

export default async function ScholarshipsPage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')

  return <ScholarshipsPageClient userId={user.id} profile={profile} />
}
