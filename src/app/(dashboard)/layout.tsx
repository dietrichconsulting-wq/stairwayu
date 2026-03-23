export const dynamic = "force-dynamic"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { AuthHashHandler } from '@/components/dashboard/AuthHashHandler'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, status, trial_end, billing_interval')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="sidebar-layout">
      <Sidebar
        user={user}
        profile={profile}
        subscription={subscription}
      />
      <main className="sidebar-layout__content">
        <AuthHashHandler />
        <TrialBanner status={subscription?.status ?? null} trialEnd={subscription?.trial_end ?? null} tier={subscription?.tier ?? null} />
        {children}
      </main>
    </div>
  )
}
