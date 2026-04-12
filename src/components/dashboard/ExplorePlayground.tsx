'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateChance } from '@/lib/services/admissionChance'
import { getTierConfig, chanceToTier, REGION_LABELS, type Tier } from '@/lib/tierConfig'
import { useAddCollege } from '@/hooks/useUserColleges'
import { useRecordXp } from '@/hooks/useXp'
import { useDailyChallenges } from '@/hooks/useDailyChallenges'
import { Tooltip } from '@/components/ui/Tooltip'
import { MajorSelect } from '@/components/MajorSelect'

interface ExploreProps {
  profile: {
    gpa: number | null
    gpa_weighted: number | null
    sat: number | null
    act_score: number | null
    home_state: string | null
    proposed_major: string | null
  } | null
  collegeNames: string[]
  userId: string
}

interface SchoolResult {
  id: string
  name: string
  city: string | null
  state: string | null
  admissionRate: number | null
  avgSAT: number | null
  sat25: number | null
  sat75: number | null
  actMidpoint: number | null
  avgNetPrice: number | null
  gradRate4yr: number | null
  medianEarnings10yr: number | null
  regionId: number | null
  enrollment: number | null
  programCompletions?: number | null
  programEarnings1yr?: number | null
  programEarnings4yr?: number | null
  programCipTitle?: string | null
  programStrengthScore?: number | null
  retentionRate?: number | null
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }

