'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Profile } from '@/lib/types/database'
import { CollegeSelect } from '@/components/CollegeSelect'

const SESSION_KEY = 'compare_results_v1'
const SESSION_SCHOOLS_KEY = 'compare_schools_v1'

interface ComparePageClientProps {
  profile: Profile | null
  colleges: string[]
}

interface ComparedSchool {
  name: string
  city?: string
  state?: string
  admitRate?: number
  avgSAT?: number
  netCost?: number
  gradRate?: number
  medianEarnings10yr?: number
  tuitionInState?: number
  tuitionOutOfState?: number
  yourChance?: number
  retentionRate?: number
  _dataSources?: { scorecard?: boolean }
}

function shortName(name: string): string {
  const base = name.split('-')[0].trim()
  const ofMatch = base.match(/^(?:University|College|Institute)\s+of\s+(\S+)/i)
  if (ofMatch) return ofMatch[1]
  const words = base.split(' ').filter(w => !/^(university|college|institute|school|of|at|the)$/i.test(w))
  return words.slice(0, 2).join(' ') || base.split(' ')[0]
}

export function ComparePageClient({ profile, colleges }: ComparePageClientProps) {
  const defaultSchools = colleges

  const [schools, setSchools] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_SCHOOLS_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return defaultSchools.length >= 2 ? defaultSchools.slice(0, 4) : ['', '']
  })
  const [results, setResults] = useState<ComparedSchool[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) return JSON.parse(saved)
    } catch { /* ignore */ }
    return []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [homeState, setHomeState] = useState(profile?.home_state || '')

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  // Persist schools and results to sessionStorage whenever they change
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_SCHOOLS_KEY, JSON.stringify(schools)) } catch { /* ignore */ }
  }, [schools])
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(results)) } catch { /* ignore */ }
  }, [results])

  async function handleCompare() {
    const validSchools = schools.filter(s => s.trim())
    if (validSchools.length < 2) {
      setError('Enter at least 2 schools to compare.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/colleges/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schools: validSchools,
          gpa: profile?.gpa,
          gpa_weighted: profile?.gpa_weighted,
          sat: profile?.sat,
          major: profile?.proposed_major,
          homeState: homeState || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResults(data)
    } catch {
      setError('Comparison failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const METRICS: { key: keyof ComparedSchool; label: string; subtitle?: string; tooltip?: string; format: (v: unknown) => string }[] = [
    { key: 'admitRate', label: 'Admit Rate', subtitle: 'overall · U.S. Dept of Education', tooltip: 'Overall admission rate for all applicants. Source: U.S. Department of Education.', format: v => v != null ? `${v}%` : '—' },
    { key: 'yourChance', label: 'Your Chance', subtitle: 'chance = admitRate + (satFactor × scale) + (gpaFactor × scale), rounded to nearest 5%', tooltip: 'Admission probability estimated using the school\'s published admit rate, your SAT position within their 25th–75th percentile range, your GPA tier, and a selectivity scaling factor. Rounded to nearest 5%. This is an estimate, not a guarantee of admission.', format: v => v != null ? `~${v}%` : '—' },
    { key: 'avgSAT', label: 'Avg SAT', subtitle: 'admitted students · U.S. Dept of Education', tooltip: 'Average composite SAT score of admitted students. Source: U.S. Department of Education.', format: v => v != null ? String(v) : '—' },
    { key: 'netCost', label: homeState ? `Tuition est. net (${homeState} resident)` : 'Tuition (est. net)', subtitle: 'after avg aid · U.S. Dept of Education', tooltip: 'Estimated annual cost after typical financial aid. Source: U.S. Department of Education.', format: v => v != null ? `$${((v as number) / 1000).toFixed(0)}k` : '—' },
    { key: 'gradRate', label: 'Grad Rate', subtitle: '4-year · U.S. Dept of Education', tooltip: 'Percentage of full-time students who graduate within 4 years. Source: U.S. Department of Education.', format: v => v != null ? `${v}%` : '—' },
    { key: 'retentionRate', label: 'Retention Rate', subtitle: 'first-year · U.S. Dept of Education', tooltip: 'Percentage of first-year full-time students who return for their second year. Source: U.S. Department of Education.', format: v => v != null ? `${v}%` : '—' },
    { key: 'medianEarnings10yr', label: 'Earnings 10yr', subtitle: 'school-wide median · U.S. Dept of Education', tooltip: 'Median earnings of all students 10 years after enrollment, regardless of major. Source: U.S. Department of Education (based on IRS tax data).', format: v => v != null ? `$${((v as number) / 1000).toFixed(0)}k` : '—' },
  ]

  const validCount = schools.filter(s => s.trim()).length
  const readyToCompare = validCount >= 2

  return (
    <div style={{ maxWidth: 900, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Compare Schools ⚖️</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Compare your schools side by side on cost, acceptance rate, and fit.
          </p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '12px 16px',
          maxWidth: 420,
          flexShrink: 0,
        }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
            How We Calculate
          </h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 11, lineHeight: 1.55, color: 'var(--color-text-muted)' }}>
            <li style={{ marginBottom: 3 }}><strong style={{ color: 'var(--color-text-secondary)' }}>Admit Rate, SAT, Tuition, Net Cost, Grad Rate, Retention, Earnings</strong> — U.S. Department of Education (live data)</li>
            <li style={{ marginBottom: 3 }}><strong style={{ color: 'var(--color-text-secondary)' }}>Location &amp; Type</strong> — U.S. Department of Education (IPEDS)</li>
            <li><strong style={{ color: 'var(--color-text-secondary)' }}>Your Chance</strong> — chance = admitRate + (satFactor × scale) + (gpaFactor × scale), rounded to 5%. <em style={{ color: '#F59E0B' }}>Not a guarantee.</em></li>
          </ul>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        {[
          { n: '1', label: 'Enter 2–5 schools below', done: readyToCompare },
          { n: '2', label: 'Click Compare', done: results.length > 0 },
          { n: '3', label: 'Review side-by-side data', done: results.length > 0 },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
                background: step.done ? '#059669' : i === 0 && !readyToCompare ? 'var(--color-primary)' : i === 1 && readyToCompare && results.length === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                color: step.done || (i === 0 && !readyToCompare) || (i === 1 && readyToCompare && results.length === 0) ? '#fff' : 'var(--color-text-muted)',
              }}>
                {step.done ? '✓' : step.n}
              </div>
              <span style={{ fontSize: 13, fontWeight: step.done ? 600 : 500, color: step.done ? 'var(--color-text)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div style={{ width: 32, height: 1, background: 'var(--color-border)', margin: '0 8px', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 24, border: readyToCompare && results.length === 0 ? '2px solid var(--color-primary)' : undefined }}>
        {/* Step 1 label */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Step 1 — Select schools to compare (2–5)
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {schools.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <CollegeSelect
                value={s}
                onChange={v => setSchools(prev => prev.map((old, j) => j === i ? v : old))}
                placeholder={`School ${i + 1}`}
                style={{ width: 240 }}
                inputStyle={{ padding: '9px 12px', fontSize: 13 }}
              />
              {schools.length > 2 && (
                <button onClick={() => setSchools(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 16 }}>×</button>
              )}
            </div>
          ))}
          {schools.length < 5 && (
            <button onClick={() => setSchools(prev => [...prev, ''])} style={{ background: 'var(--color-column)', border: '1.5px dashed var(--color-border)', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              + Add
            </button>
          )}
        </div>

        {error && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* Step 2 label */}
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Step 2 — Generate comparison
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleCompare}
            disabled={loading || !readyToCompare}
            style={{
              background: loading || !readyToCompare ? 'var(--color-border)' : 'var(--color-primary)',
              color: loading || !readyToCompare ? 'var(--color-text-muted)' : '#fff',
              border: 'none', borderRadius: 10, padding: '12px 28px',
              fontWeight: 700, fontSize: 14,
              cursor: loading || !readyToCompare ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
              boxShadow: readyToCompare && !loading ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
            }}
          >
            {loading ? <><span className="strategy-spinner" /> Comparing…</> : '⚖️ Compare'}
          </button>
          {!readyToCompare && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Add at least 2 schools to enable
            </span>
          )}
          {readyToCompare && results.length === 0 && !loading && (
            <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
              ← Ready! Click to compare {validCount} schools
            </span>
          )}
        </div>
      </div>

      {/* Empty state preview — shown before first compare */}
      {results.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated"
          style={{ padding: '28px', textAlign: 'center', border: '1.5px dashed var(--color-border)' }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
            Your comparison table will appear here
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
            You&apos;ll see admit rate, your personal chance, avg SAT, net cost, graduation rate, retention rate, and earnings — side by side.
          </div>
          {/* Mini preview of metrics */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['Admit Rate', 'Your Chance', 'Avg SAT', 'Net Cost', 'Grad Rate', 'Retention', 'Earnings 10yr'].map(m => (
              <span key={m} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {m}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {results.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 12, padding: '10px 16px',
          background: 'rgba(255,255,255,0.04)', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>State of Residency:</span>
          <select
            value={homeState}
            onChange={e => setHomeState(e.target.value)}
            style={{
              background: 'var(--color-column)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', borderRadius: 6,
              padding: '5px 10px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="">Not set</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            Affects net tuition estimate. Re-click Compare after changing.
          </span>
        </div>
      )}

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated" style={{ padding: '24px 28px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metric</th>
                {results.map(r => (
                  <th key={r.name} style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: 'var(--color-primary)', fontSize: 13, minWidth: 120 }}>
                    <div>{shortName(r.name)}</div>
                    {r._dataSources?.scorecard && <div style={{ fontSize: 9, fontWeight: 500, color: '#16a34a' }}>live data</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m, ri) => (
                <tr key={m.key} style={{ background: ri % 2 === 0 ? 'var(--color-column)' : 'transparent' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)', borderRadius: ri % 2 === 0 ? '8px 0 0 8px' : undefined }} title={m.tooltip}>
                    {m.label}
                    {m.subtitle && <div style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-muted)', marginTop: 1 }}>{m.subtitle}</div>}
                  </td>
                  {results.map(r => (
                    <td key={r.name} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                      {m.format(r[m.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
