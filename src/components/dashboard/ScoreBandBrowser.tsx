'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculateChance } from '@/lib/services/admissionChance'
import { getTierConfig, chanceToTier, REGION_LABELS, type Tier } from '@/lib/tierConfig'
import { useAddCollege } from '@/hooks/useUserColleges'
import { useDailyChallenges } from '@/hooks/useDailyChallenges'
import { Tooltip } from '@/components/ui/Tooltip'

interface ScoreBandProps {
  profile: {
    gpa: number | null
    gpa_weighted: number | null
    sat: number | null
    act_score: number | null
    home_state: string | null
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
  tuitionInState: number | null
  tuitionOutOfState: number | null
}

type SortOption = 'chance' | 'net_cost' | 'grad_rate' | 'earnings' | 'acceptance' | 'size' | 'tuition_in' | 'tuition_out'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'chance', label: 'Match Score' },
  { value: 'net_cost', label: 'Net Cost (Low to High)' },
  { value: 'grad_rate', label: 'Grad Rate' },
  { value: 'earnings', label: 'Earnings (10yr)' },
  { value: 'acceptance', label: 'Acceptance Rate' },
  { value: 'size', label: 'School Size' },
  { value: 'tuition_in', label: 'Tuition (In-State)' },
  { value: 'tuition_out', label: 'Tuition (Out-of-State)' },
]

const TIER_TIPS: Record<Tier, string> = {
  reach: 'Schools where your stats are below the average admitted student. Worth applying \u2014 upsets happen!',
  target: 'Schools where your profile is a solid match. You have a realistic shot at admission.',
  safety: 'Schools where your stats exceed the typical admitted student. Very likely to get in.',
}

