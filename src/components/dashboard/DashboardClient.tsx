'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useUserColleges, useAddCollege } from '@/hooks/useUserColleges'
import { useTasks } from '@/hooks/useTasks'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import { ProfileStats } from './ProfileStats'
import { AdmissionSnapshot } from './AdmissionSnapshot'
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
  const addCollege = useAddCollege(userId)
  const updateProfile = useUpdateProfile(userId)
  const { data: tasks = [] } = useTasks(userId)
  const { total: readinessTotal, isLoading: scoreLoading } = useReadinessScore(userId)
  const { streak, isLoading: streakLoading } = useStreak(userId)

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

  useEffect(() => {
    if (scoreLoading) return
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
        setTimeout(() => showToast({ message: t.msg, emoji: t.emoji, duration: 5000 }), 1500)
        break
      }
    }
  }, [readinessTotal, scoreLoading])

  // ── View mode (Student / Family) — persists in localStorage ──
  // Student → dark theme; Family → light theme (swapped via data-theme on <html>)
  const [viewMode, setViewModeState] = useState<'student' | 'family'>('student')
  const [hintDismissed, setHintDismissed] = useState(true) // default hidden until mount check
  useEffect(() => {
    try {
      const saved = localStorage.getItem('stairwayu_view_mode')
      if (saved === 'family' || saved === 'student') setViewModeState(saved)
      setHintDismissed(localStorage.getItem('stairwayu_view_mode_hint_seen') === '1')
    } catch {}
  }, [])
  useEffect(() => {
    // Sync theme to view mode — family always renders in light so the switch is unmistakable
    const html = document.documentElement
    if (viewMode === 'family') html.removeAttribute('data-theme')
    else html.setAttribute('data-theme', 'dark')
    return () => { html.setAttribute('data-theme', 'dark') }
  }, [viewMode])
  const setViewMode = useCallback((next: 'student' | 'family') => {
    setViewModeState(next)
    setHintDismissed(true)
    try {
      localStorage.setItem('stairwayu_view_mode', next)
      localStorage.setItem('stairwayu_view_mode_hint_seen', '1')
    } catch {}
  }, [])

  const QUICK_ACTIONS_STUDENT = [
    { label: 'Compare Schools', href: '/compare', icon: '⚖️', tip: 'Compare tuition, admit rates, and stats side-by-side for your saved schools.' },
    { label: 'Start Essay', href: '/essays', icon: '✍️', tip: 'Discover your best essay angle and get feedback that keeps your authentic voice.' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆', tip: 'Discover scholarships matched to your profile and major.' },
  ]
  const QUICK_ACTIONS_FAMILY = [
    { label: 'Finance Plan', href: '/finance', icon: '💵', tip: 'Plan how to pay for college — aid, loans, and family contribution.' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆', tip: 'Discover scholarships matched to your student\'s profile and major.' },
    { label: 'Compare Costs', href: '/compare', icon: '⚖️', tip: 'Compare tuition and net price side-by-side for your saved schools.' },
  ]
  const QUICK_ACTIONS = viewMode === 'family' ? QUICK_ACTIONS_FAMILY : QUICK_ACTIONS_STUDENT

  // Share with Family + Pledges
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [pledgeTotal, setPledgeTotal] = useState(0)
  const [pledgeCount, setPledgeCount] = useState(0)

  // Load existing share link + pledges on mount
  useEffect(() => {
    fetch('/api/share').then(r => r.json()).then(data => {
      if (data.link?.token) {
        setShareUrl(`${window.location.origin}/share/${data.link.token}`)
      }
    }).catch(() => {})
    // Load pledge totals
    const sb = (async () => {
      const { createClient: cc } = await import('@/lib/supabase/client')
      const s = cc()
      const { data } = await s
        .from('gift_pledges')
        .select('amount')
        .eq('user_id', userId)
      if (data && data.length > 0) {
        setPledgeTotal(data.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0))
        setPledgeCount(data.length)
      }
    })
    sb()
  }, [userId])

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

      {/* ── View mode toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, position: 'relative' }}>
        <div
          role="tablist"
          aria-label="View mode"
          style={{
            display: 'inline-flex',
            padding: 3,
            borderRadius: 99,
            background: 'var(--color-column)',
            border: '1.5px solid var(--color-border)',
            gap: 2,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {([
            { key: 'student', label: 'Student', icon: '🎓' },
            { key: 'family', label: 'Family', icon: '👪' },
          ] as const).map(opt => {
            const active = viewMode === opt.key
            return (
              <button
                key={opt.key}
                role="tab"
                aria-selected={active}
                onClick={() => setViewMode(opt.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 99, border: 'none',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text-muted)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14 }}>{opt.icon}</span>
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Hand-drawn "try Family mode" hint — dismisses on first click */}
        {!hintDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            aria-hidden
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 28,
              width: 180,
              pointerEvents: 'none',
              zIndex: 0,
              color: 'var(--color-text-muted)',
              fontFamily: '"Caveat", "Patrick Hand", "Bradley Hand", cursive',
              fontSize: 18,
              lineHeight: 1.15,
              textAlign: 'center',
            }}
          >
            <svg
              width="80"
              height="72"
              viewBox="0 0 80 72"
              style={{
                position: 'absolute',
                top: -4,
                right: 30,
                overflow: 'visible',
              }}
            >
              {/* Hand-drawn curved arrow pointing up-right toward the toggle */}
              <path
                d="M 60 60 C 55 40, 48 22, 58 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="0"
                opacity="0.7"
              />
              {/* Arrowhead */}
              <path
                d="M 52 12 L 58 4 L 64 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            </svg>
            <div style={{ marginTop: 58 }}>
              Are you a parent?<br />Try Family Mode
            </div>
          </motion.div>
        )}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            {profileLoading ? '…' : viewMode === 'family'
              ? `${profile?.display_name?.split(' ')[0] || 'Your student'}'s College Plan 🎓`
              : `Welcome back, ${profile?.display_name?.split(' ')[0] || 'Student'} 👋`}
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
          {scoreLoading
            ? 'Loading your progress…'
            : viewMode === 'family'
              ? 'Chances of admission and how to pay for it — all in one place.'
              : getSubtitle(readinessTotal)}
        </p>
      </div>

      {/* ── Hero: Admission Chances (always first — it's what both audiences care most about) ── */}
      <AdmissionSnapshot
        profile={profile}
        colleges={colleges}
        loading={profileLoading || collegesLoading}
        onAddSchool={name => addCollege.mutate({ name })}
      />

      {/* ── Sections below hero reorder based on view mode ── */}
      {(() => {
        const statsSection = (
          <div key="stats" style={{ marginTop: 20 }}>
            <ProfileStats profile={profile} loading={profileLoading} tasks={tasks} userId={userId} />
          </div>
        )
        const challengesSection = (
          <div key="challenges" style={{ marginTop: 20 }}>
            <DailyChallenges userId={userId} />
          </div>
        )

        const ecEntries = profile?.ec_entries?.filter(e => e.name.trim()) ?? []
        const ecScore = scoreECs(ecEntries)
        const hasECs = ecEntries.length > 0
        const ecSection = profileLoading ? null : (
          <motion.div
            key="ec"
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

        const quickActionsSection = (
          <div key="actions" data-tour="quick-actions" style={{
            display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap',
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
        )

        const shareSection = (
          <div key="share" style={{
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
            {pledgeCount > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: '#2dd4bf', background: 'rgba(45,212,191,0.12)', padding: '2px 8px', borderRadius: 10 }}>
                ${pledgeTotal.toLocaleString()} pledged
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {pledgeCount > 0
              ? `${pledgeCount} ${pledgeCount === 1 ? 'person has' : 'people have'} pledged toward your college fund.`
              : 'Send your college list to family — they can see your schools, odds, and pledge toward your 529.'}
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
        )

        const shareUrlLine = shareUrl && !shareCopied ? (
          <div key="shareurl" style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
            {shareUrl}
          </div>
        ) : null

        // Order per mode — Student leads with engagement, Family leads with finance/family tools
        if (viewMode === 'family') {
          return [
            statsSection,
            shareSection,
            shareUrlLine,
            quickActionsSection,
            ecSection,
            challengesSection,
          ]
        }
        return [
          statsSection,
          challengesSection,
          ecSection,
          quickActionsSection,
          shareSection,
          shareUrlLine,
        ]
      })()}

      {/* ── Welcome tour (fires once after onboarding) ── */}
      {showTour && <WelcomeTour onComplete={handleTourComplete} />}
    </div>
  )
}
