export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { TrialBanner } from '@/components/dashboard/TrialBanner'
import { AuthHashHandler } from '@/components/dashboard/AuthHashHandler'
import { CelebrationToastContainer } from '@/components/CelebrationToast'
import { getAuthUser } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, subscription } = await getAuthUser()

  if (!user) redirect('/login')

  // Block access if no active subscription or trial
  const isActive = subscription?.tier === 'pro' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing')

  // If trialing, also verify the trial hasn't expired
  const trialStillValid = subscription?.status !== 'trialing' ||
    (subscription?.trial_end && new Date(subscription.trial_end) > new Date())

  if (!isActive || !trialStillValid) {
    redirect('/upgrade')
  }

  return (
    <div className="sidebar-layout">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Sidebar
        user={user}
        profile={profile}
        subscription={subscription}
      />
      <main id="main-content" className="sidebar-layout__content">
        <AuthHashHandler />
        <TrialBanner status={subscription?.status ?? null} trialEnd={subscription?.trial_end ?? null} tier={subscription?.tier ?? null} />
        {children}
        <CelebrationToastContainer />
      </main>
    </div>
  )
}