export function ScoreBandBrowser({ profile, collegeNames: initialColleges, userId }: ScoreBandProps) {
  const addCollege = useAddCollege(userId)
  const { completeChallenge } = useDailyChallenges(userId)
  const [collegeNames, setCollegeNames] = useState(initialColleges)
  const [allSchools, setAllSchools] = useState<SchoolResult[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('chance')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [expandedTiers, setExpandedTiers] = useState<Set<Tier>>(new Set(['reach', 'target', 'safety']))

  const studentSAT = profile?.sat ?? null
  const studentGPA = profile?.gpa ?? null
  const studentACT = profile?.act_score ?? null
  const studentGPAWeighted = profile?.gpa_weighted ?? null

  // Fetch a broad range of schools
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch schools around the student's SAT range (wide window)
      const sat = studentSAT ?? 1100
      const ranges = [
        { satMin: Math.max(400, sat - 300), satMax: sat - 50, sort: 'sat', sortDir: 'desc' },  // below
        { satMin: sat - 80, satMax: sat + 80, sort: 'sat', sortDir: 'desc' },                   // around
        { satMin: sat + 50, satMax: Math.min(1600, sat + 400), sort: 'sat', sortDir: 'asc' },   // above
      ]

      const fetches = ranges.map(r => {
        const params = new URLSearchParams({
          satMin: String(r.satMin),
          satMax: String(r.satMax),
          perPage: '40',
          sort: r.sort,
          sortDir: r.sortDir,
        })
        return fetch(`/api/colleges/explore?${params}`).then(res => res.json())
      })

      const data = await Promise.all(fetches)
      const seen = new Set<string>()
      const merged: SchoolResult[] = []
      for (const d of data) {
        for (const school of (d.results || [])) {
          if (!seen.has(school.id)) {
            seen.add(school.id)
            merged.push(school)
          }
        }
      }
      setAllSchools(merged)
    } catch {
      setAllSchools([])
    } finally {
      setLoading(false)
    }
  }, [studentSAT])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Compute chances and classify into tiers
  const classified = allSchools.map(school => {
    const result = calculateChance(studentSAT, studentGPA, school, studentACT, studentGPAWeighted)
    return {
      ...school,
      chance: result?.chance ?? null,
      tier: result ? chanceToTier(result.chance) : null,
    }
  }).filter(s => s.tier != null)

  // Sort within tiers
  function sortSchools(schools: typeof classified) {
    return [...schools].sort((a, b) => {
      switch (sortBy) {
        case 'chance':
          return (b.chance ?? 0) - (a.chance ?? 0)
        case 'net_cost':
          return (a.avgNetPrice ?? 999999) - (b.avgNetPrice ?? 999999)
        case 'grad_rate':
          return (b.gradRate4yr ?? 0) - (a.gradRate4yr ?? 0)
        case 'earnings':
          return (b.medianEarnings10yr ?? 0) - (a.medianEarnings10yr ?? 0)
        case 'acceptance':
          return (a.admissionRate ?? 999) - (b.admissionRate ?? 999)
        case 'size':
          return (b.enrollment ?? 0) - (a.enrollment ?? 0)
        case 'tuition_in':
          return (a.tuitionInState ?? 999999) - (b.tuitionInState ?? 999999)
        case 'tuition_out':
          return (a.tuitionOutOfState ?? 999999) - (b.tuitionOutOfState ?? 999999)
        default:
          return 0
      }
    })
  }

  const tiers: { tier: Tier; schools: typeof classified }[] = [
    { tier: 'reach', schools: sortSchools(classified.filter(s => s.tier === 'reach')) },
    { tier: 'target', schools: sortSchools(classified.filter(s => s.tier === 'target')) },
    { tier: 'safety', schools: sortSchools(classified.filter(s => s.tier === 'safety')) },
  ]

  async function handleSave(school: SchoolResult) {
    setSavedIds(prev => new Set(prev).add(school.id))
    await addCollege.mutateAsync({ name: school.name, collegeId: school.id })
    setCollegeNames(prev => prev.includes(school.name) ? prev : [...prev, school.name])
  }

  function toggleTier(tier: Tier) {
    setExpandedTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
    if (tier === 'safety') completeChallenge('browse_safety')
    if (tier === 'reach') completeChallenge('browse_reach')
  }

  if (!studentSAT && !studentACT) {
    return (
      <div style={{ maxWidth: 900, width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Score Bands</h1>
        <div className="card-elevated" style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#128202;</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Add your test scores first</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Score Bands needs your SAT or ACT to classify schools into Reach, Target, and Safety tiers.
          </div>
          <a href="/profile" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
            Go to Profile →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, width: '100%' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Score Bands</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Schools grouped by your admission chances. Browse by tier and discover hidden gems.
      </p>

      {/* Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Sort by:
        </label>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          style={{
            padding: '9px 12px',
            border: '1.5px solid var(--color-border)',
            borderRadius: 8,
            background: 'var(--color-column)',
            color: 'var(--color-text)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="skeleton" style={{ height: 24, width: 120, borderRadius: 6, marginBottom: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(j => (
                  <div key={j} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {tiers.map(({ tier, schools }) => {
            const cfg = getTierConfig()[tier]
            const isExpanded = expandedTiers.has(tier)

            return (
              <div key={tier}>
                {/* Tier header */}
                <button
                  onClick={() => toggleTier(tier)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 0',
                    marginBottom: isExpanded ? 12 : 0,
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                  <Tooltip text={TIER_TIPS[tier]} position="right" maxWidth={240}>
                    <h2 style={{ fontWeight: 700, fontSize: 18, color: cfg.color, margin: 0 }}>{cfg.label}</h2>
                  </Tooltip>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {schools.length} schools
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 16,
                    color: 'var(--color-text-muted)',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    &#9662;
                  </span>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {schools.length === 0 ? (
                        <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          No schools found in this tier. Try adjusting your scores on the Explore page.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {schools.map((school, i) => (
                            <BandCard
                              key={school.id}
                              school={school}
                              tier={tier}
                              index={i}
                              alreadySaved={collegeNames.includes(school.name) || savedIds.has(school.id)}
                              onSave={() => handleSave(school)}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BandCard({ school, tier, index, alreadySaved, onSave }: {
  school: {
    id: string; name: string; city: string | null; state: string | null
    admissionRate: number | null; avgSAT: number | null; sat25: number | null; sat75: number | null
    avgNetPrice: number | null; gradRate4yr: number | null; medianEarnings10yr: number | null
    chance: number | null; enrollment: number | null
    tuitionInState: number | null; tuitionOutOfState: number | null
  }
  tier: Tier
  index: number
  alreadySaved: boolean
  onSave: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const cfg = getTierConfig()[tier]

  async function handleSave() {
    setSaving(true)
    await onSave()
    setSaving(false)
    setSaved(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1.5px solid ${cfg.border}`,
        background: cfg.bg,
      }}
    >
      {/* Match ring */}
      {school.chance != null && (
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <svg width={40} height={40} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`${school.chance}% admission chance`}>
            <circle cx={20} cy={20} r={17} fill="none" stroke="currentColor" strokeWidth={2.5} opacity={0.12} />
            <circle
              cx={20} cy={20} r={17} fill="none" stroke={cfg.color} strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 17}
              strokeDashoffset={2 * Math.PI * 17 - (school.chance / 100) * 2 * Math.PI * 17}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color }}>{school.chance}%</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{school.name}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
          {[school.city, school.state].filter(Boolean).join(', ')}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0, alignItems: 'center' }}>
        {school.avgNetPrice != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>${(school.avgNetPrice / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Cost</div>
          </div>
        )}
        {school.gradRate4yr != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{school.gradRate4yr}%</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Grad</div>
          </div>
        )}
        {school.medianEarnings10yr != null && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>${(school.medianEarnings10yr / 1000).toFixed(0)}k</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Earnings</div>
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ flexShrink: 0 }}>
        {saved || alreadySaved ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: saved ? '#059669' : 'var(--color-text-muted)' }}>
            {saved ? '\u2713' : 'Saved'}
          </span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 7,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              cursor: saving ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? '...' : '\u2661 Save'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
