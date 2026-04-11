'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Profile, UserCollege } from '@/lib/types/database'
import Link from 'next/link'
import { Tooltip } from '@/components/ui/Tooltip'
import { CollegeSelect } from '@/components/CollegeSelect'

// Mirrors slugify in scripts/ingest-colleges.mjs so dashboard links resolve
// to the same URLs as the SEO landing pages.
function collegeSlug(name: string) {
  return name.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

interface Insight {
  factor: 'sat' | 'act' | 'gpa' | 'ec' | 'selectivity' | 'test_optional'
  sentiment: 'positive' | 'neutral' | 'negative'
  message: string
  impact: number
}

interface SchoolResult {
  schoolName: string
  chance: number
  insights: Insight[]
  admissionRate: number | null
  avgSAT: number | null
  sat25: number | null
  sat75: number | null
  actMidpoint: number | null
  avgNetPrice: number | null
  tuitionInState: number | null
  tuitionOutOfState: number | null
  schoolState: string | null
}

interface AdmissionSnapshotProps {
  profile: Profile | null | undefined
  colleges: UserCollege[]
  loading: boolean
  onAddSchool?: (name: string) => void
}

function chanceLabel(pct: number): { label: string; color: string; softColor: string; bgColor: string; borderColor: string } {
  if (pct >= 65) return { label: 'Safety', color: '#34D399', softColor: '#6EE7B7', bgColor: 'rgba(52,211,153,0.10)', borderColor: 'rgba(52,211,153,0.22)' }
  if (pct >= 35) return { label: 'Target', color: '#FBBF24', softColor: '#FCD34D', bgColor: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.22)' }
  return { label: 'Reach', color: '#FB7185', softColor: '#FDA4AF', bgColor: 'rgba(251,113,133,0.10)', borderColor: 'rgba(251,113,133,0.22)' }
}

const SENTIMENT_STYLES = {
  positive: { icon: '↑', color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.18)' },
  neutral:  { icon: '–', color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
  negative: { icon: '↓', color: '#FB7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.18)' },
}

const FACTOR_ICONS: Record<string, string> = {
  sat: '📝',
  act: '📝',
  gpa: '📊',
  ec: '🏆',
  selectivity: '🏫',
  test_optional: '📋',
}

const SNAPSHOT_KEY = 'admission_snapshot_v2'

export function AdmissionSnapshot({ profile, colleges, loading, onAddSchool }: AdmissionSnapshotProps) {
  const schools = colleges.map(c => ({ name: c.college_name, id: c.college_id }))
  const [adding, setAdding] = useState(false)
  const [addHintDismissed, setAddHintDismissed] = useState(true)
  const [strategyHintDismissed, setStrategyHintDismissed] = useState(true)
  useEffect(() => {
    try {
      setAddHintDismissed(localStorage.getItem('stairwayu_add_school_hint_seen') === '1')
      setStrategyHintDismissed(localStorage.getItem('stairwayu_strategy_hint_seen') === '1')
      // Suggested schools default to collapsed; no localStorage restore needed
    } catch {}
  }, [])
  const dismissAddHint = useCallback(() => {
    setAddHintDismissed(true)
    try { localStorage.setItem('stairwayu_add_school_hint_seen', '1') } catch {}
  }, [])
  const dismissStrategyHint = useCallback(() => {
    setStrategyHintDismissed(true)
    try { localStorage.setItem('stairwayu_strategy_hint_seen', '1') } catch {}
  }, [])
  // dismissSuggested removed — using simple toggle now

  // Arrow rules:
  //  - 1–3 schools → point at "+ Add school" with "Try adding more schools"
  //  - 4 schools  → point at "Full strategy →" with "Try creating an application strategy"
  //  - 0 or 5+    → no arrow
  const showAddArrow = colleges.length >= 1 && colleges.length <= 3 && !addHintDismissed && !adding
  const showStrategyArrow = colleges.length === 4 && !strategyHintDismissed

  const validECs = profile?.ec_entries?.filter(e => e.name?.trim()) ?? []
  const ecKey = validECs.length > 0 ? JSON.stringify(validECs) : ''
  const fetchKey = profile
    ? `${profile.gpa}|${profile.gpa_weighted}|${profile.sat}|${profile.act_score}|${profile.proposed_major}|${ecKey}|${schools.map(s => s.name).join(',')}`
    : null

  const [results, setResults] = useState<SchoolResult[]>(() => {
    try {
      const saved = sessionStorage.getItem(SNAPSHOT_KEY)
      if (saved) {
        const { key, data } = JSON.parse(saved)
        if (key && data) return data
      }
    } catch { /* ignore */ }
    return []
  })
  const [fetching, setFetching] = useState(false)
  const [lastFetchKey, setLastFetchKey] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem(SNAPSHOT_KEY)
      if (saved) {
        const { key } = JSON.parse(saved)
        return key ?? null
      }
    } catch { /* ignore */ }
    return null
  })
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const [suggestedResults, setSuggestedResults] = useState<SchoolResult[]>([])
  const [suggestedVisible, setSuggestedVisible] = useState(() => {
    // Auto-open when user has stats filled and 2+ schools saved
    const hasStats = !!(profile?.sat || profile?.act_score) && !!profile?.gpa
    return hasStats && schools.length >= 2
  })

  const doFetch = useCallback((signal?: AbortSignal, retriesLeft = 2) => {
    if (!profile || !fetchKey || schools.length === 0) return
    setFetching(true)
    setFetchError(false)

    const timeout = AbortSignal.timeout(15000)
    // Combine caller signal with our timeout so either can abort
    const combined = signal
      ? AbortSignal.any([signal, timeout])
      : timeout

    fetch('/api/colleges/chances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gpa: profile.gpa,
        gpa_weighted: profile.gpa_weighted,
        sat: profile.sat,
        act: profile.act_score,
        proposed_major: profile.proposed_major,
        ec_entries: profile.ec_entries?.filter(e => e.name?.trim()) ?? null,
        schools,
      }),
      signal: combined,
    })
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json() })
      .then(data => {
        const freshResults = data.results || []
        setResults(freshResults)
        setLastFetchKey(fetchKey)
        try { sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ key: fetchKey, data: freshResults })) } catch { /* ignore */ }
      })
      .catch((err) => {
        if (err.name === 'AbortError' || signal?.aborted) return
        if (retriesLeft > 0) {
          setTimeout(() => doFetch(signal, retriesLeft - 1), 1500 * (3 - retriesLeft))
          return
        }
        setFetchError(true)
      })
      .finally(() => { if (!signal?.aborted) setFetching(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, profile])

  useEffect(() => {
    if (!profile || loading || !fetchKey || fetchKey === lastFetchKey || schools.length === 0) return
    const controller = new AbortController()
    doFetch(controller.signal)
    return () => controller.abort()
  }, [fetchKey, loading, doFetch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch suggested schools
  useEffect(() => {
    if (!profile || schools.length === 0) {
      setSuggestedResults([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/colleges/suggest')
        if (!response.ok) return
        const data = await response.json()
        const suggested = data.results || []

        // Filter out schools already in user's list
        const userSchoolNames = new Set(schools.map(s => s.name.toLowerCase()))
        const filtered = suggested.filter(
          (s: SchoolResult) => !userSchoolNames.has(s.schoolName.toLowerCase())
        )

        setSuggestedResults(filtered.slice(0, 6))
      } catch {
        // Silently fail if suggestions API isn't available
      }
    }

    fetchSuggestions()
  }, [schools, profile])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated"
        style={{ padding: '20px 24px' }}
      >
        <div className="skeleton" style={{ height: 18, width: 180, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: 280, borderRadius: 6, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      </motion.div>
    )
  }

  if (schools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-elevated"
        style={{ padding: '28px 24px', textAlign: 'center' }}
      >
        {/* SVG: Empty campus with magnifying glass */}
        <div style={{ marginBottom: 12 }}>
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Campus building */}
            <rect x="25" y="30" width="50" height="35" rx="3" fill="var(--color-column)" stroke="var(--color-border)" strokeWidth="1.5" />
            <rect x="45" y="20" width="10" height="10" rx="1" fill="var(--color-column)" stroke="var(--color-border)" strokeWidth="1.5" />
            {/* Windows */}
            <rect x="32" y="38" width="8" height="8" rx="1.5" fill="var(--color-primary)" opacity="0.15" />
            <rect x="46" y="38" width="8" height="8" rx="1.5" fill="var(--color-primary)" opacity="0.15" />
            <rect x="60" y="38" width="8" height="8" rx="1.5" fill="var(--color-primary)" opacity="0.15" />
            {/* Door */}
            <rect x="44" y="52" width="12" height="13" rx="2" fill="var(--color-primary)" opacity="0.2" />
            {/* Flag */}
            <line x1="50" y1="12" x2="50" y2="20" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.4" />
            <path d="M50 12 L58 15 L50 18" fill="var(--color-primary)" opacity="0.5" />
            {/* Magnifying glass */}
            <circle cx="78" cy="22" r="10" fill="none" stroke="var(--color-primary)" strokeWidth="2" opacity="0.4" />
            <line x1="85" y1="29" x2="92" y2="36" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
            <text x="75" y="25" fontSize="8" fill="var(--color-primary)" opacity="0.5" fontWeight="700">?</text>
            {/* Dotted path */}
            <path d="M10 68 Q30 58, 50 65 Q70 72, 90 60" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.25" fill="none" />
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
          Your school list is empty
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
          Add schools and we&apos;ll show you exactly where you stand — real admission odds, personalized to you.
        </div>
        <Link
          href="/profile"
          style={{
            display: 'inline-block',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          + Add your first school
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-elevated"
      style={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, position: 'relative' }}>
        <div>
          <Tooltip text="Personalized admission odds for each school based on your GPA, test scores, and real admit-rate data." position="bottom" maxWidth={260}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Admission Snapshot</h2>
          </Tooltip>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            Estimates based on your GPA, SAT/ACT, extracurriculars & school admit rates
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'relative' }}>
          {onAddSchool && (
            adding ? (
              <div style={{ width: 240 }}>
                <CollegeSelect
                  value=""
                  placeholder="Search for a college…"
                  onChange={v => {
                    if (v) {
                      onAddSchool(v)
                      dismissAddHint() // only dismiss on successful add
                    }
                    setAdding(false)
                  }}
                />
              </div>
            ) : (
              <Tooltip text="Add another school to your list to see your admission chances for it." position="bottom" maxWidth={220}>
              <button
                data-tour="add-school"
                onClick={() => setAdding(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 99,
                  border: '1.5px solid var(--color-primary)',
                  background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  color: 'var(--color-primary)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add school
              </button>
              </Tooltip>
            )
          )}
          <Tooltip text="Generate a 3-tier application strategy (reach, target & safety) with these schools." position="left" maxWidth={220}>
          <Link
            href="/strategy"
            onClick={() => { if (showStrategyArrow) dismissStrategyHint() }}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Full strategy →
          </Link>
          </Tooltip>

          {/* Hand-drawn hint — points at + Add school (≤3 schools) or Full strategy (=4 schools) */}
          {(showAddArrow || showStrategyArrow) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              aria-hidden
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                // Add button sits left of Full strategy; point arrow accordingly
                right: showAddArrow ? 120 : 14,
                width: 180,
                pointerEvents: 'none',
                zIndex: 5,
                color: 'var(--color-text-muted)',
                fontFamily: '"Caveat", "Patrick Hand", "Bradley Hand", cursive',
                fontSize: 18,
                lineHeight: 1.15,
                textAlign: 'center',
              }}
            >
              <svg
                width="70"
                height="60"
                viewBox="0 0 70 60"
                style={{ position: 'absolute', top: -2, right: 56, overflow: 'visible' }}
              >
                <path
                  d="M 50 52 C 46 34, 40 18, 48 4"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75"
                />
                <path
                  d="M 42 10 L 48 2 L 54 12"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"
                />
              </svg>
              <div style={{ marginTop: 50 }}>
                {showAddArrow ? 'Try adding more schools' : 'Try creating an application strategy'}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {fetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: 14 }}>
          {schools.map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!fetching && fetchError && (
        <div style={{
          padding: '16px',
          borderRadius: 12,
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Couldn&apos;t load admission data.
          </span>
          <button
            onClick={() => doFetch()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, color: '#EF4444', padding: 0, flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!fetching && !fetchError && results.length === 0 && lastFetchKey !== null && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '12px 0' }}>
          No admission data available yet. Add your SAT score to see estimates.{' '}
          <Link href="/profile" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Update profile →</Link>
        </div>
      )}

      {!fetching && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 14 }}>
          {results.map((r, i) => {
            const { label, color, softColor, bgColor, borderColor } = chanceLabel(r.chance)
            const schoolAdmitRate = r.admissionRate != null ? `${r.admissionRate}% overall admit rate` : null
            const isExpanded = expandedCard === i
            const hasInsights = r.insights && r.insights.length > 0

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'var(--color-card)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: hasInsights ? 'pointer' : 'default',
                }}
                onClick={() => hasInsights && setExpandedCard(isExpanded ? null : i)}
              >
                {/* School name + tier label */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Link
                    href={`/colleges/${collegeSlug(r.schoolName)}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none' }}
                    title={`View ${r.schoolName} profile`}
                  >
                    {r.schoolName} ↗
                  </Link>
                  <Tooltip text={label === 'Safety' ? 'Your stats exceed the average — very likely to get in.' : label === 'Target' ? 'Your profile is a solid match — realistic shot.' : 'A stretch — your stats are below average, but worth trying.'} position="left">
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                    background: bgColor, color: softColor, border: `1px solid ${borderColor}`,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {label}
                  </span>
                  </Tooltip>
                </div>

                {/* Chance bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <Tooltip text="Estimated admission probability based on your GPA, test scores, and this school's historical admit rate." position="bottom" maxWidth={240}><span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Your chance</span></Tooltip>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>~{r.chance}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.chance}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      style={{ height: '100%', background: `${color}B3`, borderRadius: 99 }}
                    />
                  </div>
                  {schoolAdmitRate && (
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{schoolAdmitRate}</div>
                  )}
                </div>

                {/* Inline factor summary (always visible) */}
                {hasInsights && !isExpanded && (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2,
                  }}>
                    {r.insights.filter(ins => ins.impact !== 0 || ins.factor === 'selectivity' || ins.factor === 'test_optional').slice(0, 3).map((ins, j) => {
                      const style = SENTIMENT_STYLES[ins.sentiment]
                      return (
                        <span
                          key={j}
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {style.icon} {ins.factor === 'sat' || ins.factor === 'act' ? 'Test scores' : ins.factor === 'gpa' ? 'GPA' : ins.factor === 'ec' ? 'Activities' : ins.factor === 'selectivity' ? 'Selectivity' : 'No scores'}
                          {ins.impact !== 0 && ` ${ins.impact > 0 ? '+' : ''}${ins.impact}%`}
                        </span>
                      )
                    })}
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', alignSelf: 'center', fontWeight: 500 }}>
                      Tap for details
                    </span>
                  </div>
                )}

                {/* Expanded insights panel */}
                <AnimatePresence>
                  {isExpanded && hasInsights && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        borderTop: '1px solid var(--color-border)',
                        paddingTop: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Why this estimate
                        </div>

                        {r.insights.map((ins, j) => {
                          const style = SENTIMENT_STYLES[ins.sentiment]
                          const icon = FACTOR_ICONS[ins.factor] || '📌'

                          return (
                            <div
                              key={j}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.35 }}>
                                  {ins.message}
                                </div>
                                {ins.impact !== 0 && (
                                  <div style={{ fontSize: 10, fontWeight: 700, color: style.color, marginTop: 2 }}>
                                    {ins.impact > 0 ? '+' : ''}{ins.impact} percentage points
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: style.color, flexShrink: 0 }}>
                                {style.icon}
                              </span>
                            </div>
                          )
                        })}

                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                          Estimates are based on public admit-rate data, your academic profile, and extracurricular tiers. Actual decisions also depend on essays, recommendations, and other factors.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats footer (show when NOT expanded) */}
                {!isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                    {(r.sat25 || r.sat75 || r.avgSAT) && (
                      <SnapshotStat label="SAT Range" value={r.sat25 && r.sat75 ? `${r.sat25} – ${r.sat75}` : r.avgSAT ? `Avg ${r.avgSAT}` : '—'} />
                    )}
                    {r.actMidpoint != null && (
                      <SnapshotStat label="ACT Midpoint" value={`${r.actMidpoint}`} />
                    )}
                    {(r.tuitionInState || r.tuitionOutOfState) && (() => {
                      const isInState = profile?.home_state && r.schoolState && profile.home_state.toLowerCase() === r.schoolState.toLowerCase()
                      const tuition = isInState ? r.tuitionInState : r.tuitionOutOfState
                      const label = isInState ? 'Tuition (In-State)' : 'Tuition (Out-of-State)'
                      return <SnapshotStat label={label} value={tuition != null ? `$${(tuition / 1000).toFixed(0)}k` : '—'} />
                    })()}
                    {r.avgNetPrice != null && (
                      <SnapshotStat label="Avg Net Price" value={`$${(r.avgNetPrice / 1000).toFixed(0)}k`} />
                    )}
                  </div>
                )}

              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Suggested Schools Section ── */}
      {suggestedResults.length > 0 && (
        <div style={{ marginTop: 20 }}>
          {/* Divider */}
          <div style={{
            height: 1,
            background: 'var(--color-border)',
            marginBottom: 14,
          }} />

          {/* Toggle header */}
          <button
            onClick={() => setSuggestedVisible(!suggestedVisible)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '6px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: 13,
              fontWeight: 700,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <span style={{ fontSize: 14 }}>{suggestedVisible ? '▾' : '▸'}</span>
            Schools You Might Like
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
            }}>
              {suggestedResults.length}
            </span>
          </button>

          <AnimatePresence>
            {suggestedVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '6px 0 12px' }}>
                  Based on your GPA and test scores — click + to add one to your list
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))', gap: 14 }}>
                  {suggestedResults.map((r, i) => {
                    const { label, color, softColor, bgColor, borderColor } = chanceLabel(r.chance)
                    return (
                      <motion.div
                        key={r.schoolName}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        style={{
                          background: 'var(--color-card)',
                          borderRadius: 12,
                          padding: '14px 16px',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        {/* School name + tier + add button */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                          <Link
                            href={`/colleges/${collegeSlug(r.schoolName)}`}
                            style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: 'none', flex: 1 }}
                            title={`View ${r.schoolName} profile`}
                          >
                            {r.schoolName} ↗
                          </Link>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                              background: bgColor, color: softColor, border: `1px solid ${borderColor}`,
                              whiteSpace: 'nowrap',
                            }}>
                              {label}
                            </span>
                            {onAddSchool && (
                              <Tooltip text={`Add ${r.schoolName} to your list`} position="left">
                                <button
                                  onClick={() => onAddSchool(r.schoolName)}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 26, height: 26, borderRadius: 99,
                                    border: '1.5px solid var(--color-primary)',
                                    background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                                    color: 'var(--color-primary)',
                                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                                    lineHeight: 1, padding: 0,
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--color-primary)'
                                    e.currentTarget.style.color = '#fff'
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                                    e.currentTarget.style.color = 'var(--color-primary)'
                                  }}
                                >
                                  +
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Chance bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>Your chance</span>
                            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>~{r.chance}%</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${r.chance}%` }}
                              transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                              style={{ height: '100%', background: `${color}B3`, borderRadius: 99 }}
                            />
                          </div>
                          {r.admissionRate != null && (
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{r.admissionRate}% overall admit rate</div>
                          )}
                        </div>

                        {/* Stats footer */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
                          {(r.sat25 || r.sat75 || r.avgSAT) && (
                            <SnapshotStat label="SAT Range" value={r.sat25 && r.sat75 ? `${r.sat25} – ${r.sat75}` : r.avgSAT ? `Avg ${r.avgSAT}` : '—'} />
                          )}
                          {r.avgNetPrice != null && (
                            <SnapshotStat label="Avg Net Price" value={`$${(r.avgNetPrice / 1000).toFixed(0)}k`} />
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}

const SNAPSHOT_STAT_TIPS: Record<string, string> = {
  'SAT Range': 'Middle 50% SAT scores (25th–75th percentile) of admitted students.',
  'ACT Midpoint': 'Midpoint ACT composite score of admitted students.',
  'Avg Net Price': 'Average annual cost after financial aid. Source: U.S. Dept. of Education.',
}

function SnapshotStat({ label, value }: { label: string; value: string }) {
  const tip = SNAPSHOT_STAT_TIPS[label] || (label.includes('Tuition') ? 'Published tuition rate. Actual cost may be lower after aid.' : undefined)
  const inner = (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  )
  if (tip) return <Tooltip text={tip} position="top">{inner}</Tooltip>
  return inner
}
