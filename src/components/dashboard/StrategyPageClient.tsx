'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MajorSelect } from '@/components/MajorSelect'
import { useRecordXp } from '@/hooks/useXp'

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
    climate: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StrategyResult | null>(profile?.strategy_result ?? null)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(true)
  const resultsRef = useRef<HTMLDivElement>(null)

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
        body: JSON.stringify({ ...form, schools: collegeNames.filter(Boolean) }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText)
      }
      const data = await res.json()
      setResult(data)
      recordXp.mutate({ action: 'generate_strategy' })
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
          msg = 'Your trial has ended. Subscribe to generate your list.'
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
                <label style={labelStyle}>Climate <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <select value={form.climate} onChange={e => setForm(f => ({ ...f, climate: e.target.value }))} style={inputStyle}>
                  {CLIMATE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || 'Any climate'}</option>)}
                </select>
              </div>

            {error && <div style={{ color: '#EF4444', fontSize: 13, marginTop: 14 }}>{error}</div>}

            <button onClick={handleGenerate} disabled={loading} style={{ background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="strategy-spinner" /> Generating…</> : <>✨ Generate Strategy</>}
            </button>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div ref={resultsRef}>
          <AnimatePresence>
            {loading ? (
              <div>
                {/* Skeleton for rationale */}
                <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 24 }} />
                {/* Skeleton tier sections */}
                {['Reach', 'Target', 'Safety'].map(tier => (
                  <div key={tier} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div className="skeleton" style={{ width: 20, height: 20, borderRadius: '50%' }} />
                      <div className="skeleton" style={{ height: 18, width: 80, borderRadius: 6 }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[...Array(tier === 'Target' ? 3 : 2)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : result ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {result.rationale && (
                  <div style={{ background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 18%, transparent)', borderRadius: 10, padding: '12px 16px', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                    <strong style={{ color: 'var(--color-primary)' }}>Strategy: </strong>{result.rationale}
                  </div>
                )}
                {(['reach', 'target', 'safety'] as Tier[]).map(tier => (
                  <TierSection key={tier} tier={tier} schools={result[tier]} collegeNames={collegeNames} onAdd={async (name) => {
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center', padding: 40 }}>
                <div>
                  <div className="strategy-empty-icon" style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>🚀</div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, color: 'var(--color-text)' }}>
                    Build your dream school list
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                    Fill in your stats and hit <strong style={{ color: 'var(--color-primary)' }}>Generate Strategy</strong> to get a personalized reach, target &amp; safety list
                  </div>
                  <div className="strategy-empty-dots" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', opacity: 0.7 }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FBBF24', opacity: 0.7 }} />
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', opacity: 0.7 }} />
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

function TierSection({ tier, schools, collegeNames, onAdd }: {
  tier: Tier
  schools: School[]
  collegeNames: string[]
  onAdd: (name: string) => Promise<void>
}) {
  const cfg = getTierConfig()[tier]
  if (!schools?.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: cfg.color, margin: 0 }}>{cfg.label}</h3>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{schools.length} schools</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {schools.map((school, i) => (
          <SchoolCard key={school.name} school={school} tier={tier} index={i} collegeNames={collegeNames} onAdd={onAdd} />
        ))}
      </div>
    </div>
  )
}

function SchoolCard({ school, tier, index, collegeNames, onAdd }: {
  school: School
  tier: Tier
  index: number
  collegeNames: string[]
  onAdd: (name: string) => Promise<void>
}) {
  const cfg = getTierConfig()[tier]
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const alreadyAdded = collegeNames.includes(school.name)

  async function handleAdd() {
    setSaving(true)
    await onAdd(school.name)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 + 0.1 }}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
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
          {/* Add to Dashboard button */}
          {saved ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>✓ Added!</span>
          ) : alreadyAdded ? (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>On dashboard</span>
          ) : (
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {saving ? 'Adding…' : '+ Add to Dashboard'}
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
        {school.yourChance != null && <Stat label="Your Chance" value={`${school.yourChance}%`} color={cfg.color} />}
        {school.admitRate != null && <Stat label="Admit Rate" value={`${school.admitRate}%`} />}
        {school.netCost != null && <Stat label="Net Cost/yr" value={`$${(school.netCost / 1000).toFixed(0)}k`} real={school._dataSources?.scorecard} />}
        {school.gradRate != null && <Stat label="Grad Rate" value={`${school.gradRate}%`} real />}
        {school.usNewsRankDisplay && <Stat label="US News" value={school.usNewsRankDisplay} real />}
        {school.medianEarnings10yr != null && <Stat label="Earnings 10yr" value={`$${(school.medianEarnings10yr / 1000).toFixed(0)}k`} real />}
      </div>
      {(school.sat25 && school.sat75 || school.actMidpoint) && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
          {school.sat25 && school.sat75 && (
            <span>
              <span style={{ fontWeight: 600 }}>SAT range:</span> {school.sat25}–{school.sat75}
              <span className="strat-real-badge">live</span>
            </span>
          )}
          {school.actMidpoint != null && (
            <span>
              <span style={{ fontWeight: 600 }}>ACT midpoint:</span> {school.actMidpoint}
              <span className="strat-real-badge">live</span>
            </span>
          )}
        </div>
      )}
      {school.whyFit && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 4, lineHeight: 1.4 }}>
          &ldquo;{school.whyFit}&rdquo;
        </div>
      )}
    </motion.div>
  )
}

function Stat({ label, value, color, real }: { label: string; value: string; color?: string; real?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 3 }}>
        {value}
        {real && <span className="strat-real-badge">live</span>}
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
