'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MajorSelect } from '@/components/MajorSelect'
import { useRecordXp } from '@/hooks/useXp'
import confetti from 'canvas-confetti'
import { Tooltip } from '@/components/ui/Tooltip'

const CLIMATE_OPTIONS = [
  '', 'Mountains', 'Beach / Coastal', 'Sunny / Southwest',
  'Midwest', 'Pacific Northwest', 'Northeast', 'Southeast', 'No Preference',
]

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const getTierConfig = () => isDark() ? {
  reach:  { label: 'Reach'  as const, emoji: '🚀', color: '#FCA5A5', bg: 'rgba(252,165,165,0.08)', border: 'rgba(252,165,165,0.18)' },
  target: { label: 'Target' as const, emoji: '🎯', color: '#FDE68A', bg: 'rgba(253,230,138,0.08)', border: 'rgba(253,230,138,0.18)' },
  safety: { label: 'Safety' as const, emoji: '✅', color: '#86EFAC', bg: 'rgba(134,239,172,0.08)', border: 'rgba(134,239,172,0.18)' },
} : {
  reach:  { label: 'Reach'  as const, emoji: '🚀', color: '#EF4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.2)'  },
  target: { label: 'Target' as const, emoji: '🎯', color: '#F59E0B', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)' },
  safety: { label: 'Safety' as const, emoji: '✅', color: '#22C55E', bg: 'rgba(34,197,94,0.07)',  border: 'rgba(34,197,94,0.2)'  },
}

type Tier = 'reach' | 'target' | 'safety'

interface School {
  name: string
  city: string | null
  state: string | null
  admitRate: number | null
  yourChance: number | null
  sat25: number | null
  sat75: number | null
  actMidpoint: number | null
  netCost: number | null
  gradRate: number | null
  medianEarnings10yr: number | null
  usNewsRankDisplay: string | null
  programStrength: string | null
  whyFit: string | null
  _dataSources?: { scorecard?: boolean }
}

interface StrategyResult {
  rationale: string
  reach: School[]
  target: School[]
  safety: School[]
}

interface StrategyPageClientProps {
  profile: {
    gpa: number | null
    gpa_weighted: number | null
    sat: number | null
    act_score: number | null
    proposed_major: string | null
    strategy_result?: StrategyResult | null
    strategy_generated_at?: string | null
  } | null
  colleges: string[] // college names from user_colleges, sorted by sort_order
  userId: string
}

const LOADING_STEPS = [
  { text: 'Analyzing your profile…', icon: '🔍', duration: 2200 },
  { text: 'Searching 3,000+ colleges…', icon: '🏛️', duration: 2800 },
  { text: 'Matching programs to your major…', icon: '📚', duration: 2400 },
  { text: 'Calculating admission odds…', icon: '📊', duration: 2600 },
  { text: 'Building your personalized list…', icon: '✨', duration: 3000 },
]

function StrategyLoadingSteps() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    function advance(step: number) {
      if (step < LOADING_STEPS.length - 1) {
        timeout = setTimeout(() => {
          setActiveStep(step + 1)
          advance(step + 1)
        }, LOADING_STEPS[step].duration)
      }
    }
    advance(0)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 340, padding: 40 }}>
      <div className="strategy-loading-pulse" style={{ width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ fontSize: 28 }}>{LOADING_STEPS[activeStep].icon}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300 }}>
        {LOADING_STEPS.map((step, i) => {
          const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: state === 'pending' ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                background: state === 'done' ? 'var(--color-success)' : state === 'active' ? 'var(--color-primary)' : 'var(--color-column)',
                color: state === 'pending' ? 'var(--color-text-muted)' : '#fff',
                transition: 'background 0.3s, color 0.3s',
              }}>
                {state === 'done' ? '✓' : state === 'active' ? <span className="strategy-spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} /> : i + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: state === 'active' ? 700 : 500,
                color: state === 'active' ? 'var(--color-text)' : 'var(--color-text-muted)',
                transition: 'color 0.3s, font-weight 0.3s',
              }}>
                {step.text}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function TypewriterText({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    setDisplayed('')
    setDone(false)
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && <span className="typewriter-cursor">|</span>}
    </span>
  )
}

