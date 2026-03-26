'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Profile } from '@/lib/types/database'
import Link from 'next/link'

interface SchoolResult {
  schoolName: string
  chance: number
  admissionRate: number | null
  avgSAT: number | null
  sat25: number | null
  sat75: number | null
  actMidpoint: number | null
}

interface AdmissionSnapshotProps {
  profile: Profile | null | undefined
  loading: boolean
}

function chanceLabel(pct: number): { label: string; color: string; softColor: string; bgColor: string; borderColor: string } {
  // Desaturated, softer palette for dark mode readability
  if (pct >= 65) return { label: 'Safety', color: '#34D399', softColor: '#6EE7B7', bgColor: 'rgba(52,211,153,0.10)', borderColor: 'rgba(52,211,153,0.22)' }
  if (pct >= 35) return { label: 'Target', color: '#FBBF24', softColor: '#FCD34D', bgColor: 'rgba(251,191,36,0.10)', borderColor: 'rgba(251,191,36,0.22)' }
  return { label: 'Reach', color: '#FB7185', softColor: '#FDA4AF', bgColor: 'rgba(251,113,133,0.10)', borderColor: 'rgba(251,113,133,0.22)' }
}

const SNAPSHOT_KEY = 'admission_snapshot_v2'

export function AdmissionSnapshot({ profile, loading }: AdmissionSnapshotProps) {
  const schools = profile
    ? [
        { name: profile.school1_name, id: profile.school1_id },
        { name: profile.school2_name, id: profile.school2_id },
        { name: profile.school3_name, id: profile.school3_id },
        { name: profile.school4_name, id: profile.school4_id },
        { name: profile.school5_name, id: profile.school5_id },
        { name: profile.school6_name, id: profile.school6_id },
        { name: profile.school7_name, id: profile.school7_id },
        { name: profile.school8_name, id: profile.school8_id },
        { name: profile.school9_name, id: profile.school9_id },
      ].filter(s => s.name)
    : []

  // Re-fetch whenever GPA, SAT, major, or schools change
  const fetchKey = profile
    ? `${profile.gpa}|${profile.sat}|${profile.act_score}|${profile.proposed_major}|${schools.map(s => s.name).join(',')}`
    : null

  // Restore cached results from sessionStorage on mount
  const [results, setResults] = useState<SchoolResult[]>(() => {
    try {
      const saved = sessionStorage.getItem(SNAPSHOT_KEY)
      if (saved) {
        const { key, data } = JSON.parse(saved)
        // Only restore if profile hasn't changed since last fetch
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

  useEffect(() => {
    if (!profile || loading || !fetchKey || fetchKey === lastFetchKey || schools.length === 0) return
    setFetching(true)
    fetch('/api/colleges/chances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gpa: profile.gpa,
        sat: profile.sat,
        act: profile.act_score,
        proposed_major: profile.proposed_major,
        schools,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const freshResults = data.results || []
        setResults(freshResults)
        setLastFetchKey(fetchKey)
        try { sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ key: fetchKey, data: freshResults })) } catch { /* ignore */ }
      })
      .catch(() => setLastFetchKey(fetchKey))
      .finally(() => setFetching(false))
  }, [fetchKey, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || schools.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="card-elevated"
      style={{ padding: '20px 24px', marginTop: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Admission Snapshot</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
            AI-generated estimates based on your GPA{profile?.sat ? ', SAT' : ''}{profile?.act_score ? ', ACT' : ''} & school admit rates
          </p>
        </div>
        <Link href="/strategy" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>
          Full strategy →
        </Link>
      </div>

      {fetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {schools.map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!fetching && results.length === 0 && lastFetchKey !== null && (
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', padding: '12px 0' }}>
          Couldn&apos;t load school data. Add your SAT score and try refreshing.{' '}
          <Link href="/profile" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Update profile →</Link>
        </div>
      )}

      {!fetching && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {results.map((r, i) => {
            const { label, color, softColor, bgColor, borderColor } = chanceLabel(r.chance)
            const schoolAdmitRate = r.admissionRate != null ? `${r.admissionRate}% overall admit rate` : null

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
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* School name + tier label */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, maxWidth: 180 }}>
                    {r.schoolName}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
                    background: bgColor, color: softColor, border: `1px solid ${borderColor}`,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {label}
                  </span>
                </div>

                {/* Chance bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 600 }}>Your chance</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>~{r.chance}%</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.chance}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                      style={{ height: '100%', background: `${color}B3`, borderRadius: 99 }}
                    />
                  </div>
                  {schoolAdmitRate && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>{schoolAdmitRate}</div>
                  )}
                </div>

                {/* SAT range + ACT midpoint from real data */}
                {(r.sat25 || r.sat75 || r.avgSAT || r.actMidpoint) && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, display: 'flex', gap: 16 }}>
                    {(r.sat25 || r.sat75 || r.avgSAT) && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          SAT Range
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>
                          {r.sat25 && r.sat75 ? `${r.sat25} – ${r.sat75}` : r.avgSAT ? `Avg ${r.avgSAT}` : '—'}
                        </div>
                      </div>
                    )}
                    {r.actMidpoint != null && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          ACT Midpoint
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>
                          {r.actMidpoint}
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
