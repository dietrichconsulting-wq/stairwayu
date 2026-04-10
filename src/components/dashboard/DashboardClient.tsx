'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useUserColleges } from '@/hooks/useUserColleges'
import { useTasks } from '@/hooks/useTasks'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import { useMilestones } from '@/hooks/useMilestones'
import { MILESTONES } from '@/lib/milestones'
import { ProfileStats } from './ProfileStats'
import { AdmissionSnapshot } from './AdmissionSnapshot'
import { TaskList } from './TaskList'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useStreak } from '@/hooks/useStreak'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { showToast } from '@/components/CelebrationToast'
import { WelcomeTour } from './WelcomeTour'
import { DailyChallenges } from './DailyChallenges'
import { Tooltip } from '@/components/ui/Tooltip'
import { scoreECs, EC_TIER_POINTS } from '@/lib/services/admissionChance'

interface DashboardClientProps {
  userId: string
}

export function DashboardClient({ userId }: DashboardClientProps) {
  const { data: profile, isLoading: profileLoading } = useProfile(userId)
  const { data: colleges = [], isLoading: collegesLoading } = useUserColleges(userId)
  const updateProfile = useUpdateProfile(userId)
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(userId)
  const { total: readinessTotal, dimensions, topActions, isLoading: scoreLoading } = useReadinessScore(userId)
  const { streak, isLoading: streakLoading } = useStreak(userId)
  const milestonesQuery = useMilestones(userId)
  const reachedKeys = new Set((milestonesQuery.data ?? []).map((m: { milestone_key: string }) => m.milestone_key))
  const nextMilestone = MILESTONES.find(m => !reachedKeys.has(m.key)) ?? null
  const allDone = reachedKeys.size === MILESTONES.length

  function getSubtitle(score: number) {
    if (score <= 15) return "Let's get started — your future self will thank you."
    if (score <= 35) return "You're picking up speed — colleges are gonna notice."
    if (score <= 60) return "You're ahead of most applicants right now. Keep going."
    if (score <= 85) return "You're crushing it — almost everything is dialed in."
    return "You're basically ready to hit submit. Let's go. 🎯"
  }

  // ── Welcome tour ──
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (!profileLoading && profile && profile.onboarding_complete && !profile.walkthrough_complete) {
      try { if (localStorage.getItem('stairwayu_tour_done')) return } catch {}
      const timer = setTimeout(() => setShowTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [profileLoading, profile])

  const handleTourComplete = useCallback(() => {
    setShowTour(false)
    try { localStorage.setItem('stairwayu_tour_done', '1') } catch {}
    updateProfile.mutate({ walkthrough_complete: true })
  }, [updateProfile])

  const [referralToast, setReferralToast] = useState<string | null>(null)
  const [referralError, setReferralError] = useState(false)
  const fulfillAttempted = useRef(false)
  const referralCodeRef = useRef<string | null>(null)

  const fulfillReferral = useCallback(() => {
    let code = referralCodeRef.current
    if (code === null) {
      try { code = localStorage.getItem('stairwayu_ref') } catch {}
      referralCodeRef.current = code
    }

    // Also check if the profile was just created (within last 5 minutes)
    const isNewUser = profile?.created_at
      ? Date.now() - new Date(profile.created_at).getTime() < 5 * 60 * 1000
      : false

    if (!code && !isNewUser) return

    setReferralError(false)
    fetch('/api/referral/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code ?? undefined }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && !data?.already_fulfilled) {
          setReferralToast(`🎉 Welcome! You were invited by ${data.referrer_name}.`)
          try { localStorage.removeItem('stairwayu_ref') } catch {}
          setTimeout(() => setReferralToast(null), 6000)
        } else if (data?.success) {
          // Already fulfilled — still clear stale localStorage key
          try { localStorage.removeItem('stairwayu_ref') } catch {}
        }
      })
      .catch(() => setReferralError(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (fulfillAttempted.current) return
    fulfillAttempted.current = true
    fulfillReferral()
  // Only run once on mount — intentionally omitting profile from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Progress toasts (once per session per threshold) ──
  const progressToastFired = useRef(new Set<number>())
  const milestonePct = useMemo(() => {
    if (milestonesQuery.isLoading) return null
    return Math.round((reachedKeys.size / MILESTONES.length) * 100)
  }, [reachedKeys.size, milestonesQuery.isLoading])

  useEffect(() => {
    if (scoreLoading || milestonePct === null) return
    const thresholds = [
      { score: 25, msg: "You just passed 25% — you're already ahead of most students.", emoji: '🌱' },
      { score: 40, msg: "40% and climbing — your odds just went up ↑", emoji: '📈' },
      { score: 60, msg: "60% done — you're outpacing most applicants right now.", emoji: '🔥' },
      { score: 75, msg: "75% — you're in the home stretch. Almost there.", emoji: '🚀' },
      { score: 90, msg: "90% ready — colleges are going to love this application.", emoji: '🌟' },
    ]
    for (const t of thresholds) {
      if (readinessTotal >= t.score && !progressToastFired.current.has(t.score)) {
        progressToastFired.current.add(t.score)
        // Delay so it doesn't compete with page load animations
        setTimeout(() => showToast({ message: t.msg, emoji: t.emoji, duration: 5000 }), 1500)
        break // Only show one toast per load
      }
    }
  }, [readinessTotal, scoreLoading, milestonePct])

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
    { label: 'Compare Schools', href: '/compare', icon: '⚖️', tip: 'Compare tuition, admit rates, and stats side-by-side for your saved schools.' },
    { label: 'Start Essay', href: '/essays', icon: '✍️', tip: 'Discover your best essay angle and get feedback that keeps your authentic voice.' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆', tip: 'Discover scholarships matched to your profile and major.' },
  ]

  // Share with Family
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const handleShare = async () => {
    setShareLoading(true)
    try {
      const res = await fetch('/api/share', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (data.link?.token) {
        const url = `${window.location.origin}/share/${data.link.token}`
        setShareUrl(url)
        await navigator.clipboard.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 3000)
      }
    } catch {}
    setShareLoading(false)
  }

  return (
    <div style={{ maxWidth: 900, width: '100%' }}>
      {/* Referral error banner */}
      {referralError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1.5px solid rgba(239,68,68,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 13,
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>Couldn&apos;t process your referral link.</span>
          <button
            onClick={() => { fulfillAttempted.current = false; fulfillReferral() }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#EF4444', padding: 0, flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {profileLoading ? '…' : `Welcome back, ${profile?.display_name?.split(' ')[0] || 'Student'} 👋`}
          </h1>
          {!streakLoading && streak > 0 && (
            <Tooltip text="Your login streak. Visit the dashboard each day to keep it going and earn bonus XP." position="bottom">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 99,
                background: streak >= 7
                  ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                  : streak >= 3
                    ? 'linear-gradient(135deg, #F59E0B, #F97316)'
                    : 'color-mix(in srgb, var(--color-primary) 12%, var(--color-card))',
                border: streak >= 3 ? 'none' : '1.5px solid var(--color-border)',
                color: streak >= 3 ? '#fff' : 'var(--color-text)',
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
              {streak}-day streak
            </motion.div>
            </Tooltip>
          )}
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {scoreLoading ? 'Loading your progress…' : getSubtitle(readinessTotal)}
        </p>
      </div>

      {/* ── What's Next card ── */}
      {milestonesQuery.isLoading ? (
        <div className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 20 }} />
      ) : (
        <Link href="/journey" data-tour="whats-next" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-card))',
              border: '1.5px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            whileHover={{ borderColor: 'var(--color-primary)' }}
          >
            <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>
              {allDone ? '\u{1F389}' : nextMilestone?.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Tooltip text="Your next milestone on the college application journey. Click to see the full roadmap." position="right">
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)', marginBottom: 2 }}>
                {allDone ? 'Journey Complete' : `${nextMilestone?.phase} phase`}
              </div>
              </Tooltip>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                {allDone
                  ? 'All milestones reached \u2014 congratulations!'
                  : `Next up: ${nextMilestone?.label}`}
              </div>
              {!allDone && nextMilestone && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {nextMilestone.desc}
                </div>
              )}
            </div>
            <span style={{ fontSize: 18, color: 'var(--color-primary)', flexShrink: 0 }}>{'\u2192'}</span>
          </motion.div>
        </Link>
      )
      }

      {/* ── Daily Challenges ── */}
      <DailyChallenges userId={userId} />

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
          className="card-elevated journey-progress-card"
          data-tour="readiness-score"
          style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <Tooltip text="Your overall readiness score across 5 dimensions: profile completeness, tasks done, milestones reached, scholarships found, and daily momentum." position="right" maxWidth={260}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: 0, alignSelf: 'flex-start' }}>
            Journey Progress
          </h2>
          </Tooltip>

          {scoreLoading ? (
            <div className="skeleton" style={{ width: ringSize, height: ringSize, borderRadius: '50%' }} />
          ) : (
            <div className="journey-ring-wrap" style={{ position: 'relative', width: ringSize, height: ringSize }}>
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
                { key: 'profile' as const, label: 'Profile', tip: 'Points earned by filling in your GPA, test scores, major, home state, and grad year.' },
                { key: 'tasks' as const, label: 'Tasks', tip: 'Points for completing to-do items like requesting transcripts and writing essays.' },
                { key: 'milestones' as const, label: 'Milestones', tip: 'Key checkpoints on your journey, from building a school list to submitting apps.' },
                { key: 'scholarships' as const, label: 'Scholarships', tip: 'Points for saving and applying to scholarships.' },
                { key: 'momentum' as const, label: 'Momentum', tip: 'Bonus points for staying active — login streaks and recent activity.' },
              ]).map(({ key, label, tip }) => {
                const dim = dimensions[key]
                const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 2 }}>
                      <Tooltip text={tip} position="left" maxWidth={200}><span>{label}</span></Tooltip>
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

      {/* ── EC Score Summary ── */}
      {!profileLoading && (() => {
        const ecEntries = profile?.ec_entries?.filter(e => e.name.trim()) ?? []
        const ecScore = scoreECs(ecEntries)
        const hasECs = ecEntries.length > 0

        return (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated"
            style={{ padding: '16px 20px', marginTop: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <Tooltip text="Your extracurricular score is computed from your top 5 activities by tier. This factors directly into your admission odds." position="bottom" maxWidth={260}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: hasECs
                    ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-column))'
                    : 'var(--color-column)',
                  border: hasECs
                    ? '1.5px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))'
                    : '1.5px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>
                  {hasECs ? '🏆' : '📋'}
                </div>
                </Tooltip>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                    {hasECs ? (
                      <>Extracurricular Score: <span style={{ color: 'var(--color-primary)' }}>{ecScore}/15</span></>
                    ) : (
                      'Add your extracurriculars'
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 1 }}>
                    {hasECs ? (
                      <>
                        {ecEntries.length} activit{ecEntries.length === 1 ? 'y' : 'ies'} tracked
                        {ecScore < 15 && ' — add stronger activities to boost your score'}
                      </>
                    ) : (
                      'Activities factor into your admission odds — higher tiers = more impact'
                    )}
                  </div>
                </div>
              </div>

              {hasECs && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {[1, 2, 3, 4].map(tier => {
                    const count = ecEntries.filter(e => e.tier === tier).length
                    if (count === 0) return null
                    const colors = tier === 1
                      ? { bg: 'rgba(251,191,36,0.12)', text: '#D97706', border: 'rgba(251,191,36,0.3)' }
                      : tier === 2
                        ? { bg: 'rgba(52,211,153,0.10)', text: '#059669', border: 'rgba(52,211,153,0.25)' }
                        : tier === 3
                          ? { bg: 'rgba(96,165,250,0.10)', text: '#2563EB', border: 'rgba(96,165,250,0.25)' }
                          : { bg: 'rgba(148,163,184,0.10)', text: '#64748B', border: 'rgba(148,163,184,0.25)' }
                    return (
                      <Tooltip key={tier} text={`${count} Tier ${tier} activit${count === 1 ? 'y' : 'ies'} (+${EC_TIER_POINTS[tier]} pts each)`} position="top">
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 12,
                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        whiteSpace: 'nowrap',
                      }}>
                        T{tier} ×{count}
                      </span>
                      </Tooltip>
                    )
                  })}
                </div>
              )}

              <Link
                href="/profile"
                style={{
                  fontSize: 12, fontWeight: 700, color: 'var(--color-primary)',
                  textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                {hasECs ? 'Edit activities →' : '+ Add activities →'}
              </Link>
            </div>
          </motion.div>
        )
      })()}

      {/* ── Section 3: Quick Actions ── */}
      <div data-tour="quick-actions" style={{
        display: 'flex',
        gap: 12,
        marginTop: 20,
        flexWrap: 'wrap',
      }}>
        {QUICK_ACTIONS.map(({ label, href, icon, tip }) => (
          <Tooltip key={href} text={tip} position="bottom">
          <Link
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
          </Tooltip>
        ))}
      </div>

      {/* ── Share with Family ── */}
      <div style={{
        marginTop: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '14px 18px',
        borderRadius: 12,
        border: '1.5px solid var(--color-border)',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(168,85,247,0.06))',
      }}>
        <span style={{ fontSize: 20 }}>🎓</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            Share with Family
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Send your college list to family — they can see your schools, odds, and contribute to your 529.
          </div>
        </div>
        <button
          onClick={handleShare}
          disabled={shareLoading}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: shareCopied ? '#22c55e' : 'var(--color-primary)',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: shareLoading ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {shareCopied ? '✓ Link Copied!' : shareLoading ? 'Creating…' : 'Copy Share Link'}
        </button>
      </div>
      {shareUrl && !shareCopied && (
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
          {shareUrl}
        </div>
      )}

      {/* ── Section 4: Task list (collapsed to 5) ── */}
      <div style={{ marginTop: 20 }}>
        <TaskList tasks={tasks} loading={tasksLoading} userId={userId} collapsedMax={5} />
      </div>

      {/* ── Welcome tour (fires once after onboarding) ── */}
      {showTour && <WelcomeTour onComplete={handleTourComplete} />}
    </div>
  )
}