export function ExplorePlayground({ profile, collegeNames: initialColleges, userId }: ExploreProps) {
  const addCollege = useAddCollege(userId)
  const recordXp = useRecordXp(userId)
  const { completeChallenge } = useDailyChallenges(userId)

  const [collegeNames, setCollegeNames] = useState(initialColleges)
  const [satValue, setSatValue] = useState(profile?.sat ?? 1100)
  const [gpaValue, setGpaValue] = useState(profile?.gpa ?? 3.2)
  const [selectedRegions, setSelectedRegions] = useState<Set<number>>(new Set())
  const [selectedMajor, setSelectedMajor] = useState(profile?.proposed_major ?? '')
  const [stretchMode, setStretchMode] = useState(false)
  const [budget, setBudget] = useState('')
  const [flexibleOnPrice, setFlexibleOnPrice] = useState(false)
  const [results, setResults] = useState<SchoolResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const interactedRef = useRef(false)

  const effectiveSAT = stretchMode ? Math.min(satValue + 100, 1600) : satValue
  const effectiveGPA = stretchMode ? Math.min(gpaValue + 0.3, 4.0) : gpaValue

  const fetchSchools = useCallback(async (sat: number, regions: Set<number>, major?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        satMin: String(Math.max(400, sat - 200)),
        satMax: String(Math.min(1600, sat + 200)),
        perPage: '40',
        sort: major && major !== 'Undecided' ? 'program_strength' : 'sat',
      })
      if (regions.size > 0) {
        params.set('regions', Array.from(regions).join(','))
      }
      if (major && major !== 'Undecided') {
        params.set('major', major)
      }
      const res = await fetch(`/api/colleges/explore?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setResults(data.results || [])
      setTotal(data.total || 0)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchools(effectiveSAT, selectedRegions, selectedMajor)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasInteracted) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSchools(effectiveSAT, selectedRegions, selectedMajor)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [effectiveSAT, selectedRegions, selectedMajor, hasInteracted, fetchSchools])

  function handleInteraction() {
    setHasInteracted(true)
    if (!interactedRef.current) {
      interactedRef.current = true
      const today = new Date().toISOString().slice(0, 10)
      recordXp.mutate({ action: 'explore_interact', refId: `explore_${today}` })
      completeChallenge('explore_slider')
    }
  }

  function handleSurpriseMe() {
    const allRegions = Object.keys(REGION_LABELS).map(Number)
    const shuffled = allRegions.sort(() => Math.random() - 0.5)
    const count = 2 + Math.floor(Math.random() * 2)
    const randomRegions = new Set(shuffled.slice(0, count))
    const randomSat = 900 + Math.floor(Math.random() * 500)
    const randomGpa = +(2.5 + Math.random() * 1.5).toFixed(1)
    setSelectedRegions(randomRegions)
    setSatValue(randomSat)
    setGpaValue(randomGpa)
    setStretchMode(false)
    setHasInteracted(true)
    const today = new Date().toISOString().slice(0, 10)
    recordXp.mutate({ action: 'surprise_me', refId: `surprise_${today}` })
    completeChallenge('surprise_me')
    clearTimeout(debounceRef.current)
    fetchSchools(randomSat, randomRegions, selectedMajor)
  }

  async function handleSave(school: SchoolResult) {
    setSavedIds(prev => new Set(prev).add(school.id))
    await addCollege.mutateAsync({ name: school.name, collegeId: school.id })
    setCollegeNames(prev => prev.includes(school.name) ? prev : [...prev, school.name])
    completeChallenge('save_from_explore')
  }

  function toggleRegion(regionId: number) {
    handleInteraction()
    setSelectedRegions(prev => {
      const next = new Set(prev)
      if (next.has(regionId)) next.delete(regionId)
      else next.add(regionId)
      return next
    })
    completeChallenge('explore_new_region')
  }

  function toggleStretch() {
    handleInteraction()
    setStretchMode(s => !s)
    if (!stretchMode) completeChallenge('stretch_mode')
  }

  const budgetNum = budget ? Number(budget) : null
  const budgetActive = budgetNum != null && budgetNum > 0 && !flexibleOnPrice
  const filteredResults = budgetActive
    ? results.filter(s => s.avgNetPrice == null || s.avgNetPrice <= budgetNum)
    : results
  const hiddenByBudget = results.length - filteredResults.length

  const schoolsWithChance = filteredResults.map(school => {
    const result = calculateChance(effectiveSAT, effectiveGPA, school, profile?.act_score ?? null, null)
    return {
      ...school,
      chance: result?.chance ?? null,
      tier: result ? chanceToTier(result.chance) : null,
    }
  })

  return (
    <div style={{ maxWidth: 1200, width: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Explore Schools</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Slide your stats and discover schools that match. GPA affects your match score, not the search results.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'flex-start' }} className="strategy-layout">
        <div className="strategy-form-wrapper" style={{ position: 'sticky', top: 32 }}>
          <div className="card-elevated" style={{ padding: '24px 24px 28px' }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <label style={labelStyle}>SAT Score</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                  {effectiveSAT}
                  {stretchMode && <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E', marginLeft: 4 }}>+100</span>}
                </span>
              </div>
              <input type="range" min={400} max={1600} step={10} value={satValue}
                onChange={e => { setSatValue(Number(e.target.value)); handleInteraction() }}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                aria-label={`SAT Score: ${effectiveSAT}`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>400</span><span>1600</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <label style={labelStyle}>GPA (4.0 scale)</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
                  {effectiveGPA.toFixed(1)}
                  {stretchMode && <span style={{ fontSize: 11, fontWeight: 600, color: '#22C55E', marginLeft: 4 }}>+0.3</span>}
                </span>
              </div>
              <input type="range" min={2.0} max={4.0} step={0.1} value={gpaValue}
                onChange={e => { setGpaValue(Number(e.target.value)); handleInteraction() }}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                aria-label={`GPA: ${effectiveGPA.toFixed(1)}`} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>2.0</span><span>4.0</span>
              </div>
            </div>

            <Tooltip text="Boost your SAT by 100 and GPA by 0.3 to see what studying harder could unlock." position="right" maxWidth={220}>
            <button onClick={toggleStretch} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 16px', borderRadius: 10,
                border: stretchMode ? '2px solid #22C55E' : '1.5px solid var(--color-border)',
                background: stretchMode ? 'rgba(34,197,94,0.08)' : 'var(--color-column)',
                color: stretchMode ? '#22C55E' : 'var(--color-text)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 18,
                transition: 'border-color 0.2s, background 0.2s, color 0.2s',
              }}>
              {stretchMode ? '\u2713 Stretch Mode On' : 'Stretch Mode'}
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-muted)' }}>+100 SAT, +0.3 GPA</span>
            </button>
            </Tooltip>

            <div style={{ marginBottom: 18 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
                Budget / Year <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>$</span>
                <input type="number" value={budget}
                  onChange={e => { setBudget(e.target.value); handleInteraction() }}
                  placeholder="e.g. 37000"
                  style={{ width: '100%', padding: '10px 12px 10px 26px', borderRadius: 10,
                    border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
                    color: 'var(--color-text)', fontSize: 14, fontWeight: 600, outline: 'none' }} />
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
                Filter by Major <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <MajorSelect value={selectedMajor} onChange={(v) => { setSelectedMajor(v); handleInteraction() }} placeholder="Any major..." />
              {selectedMajor && selectedMajor !== 'Undecided' && (
                <button onClick={() => { setSelectedMajor(''); handleInteraction() }}
                  style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0, textDecoration: 'underline' }}>
                  Clear major filter
                </button>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: 'block' }}>
                Regions <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)' }}>
                {Object.entries(REGION_LABELS).map(([id, name]) => (
                  <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedRegions.has(Number(id))} onChange={() => toggleRegion(Number(id))} style={{ accentColor: 'var(--color-primary)' }} />
                    {name}
                  </label>
                ))}
              </div>
            </div>

            <Tooltip text="Randomize your regions and score range to discover schools you'd never think to look at." position="top" maxWidth={240}>
            <button onClick={handleSurpriseMe} style={{
                width: '100%', padding: '12px 28px', borderRadius: 10, border: 'none',
                background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              Surprise Me
            </button>
            </Tooltip>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {loading ? 'Searching...' : (
                selectedMajor && selectedMajor !== 'Undecided'
                  ? `${filteredResults.length} schools with ${selectedMajor} programs \u2014 sorted by program strength`
                  : `${filteredResults.length} schools found`
              )}
            </div>
          </div>

          {budgetNum != null && budgetNum > 0 && !loading && results.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600,
              background: flexibleOnPrice ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${flexibleOnPrice ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: flexibleOnPrice ? '#16a34a' : '#dc2626',
            }}>
              {flexibleOnPrice ? (
                <span>Showing all {results.length} schools (budget: ${(budgetNum / 1000).toFixed(0)}k/yr)</span>
              ) : hiddenByBudget > 0 ? (
                <span>{hiddenByBudget} school{hiddenByBudget !== 1 ? 's' : ''} hidden &mdash; above your ${(budgetNum / 1000).toFixed(0)}k/yr budget</span>
              ) : (
                <span>All schools within ${(budgetNum / 1000).toFixed(0)}k/yr budget</span>
              )}
              <button onClick={() => setFlexibleOnPrice(f => !f)} style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                  border: '1.5px solid var(--color-border)', background: 'var(--color-card)',
                  color: 'var(--color-text)', cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                {flexibleOnPrice ? 'Enforce Budget' : 'Flexible on Price'}
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton" style={{ height: 180, borderRadius: 14 }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>&#128270;</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No schools found</div>
              <div style={{ fontSize: 13 }}>Try adjusting your SAT range or selecting different regions.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              <AnimatePresence>
                {schoolsWithChance.map((school, i) => (
                  <ExploreCard key={school.id} school={school} index={i}
                    alreadySaved={collegeNames.includes(school.name) || savedIds.has(school.id)}
                    onSave={() => handleSave(school)}
                    hasMajorFilter={!!(selectedMajor && selectedMajor !== 'Undecided')} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExploreCard({ school, index, alreadySaved, onSave, hasMajorFilter }: {
  school: SchoolResult & { chance: number | null; tier: Tier | null }
  index: number
  alreadySaved: boolean
  onSave: () => void
  hasMajorFilter: boolean
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const cfg = school.tier ? getTierConfig()[school.tier] : null

  async function handleSave() {
    setSaving(true)
    await onSave()
    setSaving(false)
    setSaved(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      style={{
        background: cfg?.bg || 'var(--color-card)',
        border: `1.5px solid ${cfg?.border || 'var(--color-border)'}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {school.chance != null && cfg && (
          <MatchRingSmall chance={school.chance} color={cfg.color} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{school.name}</div>
          {(school.city || school.state) && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {[school.city, school.state].filter(Boolean).join(', ')}
              {school.regionId != null && REGION_LABELS[school.regionId] && (
                <span style={{ opacity: 0.7 }}> &middot; {REGION_LABELS[school.regionId]}</span>
              )}
            </div>
          )}
        </div>
        {school.tier && cfg && (
          <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
            background: cfg.color, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {cfg.label}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {school.avgNetPrice != null && <MiniStat label="Net Cost" value={`$${(school.avgNetPrice / 1000).toFixed(0)}k`} />}
        {school.admissionRate != null && <MiniStat label="Admit" value={`${school.admissionRate}%`} />}
        {hasMajorFilter && (
          school.programCompletions != null && school.programCompletions > 0
            ? <MiniStat label="Grads/yr" value={`${school.programCompletions}`} highlight />
            : <MiniStat label="Grads/yr" value="N/A" muted />
        )}
        {hasMajorFilter && (
          school.programEarnings1yr != null
            ? <MiniStat label="Major $1yr" value={`$${(school.programEarnings1yr / 1000).toFixed(0)}k`} highlight />
            : <MiniStat label="Major $1yr" value="N/A" muted />
        )}
        {hasMajorFilter && school.programStrengthScore != null && (
          <MiniStat label="Strength" value={`${school.programStrengthScore.toFixed(0)}`} highlight />
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
              {school.avgSAT != null && <MiniStat label="Avg SAT" value={String(school.avgSAT)} />}
              {school.gradRate4yr != null && <MiniStat label="Grad Rate" value={`${school.gradRate4yr}%`} />}
              {school.medianEarnings10yr != null && <MiniStat label="Earnings" value={`$${(school.medianEarnings10yr / 1000).toFixed(0)}k`} />}
            </div>
            {school.sat25 && school.sat75 && (
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                SAT range: {school.sat25}&ndash;{school.sat75}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <button onClick={() => setExpanded(!expanded)} style={{
            background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer',
            color: 'var(--color-text-muted)', fontSize: 14, display: 'flex', alignItems: 'center',
            fontWeight: 500, transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>
          {expanded ? '\u25BE' : '\u25B8'}
        </button>

        {saved || alreadySaved ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: saved ? '#059669' : 'var(--color-text-muted)' }}>
            {saved ? '\u2713 Saved!' : 'In your collection'}
          </span>
        ) : (
          <button onClick={handleSave} disabled={saving} style={{
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
              border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
              color: 'var(--color-text)', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}>
            {saving ? 'Saving...' : '\u2661 Save'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function MatchRingSmall({ chance, color }: { chance: number; color: string }) {
  const size = 42
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (chance / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`${chance}% admission chance`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={2.5} opacity={0.12} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1 }}>{chance}%</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value, highlight, muted }: { label: string; value: string; highlight?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50, opacity: muted ? 0.45 : 1 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: highlight ? 'var(--color-primary)' : 'var(--color-text)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{label}</span>
    </div>
  )
}
