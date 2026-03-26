'use client'

import { motion } from 'framer-motion'
import { useMilestones, useMarkMilestone, type MilestoneRecord } from '@/hooks/useMilestones'

const MILESTONES = [
  { key: 'psat_taken',         label: 'PSAT Taken',             icon: '📝', desc: 'You took the PSAT — your College Board journey begins.',                    phase: 'Prep'     },
  { key: 'schools_researched', label: 'Schools Researched',     icon: '🔭', desc: 'Built your initial list of colleges.',                                        phase: 'Prep'     },
  { key: 'first_sat',          label: 'First SAT Complete',     icon: '✏️', desc: 'First official SAT score in the books.',                                     phase: 'Prep'     },
  { key: 'campus_visits_done', label: 'Campus Visits Done',     icon: '🏫', desc: 'Visited campuses and got a feel for your schools.',                           phase: 'Research' },
  { key: 'recommenders_asked', label: 'Recommenders Asked',     icon: '🤝', desc: 'Secured your letter writers.',                                                phase: 'Research' },
  { key: 'essay_drafted',      label: 'Essay Drafted',          icon: '✍️', desc: 'Your Common App personal statement is drafted.',                             phase: 'Apply'    },
  { key: 'commonapp_started',  label: 'Common App Started',     icon: '🖥️', desc: 'Your Common App account is live.',                                           phase: 'Apply'    },
  { key: 'fafsa_submitted',    label: 'FAFSA Submitted',        icon: '💰', desc: 'Financial aid form submitted on time.',                                       phase: 'Apply'    },
  { key: 'apps_submitted',     label: 'Applications Submitted', icon: '🚀', desc: 'All applications are in — now you wait!',                                    phase: 'Final'    },
  { key: 'decision_made',      label: 'Decision Made',          icon: '🎓', desc: 'You committed to your school — the journey ends here and a new one begins!', phase: 'Final'    },
]

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const getPhases = () => isDark() ? [
  { label: 'Prep',     color: '#FCD34D', bg: 'rgba(252,211,77,0.10)' },
  { label: 'Research', color: '#7DD3FC', bg: 'rgba(125,211,252,0.10)' },
  { label: 'Apply',    color: '#FDE68A', bg: 'rgba(253,230,138,0.10)' },
  { label: 'Final',    color: '#86EFAC', bg: 'rgba(134,239,172,0.10)' },
] : [
  { label: 'Prep',     color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
  { label: 'Research', color: '#0891b2', bg: 'rgba(8,145,178,0.12)'  },
  { label: 'Apply',    color: '#d97706', bg: 'rgba(245,158,11,0.12)' },
  { label: 'Final',    color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
]

export function JourneyClient({ userId }: { userId: string }) {
  const milestonesQuery = useMilestones(userId)
  const milestones: MilestoneRecord[] = milestonesQuery.data ?? []
  const markMilestone = useMarkMilestone(userId)

  const milestoneKeys = milestones.map(m => m.milestone_key)
  const reached = new Set(milestoneKeys)
  const firstUnreached = MILESTONES.findIndex(m => !reached.has(m.key))
  const pct = Math.round((reached.size / MILESTONES.length) * 100)

  const PHASES = getPhases()
  const phaseStats = PHASES.map(phase => {
    const items = MILESTONES.filter(m => m.phase === phase.label)
    return { ...phase, total: items.length, done: items.filter(m => reached.has(m.key)).length }
  })

  const nextMilestone = firstUnreached >= 0 ? MILESTONES[firstUnreached] : null

  return (
    <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start' }}>

      {/* ── Left: milestone list ── */}
      <div style={{ flex: '0 0 400px', minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Your Journey 🗺️</h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 32 }}>
          Track your progress toward key milestones on the road to acceptance. · {reached.size} of {MILESTONES.length} reached
        </p>

        <div style={{ position: 'relative' }}>
          {/* Vertical connector */}
          <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--color-border)', zIndex: 0 }} />

          {MILESTONES.map((m, i) => {
            const isReached = reached.has(m.key)
            const isCurrent = i === firstUnreached
            const phase = PHASES.find(p => p.label === m.phase)!

            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                style={{ display: 'flex', gap: 20, marginBottom: 22, position: 'relative', zIndex: 1 }}
              >
                <button
                  onClick={() => markMilestone.mutate(m.key)}
                  title={isReached ? 'Click to unmark' : 'Click to mark as reached'}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0, cursor: 'pointer',
                    background: isReached ? phase.color : isCurrent ? 'var(--color-primary)' : 'var(--color-column)',
                    border: `2px solid ${isReached ? phase.color : isCurrent ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    boxShadow: isCurrent ? '0 0 0 4px color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'none',
                    color: isReached ? '#fff' : isCurrent ? '#fff' : 'inherit',
                    transition: 'all 0.25s',
                  }}
                >
                  {isReached ? '✓' : m.icon}
                </button>

                <div style={{ paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      fontWeight: 700, fontSize: 14,
                      color: isReached ? 'var(--color-text-muted)' : 'var(--color-text)',
                      textDecoration: isReached ? 'line-through' : 'none',
                    }}>
                      {m.label}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                      background: phase.bg, color: phase.color,
                    }}>
                      {m.phase}
                    </span>
                  </div>
                  {(isReached || isCurrent) && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, lineHeight: 1.4 }}>
                      {m.desc}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Right: visualization panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

        {/* Big segmented ring */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-elevated"
          style={{ padding: '28px 24px', textAlign: 'center' }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 20 }}>
            Overall Progress
          </div>

          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="172" height="172" viewBox="0 0 172 172" style={{ transform: 'rotate(-90deg)' }}>
              {/* Render phase segments */}
              {(() => {
                const R = 72
                const circumference = 2 * Math.PI * R
                const GAP = 6
                let cumulativeOffset = 0
                return phaseStats.map((phase, pi) => {
                  const segTotal = (phase.total / MILESTONES.length) * circumference
                  const segDone  = (phase.done  / MILESTONES.length) * circumference
                  const dashBg   = segTotal - GAP
                  const dashDone = Math.max(0, segDone - (segDone < segTotal ? GAP / 2 : GAP))
                  const el = (
                    <g key={pi}>
                      {/* Track segment */}
                      <circle cx="86" cy="86" r={R} fill="none"
                        stroke={phase.bg.replace('0.12', '0.35')}
                        strokeWidth="14"
                        strokeDasharray={`${dashBg} ${circumference}`}
                        strokeDashoffset={-(cumulativeOffset)}
                        strokeLinecap="round"
                      />
                      {/* Progress segment */}
                      {phase.done > 0 && (
                        <motion.circle cx="86" cy="86" r={R} fill="none"
                          stroke={phase.color}
                          strokeWidth="14"
                          strokeDasharray={`${dashDone} ${circumference}`}
                          strokeDashoffset={-(cumulativeOffset)}
                          strokeLinecap="round"
                          initial={{ strokeDasharray: `0 ${circumference}` }}
                          animate={{ strokeDasharray: `${dashDone} ${circumference}` }}
                          transition={{ duration: 1, delay: 0.4 + pi * 0.15, ease: 'easeOut' }}
                        />
                      )}
                    </g>
                  )
                  cumulativeOffset += segTotal
                  return el
                })
              })()}
            </svg>

            {/* Center label */}
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                style={{ fontSize: 42, fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}
              >
                {pct}%
              </motion.div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 600 }}>
                {reached.size} of {MILESTONES.length}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 20, flexWrap: 'wrap' }}>
            {phaseStats.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {p.label} ({p.done}/{p.total})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phase breakdown bars */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-elevated"
          style={{ padding: '20px 24px' }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Phase Breakdown
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {phaseStats.map((phase, pi) => (
              <motion.div
                key={phase.label}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + pi * 0.08 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: phase.done === phase.total ? phase.color : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {phase.done === phase.total && <span style={{ fontSize: 11 }}>✓</span>}
                    {phase.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: phase.color }}>
                    {phase.done}/{phase.total}
                  </span>
                </div>
                <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(phase.done / phase.total) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.4 + pi * 0.1, ease: 'easeOut' }}
                    style={{ height: '100%', background: phase.color, borderRadius: 99 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next up / Complete */}
        {nextMilestone ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card-elevated"
            style={{ padding: '18px 20px', borderLeft: '3px solid var(--color-primary)' }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Up Next
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 26 }}>{nextMilestone.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{nextMilestone.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>{nextMilestone.desc}</div>
              </div>
            </div>
            <button
              onClick={() => markMilestone.mutate(nextMilestone.key)}
              disabled={markMilestone.isPending}
              style={{
                width: '100%', padding: '10px 0',
                background: 'var(--color-primary)', color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {markMilestone.isPending ? 'Saving…' : '✓ Mark as Reached'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="card-elevated"
            style={{ padding: '24px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>Journey Complete!</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>All 10 milestones reached. Congratulations!</div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
