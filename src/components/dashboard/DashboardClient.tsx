'use client'

import { useEffect, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useUserColleges } from '@/hooks/useUserColleges'
import { useTasks } from '@/hooks/useTasks'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import { ProfileStats } from './ProfileStats'
import { AdmissionSnapshot } from './AdmissionSnapshot'
import { TaskList } from './TaskList'
import { useUpdateProfile } from '@/hooks/useProfile'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardClientProps {
  userId: string
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const { data: profile, isLoading: profileLoading } = useProfile(userId)
  const { data: colleges = [], isLoading: collegesLoading } = useUserColleges(userId)
  const updateProfile = useUpdateProfile(userId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId)
  const { total: readinessTotal, dimensions, topActions, isLoading: scoreLoading } = useReadinessScore(userId)

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

  // Journey ring helpers
  const ringSize = 120
  const ringStroke = 10
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (readinessTotal / 100) * ringCircumference
  function ringColor(score: number) {
    if (score <= 30) return '#EF4444'
    if (score <= 60) return '#FBBF24'
    if (score <= 85) return '#22D3EE'
    return '#34D399'
  }

  const QUICK_ACTIONS = [
    { label: 'Compare Schools', href: '/compare', icon: '⚖️' },
    { label: 'Start Essay', href: '/essays', icon: '✍️' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆' },
  ]

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

      {/* ── Section 1: Profile Stats ── */}
      <ProfileStats profile={profile} loading={profileLoading} tasks={tasks} userId={userId} />

      {/* ── Section 2: Two-column grid — Admission Chances + Journey Progress ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 20,
        marginTop: 20,
        alignItems: 'start',
      }}
        className="dashboard-mid-grid"
      >
        {/* Left: Admission Snapshot */}
        <AdmissionSnapshot profile={profile} colleges={colleges} loading={profileLoading || collegesLoading} />

        {/* Right: Journey Progress ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-elevated"
          style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: 0, alignSelf: 'flex-start' }}>
            Journey Progress
          </h2>

          {scoreLoading ? (
            <div className="skeleton" style={{ width: ringSize, height: ringSize, borderRadius: '50%' }} />
          ) : (
            <div style={{ position: 'relative', width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                  fill="none" stroke="var(--color-border)" strokeWidth={ringStroke}
                />
                <motion.circle
                  cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
                  fill="none" stroke={ringColor(readinessTotal)} strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                  {readinessTotal}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>of 100</span>
              </div>
            </div>
          )}

          {/* Dimension breakdown */}
          {!scoreLoading && dimensions && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {([
                { key: 'profile' as const, label: 'Profile' },
                { key: 'tasks' as const, label: 'Tasks' },
                { key: 'milestones' as const, label: 'Milestones' },
                { key: 'scholarships' as const, label: 'Scholarships' },
                { key: 'momentum' as const, label: 'Momentum' },
              ]).map(({ key, label }) => {
                const dim = dimensions[key]
                const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                      <span>{label}</span>
                      <span>{dim.score}/{dim.max}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', background: ringColor(pct), borderRadius: 99 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Top actions */}
          {!scoreLoading && topActions.length > 0 && (
            <div style={{ width: '100%', borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Next steps
              </div>
              {topActions.map((action, i) => (
                <div key={i} style={{ fontSize: 12, color: 'var(--color-text)', padding: '3px 0', lineHeight: 1.4 }}>
                  {action}
                </div>
              ))}
            </div>
          )}

          <Link
            href="/journey"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
          >
            View full journey →
          </Link>
        </motion.div>
      </div>

      {/* ── Section 3: Quick Actions ── */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 20,
        flexWrap: 'wrap',
      }}>
        {QUICK_ACTIONS.map(({ label, href, icon }) => (
          <Link
            key={href}
            href={href}
            style={{
              flex: '1 1 0',
              minWidth: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 6%, var(--color-card))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.background = 'var(--color-card)'
            }}
          >
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </Link>
        ))}
      </div>

      {/* ── Section 4: Task list (collapsed to 5) ── */}
      <div style={{ marginTop: 20 }}>
        <TaskList tasks={tasks} loading={tasksLoading} userId={userId} collapsedMax={5} />
      </div>
    </div>
  )
}