export function StrategyPageClient({ profile, colleges, userId }: StrategyPageClientProps) {
  const recordXp = useRecordXp(userId)
  const [collegeNames, setCollegeNames] = useState<string[]>(colleges)
  const [form, setForm] = useState({
    gpa: profile?.gpa?.toString() ?? '',
    gpaWeighted: profile?.gpa_weighted?.toString() ?? '',
    sat: profile?.sat?.toString() ?? '',
    act: profile?.act_score?.toString() ?? '',
    major: profile?.proposed_major ?? '',
    budget: '',
    climate: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StrategyResult | null>(profile?.strategy_result ?? null)
  const [freshResult, setFreshResult] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(true)
  const resultsRef = useRef<HTMLDivElement>(null)
  const isFirstGeneration = useRef(!profile?.strategy_generated_at)

  const isMobile = useCallback(() => window.matchMedia('(max-width: 768px)').matches, [])

  async function handleGenerate() {
    if ((!form.gpa && !form.gpaWeighted) || (!form.sat && !form.act) || !form.major) {
      setError('At least one GPA, one test score (SAT or ACT), and major are required.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpa: form.gpa ? Number(form.gpa) : null,
          gpaWeighted: form.gpaWeighted ? Number(form.gpaWeighted) : null,
          sat: form.sat ? Number(form.sat) : null,
          act: form.act ? Number(form.act) : null,
          major: form.major || null,
          budget: form.budget ? Number(form.budget) : null,
          climate: form.climate,
          schools: collegeNames.filter(Boolean),
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }
      const data = await res.json()
      setResult(data)
      setFreshResult(true)
      recordXp.mutate({ action: 'generate_strategy', refId: `strategy_${userId}` })
      // Celebrate first-ever strategy generation with a big confetti burst
      if (isFirstGeneration.current) {
        isFirstGeneration.current = false
        const end = Date.now() + 1500
        const colors = ['#5EEAD4', '#FCD34D', '#86EFAC', '#FCA5A5', '#7DD3FC']
        const frame = () => {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
          if (Date.now() < end) requestAnimationFrame(frame)
        }
        frame()
      }
      if (isMobile()) {
        setFormOpen(false)
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      }
    } catch (err) {
      let msg = 'Failed to generate strategy.'
      try {
        const body = err instanceof Error ? err.message : String(err)
        const parsed = JSON.parse(body)
        if (parsed.error === 'Subscription required') {
          msg = 'Your Pro trial has ended. Upgrade to Pro to generate your list.'
        } else if (parsed.error) {
          msg = parsed.error
        }
      } catch { /* not JSON, use generic */ }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1200, width: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>College Strategy ⚡</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Get an AI-powered reach, target, and safety list tailored to your profile.
      </p>

      <div className="strategy-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* ── Left: Inputs ── */}
        <div className="strategy-form-wrapper" style={{ position: 'sticky', top: 32 }}>
          <div className="card-elevated" style={{ padding: '24px 24px 28px' }}>
            {/* Mobile toggle header */}
            <button
              className="strategy-form-toggle"
              onClick={() => setFormOpen(o => !o)}
              style={{ display: 'none', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--color-text)', alignItems: 'center', justifyContent: 'space-between', marginBottom: formOpen ? 14 : 0 }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {result ? 'Edit Inputs' : 'Your Profile'}
              </span>
              <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: formOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </button>
            <div className={formOpen ? 'strategy-form-body' : 'strategy-form-body strategy-form-collapsed'} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Unweighted GPA (4.0)" type="number" step="0.01" min="0" max="4.0" placeholder="3.9" value={form.gpa} onChange={v => setForm(f => ({ ...f, gpa: v }))} />
              <Field label="Weighted GPA (5.0)" type="number" step="0.01" min="0" max="5.0" placeholder="4.3" value={form.gpaWeighted} onChange={v => setForm(f => ({ ...f, gpaWeighted: v }))} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="SAT Score" type="number" min="400" max="1600" placeholder="1400" value={form.sat} onChange={v => setForm(f => ({ ...f, sat: v }))} />
                <Field label="ACT Score" type="number" min="1" max="36" placeholder="30" value={form.act} onChange={v => setForm(f => ({ ...f, act: v }))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intended Major</label>
                <MajorSelect value={form.major} onChange={v => setForm(f => ({ ...f, major: v }))} />
              </div>
              <Field label="Annual Budget ($)" type="number" min="0" placeholder="30000" value={form.budget} onChange={v => setForm(f => ({ ...f, budget: v }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Region <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional, select multiple)</span></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)' }}>
                  {CLIMATE_OPTIONS.filter(Boolean).map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.climate.includes(opt)}
                        onChange={e => {
                          setForm(f => ({
                            ...f,
                            climate: e.target.checked
                              ? [...f.climate, opt]
                              : f.climate.filter(c => c !== opt),
                          }))
                        }}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

            {error && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 14 }}>{error}</div>}

            <Tooltip text="Generate a 3-tier application strategy (reach, target & safety schools) personalized to your stats and preferences." position="top" maxWidth={260}>
            <button onClick={handleGenerate} disabled={loading} style={{ background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="strategy-spinner" /> Generating…</> : <>✨ Generate Strategy</>}
            </button>
            </Tooltip>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div ref={resultsRef}>
          <AnimatePresence>
            {loading ? (
              <StrategyLoadingSteps />
            ) : result ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.rationale && (
                  <div style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 18%, transparent)', borderRadius: 10, padding: '12px 16px', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                    <strong style={{ color: 'var(--color-primary)' }}>Strategy: </strong>
                    {freshResult ? <TypewriterText text={result.rationale} /> : result.rationale}
                  </div>
                )}
                {(['reach', 'target', 'safety'] as Tier[]).map(tier => (
                  <TierSection key={tier} tier={tier} schools={result[tier]} collegeNames={collegeNames} budget={form.budget ? Number(form.budget) : null} onAdd={async (name) => {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabase = createClient()
                    const nextOrder = collegeNames.length + 1
                    await supabase.from('user_colleges').upsert(
                      { user_id: userId, college_name: name, sort_order: nextOrder },
                      { onConflict: 'user_id,college_name' },
                    )
                    setCollegeNames(prev => prev.includes(name) ? prev : [...prev, name])
                  }} />
                ))}
              </motion.div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340, textAlign: 'center', padding: 40 }}>
                <div>
                  {/* SVG: Student with backpack looking at a map */}
                  <div className="strategy-empty-icon" style={{ marginBottom: 20 }}>
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Map / path */}
                      <path d="M20 85 Q40 70, 60 75 Q80 80, 100 65" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" fill="none" />
                      <circle cx="20" cy="85" r="4" fill="#EF4444" opacity="0.7" />
                      <circle cx="60" cy="75" r="4" fill="#FBBF24" opacity="0.7" />
                      <circle cx="100" cy="65" r="4" fill="#22C55E" opacity="0.7" />
                      {/* Character body */}
                      <circle cx="42" cy="35" r="12" fill="var(--color-primary)" opacity="0.15" />
                      <circle cx="42" cy="35" r="8" fill="var(--color-primary)" opacity="0.3" />
                      {/* Head */}
                      <circle cx="42" cy="28" r="6" fill="var(--color-text-muted)" opacity="0.5" />
                      {/* Backpack */}
                      <rect x="36" y="34" rx="3" width="12" height="16" fill="var(--color-primary)" opacity="0.25" />
                      <rect x="38" y="37" rx="1.5" width="8" height="4" fill="var(--color-primary)" opacity="0.4" />
                      {/* Legs */}
                      <line x1="39" y1="50" x2="36" y2="62" stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                      <line x1="45" y1="50" x2="48" y2="62" stroke="var(--color-text-muted)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
                      {/* Map in hand */}
                      <rect x="52" y="30" rx="2" width="18" height="14" fill="var(--color-card)" stroke="var(--color-border)" strokeWidth="1.5" />
                      <line x1="55" y1="34" x2="67" y2="34" stroke="var(--color-primary)" strokeWidth="1" opacity="0.4" />
                      <line x1="55" y1="37" x2="64" y2="37" stroke="var(--color-text-muted)" strokeWidth="1" opacity="0.3" />
                      <line x1="55" y1="40" x2="62" y2="40" stroke="var(--color-text-muted)" strokeWidth="1" opacity="0.3" />
                      {/* Destination flag */}
                      <line x1="100" y1="52" x2="100" y2="65" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.4" />
                      <path d="M100 52 L110 55.5 L100 59" fill="#22C55E" opacity="0.6" />
                    </svg>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--color-text)' }}>
                    Build your dream school list
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                    Fill in your stats and hit <strong style={{ color: 'var(--color-primary)' }}>Generate Strategy</strong> to get a personalized reach, target &amp; safety list
                  </div>
                  <div className="strategy-empty-dots" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#EF4444', opacity: 0.8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Reach
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#FBBF24', opacity: 0.8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24' }} /> Target
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: '#22C55E', opacity: 0.8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} /> Safety
                    </span>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const TIER_TIPS: Record<Tier, string> = {
  reach: 'Dream schools where your stats are below the average admitted student. Worth applying — upsets happen!',
  target: 'Schools where your profile is a solid match. You have a realistic shot at admission.',
  safety: 'Schools where your stats exceed the typical admitted student. Very likely to get in.',
}

function TierSection({ tier, schools, collegeNames, budget, onAdd }: {
  tier: Tier
  schools: School[]
  collegeNames: string[]
  budget: number | null
  onAdd: (name: string) => Promise<void>
}) {
  const cfg = getTierConfig()[tier]
  if (!schools?.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
        <Tooltip text={TIER_TIPS[tier]} position="right" maxWidth={240}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: cfg.color, margin: 0 }}>{cfg.label}</h3>
        </Tooltip>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{schools.length} schools</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {schools.map((school, i) => (
          <SchoolCard key={school.name} school={school} tier={tier} index={i} collegeNames={collegeNames} budget={budget} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}

function MatchRing({ chance, color, size = 48 }: { chance: number; color: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (chance / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} opacity={0.12} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1 }}>{chance}%</span>
      </div>
    </div>
  )
}

function SchoolCard({ school, tier, index, collegeNames, budget, onAdd }: {
  school: School
  tier: Tier
  index: number
  collegeNames: string[]
  budget: number | null
  onAdd: (name: string) => Promise<void>
}) {
  const cfg = getTierConfig()[tier]
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [flipped, setFlipped] = useState(false)

  const alreadyAdded = collegeNames.includes(school.name)

  useEffect(() => {
    const timer = setTimeout(() => setFlipped(true), index * 120 + 200)
    return () => clearTimeout(timer)
  }, [index])

  async function handleAdd() {
    setSaving(true)
    await onAdd(school.name)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="school-card-perspective" style={{ perspective: 800 }}>
      <motion.div
        className={`school-card-flip${tier === 'reach' ? ' school-card-shimmer' : ''}`}
        initial={{ rotateY: -90, opacity: 0 }}
        animate={flipped ? { rotateY: 0, opacity: 1 } : { rotateY: -90, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, transformStyle: 'preserve-3d' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Match score ring */}
          {school.yourChance != null && (
            <MatchRing chance={school.yourChance} color={cfg.color} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{school.name}</div>
                {(school.city || school.state) && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{[school.city, school.state].filter(Boolean).join(', ')}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {school.programStrength && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: cfg.color, color: '#fff', whiteSpace: 'nowrap' }}>
                    {school.programStrength}
                  </span>
                )}
              </div>
            </div>
            {school.yourChance != null && (
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>Match Score</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
          {school.admitRate != null && <Stat label="Admit Rate" value={`${school.admitRate}%`} />}
          {school.netCost != null && <Stat label="Net Cost/yr" value={`$${(school.netCost / 1000).toFixed(0)}k`} real={school._dataSources?.scorecard} overBudget={budget != null && budget > 0 && school.netCost > budget} />}
          {school.gradRate != null && <Stat label="Grad Rate" value={`${school.gradRate}%`} real />}
          {school.usNewsRankDisplay && <Stat label="US News" value={school.usNewsRankDisplay} real />}
          {school.medianEarnings10yr != null && <Stat label="Earnings 10yr" value={`$${(school.medianEarnings10yr / 1000).toFixed(0)}k`} real />}
        </div>
        {(school.sat25 && school.sat75 || school.actMidpoint) && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
            {school.sat25 && school.sat75 && (
              <span>
                <span style={{ fontWeight: 600 }}>SAT range:</span> {school.sat25}–{school.sat75}
                <Tooltip text="Live data from the U.S. Department of Education College Scorecard." position="top"><span className="strat-real-badge">live</span></Tooltip>
              </span>
            )}
            {school.actMidpoint != null && (
              <span>
                <span style={{ fontWeight: 600 }}>ACT midpoint:</span> {school.actMidpoint}
                <Tooltip text="Live data from the U.S. Department of Education College Scorecard." position="top"><span className="strat-real-badge">live</span></Tooltip>
              </span>
            )}
          </div>
        )}
        {budget != null && budget > 0 && school.netCost != null && school.netCost > budget && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 6, padding: '6px 9px', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚠️</span>
            <span>Net cost ${(school.netCost / 1000).toFixed(0)}k exceeds your ${(budget / 1000).toFixed(0)}k budget — scholarships or financial aid will be necessary.</span>
          </div>
        )}
        {school.whyFit && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
            &ldquo;{school.whyFit}&rdquo;
          </div>
        )}
        {/* Save to collection */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          {saved ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>✓ Collected!</span>
          ) : alreadyAdded ? (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>In your collection</span>
          ) : (
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {saving ? 'Saving…' : '♥ Save to Collection'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Stat({ label, value, color, real, overBudget }: { label: string; value: string; color?: string; real?: boolean; overBudget?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: overBudget ? '#f59e0b' : (color || 'var(--color-text)'), display: 'flex', alignItems: 'center', gap: 3 }}>
        {value}
        {overBudget && <Tooltip text="Above your annual budget — scholarships or financial aid will be necessary to attend." position="top" maxWidth={240}><span style={{ fontSize: 11 }}>⚠️</span></Tooltip>}
        {real && <Tooltip text="Pulled from the U.S. Department of Education College Scorecard — real, verified data." position="top" maxWidth={220}><span className="strat-real-badge">live</span></Tooltip>}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{label}</span>
    </div>
  )
}

function Field({ label, onChange, ...inputProps }: { label: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input {...inputProps} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle: React.CSSProperties = { padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', fontSize: 13, outline: 'none', width: '100%' }
