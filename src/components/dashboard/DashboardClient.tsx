'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { useUserColleges, useAddCollege } from '@/hooks/useUserColleges'
import { useViewMode } from '@/hooks/useViewMode'
import { useTasks } from '@/hooks/useTasks'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import { ProfileStats } from './ProfileStats'
import { AdmissionSnapshot } from './AdmissionSnapshot'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useStreak } from '@/hooks/useStreak'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
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

  // ── Welcome tour (kept available via ? button, no auto-trigger) ──
  const [showTour, setShowTour] = useState(false)

  // Removed auto-trigger of welcome tour on mount — users can access via help button if needed

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

  // ── View mode (Student / Mom) — persists in localStorage, theme syncs automatically ──
  const [viewMode, setViewMode] = useViewMode()
  const [hintDismissed, setHintDismissed] = useState(true) // default hidden until mount check
  useEffect(() => {
    try { setHintDismissed(localStorage.getItem('stairwayu_view_mode_hint_seen') === '1') } catch {}
  }, [])
  const handleSetViewMode = useCallback((next: 'student' | 'mom') => {
    setViewMode(next)
    setHintDismissed(true)
    try { localStorage.setItem('stairwayu_view_mode_hint_seen', '1') } catch {}
  }, [setViewMode])

  // ── Collapsible "More" section ──
  const [showMoreSection, setShowMoreSection] = useState(false)

  const QUICK_ACTIONS_STUDENT = [
    { label: 'Compare Schools', href: '/compare', icon: '⚖️', tip: 'Compare tuition, admit rates, and stats side-by-side for your saved schools.' },
    { label: 'Start Essay', href: '/essays', icon: '✍️', tip: 'Discover your best essay angle and get feedback that keeps your authentic voice.' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆', tip: 'Discover scholarships matched to your profile and major.' },
  ]
  const QUICK_ACTIONS_MOM = [
    { label: 'College Cost', href: '/finance', icon: '💵', tip: 'Plan how to pay for college — aid, loans, and family contribution.' },
    { label: 'Find Scholarships', href: '/scholarships', icon: '🏆', tip: 'Discover scholarships matched to your student\'s profile and major.' },
    { label: 'Compare Costs', href: '/compare', icon: '⚖️', tip: 'Compare tuition and net price side-by-side for your saved schools.' },
  ]
  const QUICK_ACTIONS = viewMode === 'mom' ? QUICK_ACTIONS_MOM : QUICK_ACTIONS_STUDENT

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
      {/* ── Page Header with View Mode Toggle (small pill) ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          {profileLoading ? '…' : viewMode === 'mom'
            ? `${profile?.display_name?.split(' ')[0] || 'Your student'}'s College Plan 🎓`
            : `Welcome back, ${profile?.display_name?.split(' ')[0] || 'Student'} 👋`}
        </h1>

        {/* Small view mode toggle + help button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Streak badge */}
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

          {/* Small view mode pill */}
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
            }}
          >
            {([
              { key: 'student', label: '🎓', icon: '🎓' },
              { key: 'mom', label: '👪', icon: '👪' },
            ] as const).map(opt => {
              const active = viewMode === opt.key
              return (
                <Tooltip key={opt.key} text={opt.key === 'student' ? 'Student View' : 'Mom Mode'} position="bottom">
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleSetViewMode(opt.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 32, height: 32, borderRadius: 99, border: 'none',
                    background: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? '#fff' : 'var(--color-text-muted)',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.icon}
                </button>
                </Tooltip>
              )
            })}
          </div>

          {/* Help button for tour */}
          <Tooltip text="Take the tour" position="bottom">
          <button
            onClick={() => setShowTour(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 99, border: '1.5px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ?
          </button>
          </Tooltip>
        </div>
      </div>

      {/* Subtitle */}
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        {scoreLoading
          ? 'Loading your progress…'
          : viewMode === 'mom'
            ? 'Chances of admission and how to pay for it — all in one place.'
            : getSubtitle(readinessTotal)}
      </p>

      {/* ── Hero: Admission Chances (always first) ── */}
      <AdmissionSnapshot
        profile={profile}
        colleges={colleges}
        loading={profileLoading || collegesLoading}
        onAddSchool={name => addCollege.mutate({ name })}
      />

      {/* ── ABOVE FOLD: Quick Stats ── */}
      <div style={{ marginBottom: 20 }}>
        <ProfileStats profile={profile} loading={profileLoading} tasks={tasks} userId={userId} />
      </div>

      {/* ── Next Steps Section (Next 2-3 incomplete tasks) ── */}
      {tasks && tasks.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Next Steps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks
              .filter(t => !t.completed_at)
              .slice(0, 3)
              .map(task => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    background: 'var(--color-card)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 10,
                  }}>
                  <input type="checkbox" checked={!!task.completed_at} readOnly style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{task.description}</div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions (always visible) ── */}
      <div data-tour="quick-actions" style={{
        display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
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

      {/* ── Collapsible "More" Section ── */}
      <button
        onClick={() => setShowMoreSection(!showMoreSection)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 14px',
          background: 'transparent',
          border: '1.5px solid var(--color-border)',
          borderRadius: 10,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text)',
          transition: 'all 0.2s',
          marginBottom: 20,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 6%, transparent)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <span>More Options</span>
        <span style={{ fontSize: 14 }}>{showMoreSection ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {showMoreSection && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Daily Goals (renamed from Daily Challenges) */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  Daily Goals
                </div>
                <DailyChallenges userId={userId} />
              </div>

              {/* EC Score Widget */}
              {(() => {
                const ecEntries = profile?.ec_entries?.filter(e => e.name.trim()) ?? []
                const ecScore = scoreECs(ecEntries)
                const hasECs = ecEntries.length > 0
                return !profileLoading ? (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card-elevated"
                    style={{ padding: '16px 20px' }}
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
                ) : null
              })()}

              {/* Share with Family CTA */}
              <div style={{
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

              {shareUrl && !shareCopied && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', wordBreak: 'break-all', padding: '8px 12px', background: 'var(--color-column)', borderRadius: 8 }}>
                  {shareUrl}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Welcome tour (available via ? button) ── */}
      {showTour && <WelcomeTour onComplete={handleTourComplete} />}
    </div>
  )
}

  )
}
