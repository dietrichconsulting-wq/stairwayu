'use client'

import { useEffect, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useUserColleges } from '@/hooks/useUserColleges'
import { useTasks } from '@/hooks/useTasks'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import { ProfileStats } from './ProfileStats'
import { AdmissionSnapshot } from './AdmissionSnapshot'
import { TaskList } from './TaskList'
import { MajorExplorer } from './MajorExplorer'
import { useUpdateProfile } from '@/hooks/useProfile'

interface DashboardClientProps {
  userId: string
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const { data: profile, isLoading: profileLoading } = useProfile(userId)
  const { data: colleges = [], isLoading: collegesLoading } = useUserColleges(userId)
  const updateProfile = useUpdateProfile(userId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId)
  const { total: readinessTotal, isLoading: scoreLoading } = useReadinessScore(userId)

  function getSubtitle(score: number) {
    if (score <= 15) return "Let's get started — fill in your profile to begin."
    if (score <= 35) return 'Good start! Keep completing tasks to build momentum.'
    if (score <= 60) return "Making progress! You're on track for application season."
    if (score <= 85) return 'Looking strong! Stay focused on your remaining milestones.'
    return "Almost there! You're well-prepared for decision day."
  }

  const [referralToast, setReferralToast] = useState<string | null>(null)
  const fulfillAttempted = useRef(false)

  useEffect(() => {
    if (fulfillAttempted.current) return
    fulfillAttempted.current = true

    let code: string | null = null
    try { code = localStorage.getItem('stairwayu_ref') } catch {}

    // Also check if the profile was just created (within last 5 minutes)
    const isNewUser = profile?.created_at
      ? Date.now() - new Date(profile.created_at).getTime() < 5 * 60 * 1000
      : false

    if (!code && !isNewUser) return

    fetch('/api/referral/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code ?? undefined }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && !data?.already_fulfilled) {
          setReferralToast(`🎉 Welcome! You got 14 days of Pro, thanks to ${data.referrer_name}'s invite.`)
          try { localStorage.removeItem('stairwayu_ref') } catch {}
          setTimeout(() => setReferralToast(null), 6000)
        } else if (data?.success) {
          // Already fulfilled — still clear stale localStorage key
          try { localStorage.removeItem('stairwayu_ref') } catch {}
        }
      })
      .catch(() => {})
  // Only run once on mount — intentionally omitting profile from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ maxWidth: 900, width: '100%' }}>
      {/* Referral welcome toast */}
      {referralToast && (
        <div style={{
          background: 'rgba(99,102,241,0.15)',
          border: '1.5px solid rgba(99,102,241,0.35)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>{referralToast}</span>
          <button
            onClick={() => setReferralToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          {profileLoading ? '…' : `Welcome back, ${profile?.display_name?.split(' ')[0] || 'Student'} 👋`}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {scoreLoading ? 'Change your GPA, SAT, major, and schools to check your chance of getting in.' : getSubtitle(readinessTotal)}
        </p>
      </div>

      {/* Profile Stats */}
      <ProfileStats profile={profile} loading={profileLoading} tasks={tasks} userId={userId} />

      {/* Major Explorer */}
      {(!profile?.proposed_major || profile?.proposed_major === 'Undecided') ? (
        <MajorExplorer
          currentMajor={profile?.proposed_major}
          onSelectMajor={(major) => {
            updateProfile.mutate({ proposed_major: major })
            setReferralToast(`✓ Major set to ${major}`)
            setTimeout(() => setReferralToast(null), 3000)
          }}
        />
      ) : (
        <div style={{ marginBottom: 20 }}>
          <details key={profile.proposed_major} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 16px' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 500, userSelect: 'none' }}>
              🧭 Explore other majors
            </summary>
            <div style={{ marginTop: 16 }}>
              <MajorExplorer
                currentMajor={profile.proposed_major}
                onSelectMajor={(major) => {
                  updateProfile.mutate({ proposed_major: major })
                  setReferralToast(`✓ Major set to ${major}`)
                  setTimeout(() => setReferralToast(null), 3000)
                }}
              />
            </div>
          </details>
        </div>
      )}

      {/* Admission Snapshot */}
      <AdmissionSnapshot profile={profile} colleges={colleges} loading={profileLoading || collegesLoading} />

      {/* Task list */}
      <div style={{ marginTop: 20 }}>
        <TaskList tasks={tasks} loading={tasksLoading} userId={userId} />
      </div>
    </div>
  )
}
