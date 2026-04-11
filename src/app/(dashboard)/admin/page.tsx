import { redirect } from 'next/navigation'
import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'

export default async function AdminPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createServiceClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_tier')
    .eq('id', user.id)
    .single()

  if (profile?.account_tier !== 'admin') {
    redirect('/dashboard')
  }

  return <AdminDashboard />
}
