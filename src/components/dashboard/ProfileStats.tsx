'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Profile, Task, UserCollege } from '@/lib/types/database'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useUserColleges, useAddCollege, useRemoveCollege, useUpdateCollege } from '@/hooks/useUserColleges'
import { MajorSelect } from '@/components/MajorSelect'
import { CollegeSelect } from '@/components/CollegeSelect'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import type { ReadinessScore } from '@/hooks/useReadinessScore'
import Link from 'next/link'
import { Tooltip } from '@/components/ui/Tooltip'

interface ProfileStatsProps {
  profile: Profile | null | undefined
  loading: boolean
  tasks: Task[]
  userId: string
}

/** Shorten school name: strip "University", "of", "The", "College" to fit chips */
function chipName(name: string): string {
  return name
    .replace(/^The\s+/i, '')
    .replace(/\s+at\s+/i, ' ')
    .replace(/\bUniversity\b/gi, '')
    .replace(/\bCollege\b/gi, '')
    .replace(/\bof\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const isDark = () => typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'

function ringColor(total: number): string {
  const dark = isDark()
  if (total <= 30) return dark ? '#FCA5A5' : '#EF4444'
  if (total <= 60) return dark ? '#FDE68A' : '#F59E0B'
  if (total <= 85) return dark ? '#5EEAD4' : '#0891b2'
  return dark ? '#86EFAC' : '#22C55E'
}

function actionRoute(action: string): string {
  if (action.toLowerCase().includes('school')) return '/profile'
  if (action.toLowerCase().includes('preference')) return '/profile'
  if (action.toLowerCase().includes('gpa') || action.toLowerCase().includes('sat') || action.toLowerCase().includes('act') || action.toLowerCase().includes('major') || action.toLowerCase().includes('state') || action.toLowerCase().includes('year')) return '/profile'
  if (action.toLowerCase().includes('scholarship')) return '/scholarships'
  if (action.toLowerCase().includes('milestone')) return '/journey'
  return '/'
}

function DimBar({ score, max, color }: { score: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function ReadinessDetailPanel({ score, onClose }: { score: ReadinessScore; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const { profile, tasks, milestones, scholarships, momentum } = score.dimensions
  const color = ringColor(score.total)

  const dimensions = [
    {
      icon: '📋',
      label: 'Profile',
      dim: profile,
      detail: profile.items.map(i => ({ label: i.label, earned: i.earned })),
    },
    {
      icon: '📝',
      label: 'Tasks',
      dim: tasks,
      detail: [{ label: `${tasks.done} of ${tasks.total} tasks complete`, earned: tasks.done > 0 }],
    },
    {
      icon: '🗺️',
      label: 'Milestones',
      dim: milestones,
      detail: [{ label: `${milestones.reached} of 10 milestones reached`, earned: milestones.reached > 0 }],
    },
    {
      icon: '🏆',
      label: 'Scholarships',
      dim: scholarships,
      detail: scholarships.items,
    },
    {
      icon: '⚡',
      label: 'Momentum',
      dim: momentum,
      detail: momentum.items,
    },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="card-elevated"
        style={{
          position: 'relative', zIndex: 1, width: 480, maxWidth: '92vw',
          maxHeight: '85vh', overflow: 'auto', padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>
              Application Readiness
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1.1, marginTop: 2 }}>
              {score.total}/100
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-text-muted)', padding: 4, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Overall bar */}
        <div style={{ height: 10, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden', marginBottom: 24 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score.total}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: 99 }}
          />
        </div>

        {/* Dimensions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dimensions.map(({ icon, label, dim, detail }) => {
            const pct = Math.round((dim.score / dim.max) * 100)
            const dimColor = isDark()
              ? (pct >= 80 ? '#86EFAC' : pct >= 50 ? '#5EEAD4' : pct >= 30 ? '#FDE68A' : '#FCA5A5')
              : (pct >= 80 ? '#22C55E' : pct >= 50 ? '#0891b2' : pct >= 30 ? '#F59E0B' : '#EF4444')
            return (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: dimColor }}>
                    {dim.score}/{dim.max}
                  </span>
                  <DimBar score={dim.score} max={dim.max} color={dimColor} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', paddingLeft: 24 }}>
                  {detail.map((item, i) => (
                    <span key={i} style={{ fontSize: 11, color: item.earned ? 'var(--color-text-muted)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ color: item.earned ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                        {item.earned ? '✓' : '✗'}
                      </span>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Next steps */}
        {score.topActions.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Next steps to boost your score
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {score.topActions.map((action, i) => (
                <a
                  key={i}
                  href={actionRoute(action)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent-text, var(--color-primary))', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                >
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>→</span>
                  {action}
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export function ProfileStats({ profile, loading, tasks, userId }: ProfileStatsProps) {
  const updateProfile = useUpdateProfile(userId)
  const { data: colleges = [] } = useUserColleges(userId)
  const addCollege = useAddCollege(userId)
  const removeCollege = useRemoveCollege(userId)
  const updateCollegeMut = useUpdateCollege(userId)
  const readiness = useReadinessScore(userId)
  const [showDetail, setShowDetail] = useState(false)

  const upcomingCount = tasks.filter(t => {
    if (t.status === 'Done' || !t.due_date) return false
    const daysUntil = (new Date(t.due_date).getTime() - Date.now()) / 86400000
    return daysUntil >= 0 && daysUntil <= 30
  }).length

  const R = 16
  const circumference = 2 * Math.PI * R
  const score = readiness.isLoading ? 0 : readiness.total
  const strokeOffset = circumference * (1 - score / 100)
  const color = ringColor(score)
  const topAction = readiness.topActions[0]

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-elevated"
        style={{ padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {[60, 60, 56, 48, 100].map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="skeleton" style={{ height: 10, width: 40, borderRadius: 4 }} />
              <div className="skeleton" style={{ height: 22, width: w, borderRadius: 6 }} />
            </div>
          ))}
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 28, width: 80, borderRadius: 20 }} />
            ))}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated"
      style={{ padding: '20px 24px' }}
    >
      {/* Row 1: Stats + Readiness ring */}
      <div className="profile-stats__top">
        <div className="profile-stats__pills">
          {/* Unweighted GPA */}
          <EditableStatPill
            label="UW GPA" color={isDark() ? 'var(--color-stat-gpa, #5EEAD4)' : 'var(--color-primary)'}
            value={loading ? null : profile?.gpa ?? null}
            display={loading ? '—' : profile?.gpa?.toString() ?? '—'}
            type="gpa"
            onSave={v => updateProfile.mutate({ gpa: v ? parseFloat(v) : null })}
            tooltip="Your unweighted GPA on a 4.0 scale. Click to edit."
          />
          {/* Weighted GPA */}
          <EditableStatPill
            label="W GPA" color={isDark() ? 'var(--color-stat-gpa, #5EEAD4)' : 'var(--color-primary)'}
            value={loading ? null : profile?.gpa_weighted ?? null}
            display={loading ? '—' : profile?.gpa_weighted?.toString() ?? '—'}
            type="gpa_weighted"
            onSave={v => updateProfile.mutate({ gpa_weighted: v ? parseFloat(v) : null })}
            tooltip="Your weighted GPA on a 5.0 scale (honors/AP classes count higher). Click to edit."
          />
          {/* SAT */}
          <EditableStatPill
            label="SAT" color={isDark() ? 'var(--color-stat-sat, #FCD34D)' : '#d97706'}
            value={loading ? null : profile?.sat ?? null}
            display={loading ? '—' : profile?.sat?.toString() ?? '—'}
            type="sat"
            onSave={v => updateProfile.mutate({ sat: v ? parseInt(v) : null })}
            tooltip="Your SAT composite score (400–1600). Used for admission estimates. Click to edit."
          />
          {/* ACT */}
          <EditableStatPill
            label="ACT" color={isDark() ? 'var(--color-stat-act, #7DD3FC)' : '#0891b2'}
            value={loading ? null : profile?.act_score ?? null}
            display={loading ? '—' : profile?.act_score?.toString() ?? '—'}
            type="act"
            onSave={v => updateProfile.mutate({ act_score: v ? parseInt(v) : null })}
            tooltip="Your ACT composite score (1–36). Used for admission estimates. Click to edit."
          />
          {/* Major */}
          <EditableMajorPill
            label="Major"
            display={loading ? '—' : profile?.proposed_major ?? 'Not set'}
            onSave={v => updateProfile.mutate({ proposed_major: v || null })}
            tooltip="Your intended college major. Affects school recommendations and strategy."
          />
        </div>

        {/* Readiness ring */}
        <Tooltip text="Your overall application readiness score. Tracks profile, tasks, milestones, scholarships & momentum. Click for a full breakdown." position="bottom">
        <button
          onClick={() => setShowDetail(true)}
          className="profile-stats__readiness"
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r={R} fill="none" stroke="var(--color-border)" strokeWidth="4" />
            {readiness.isLoading ? (
              <circle
                cx="20" cy="20" r={R}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="4"
                strokeDasharray={`${circumference * 0.3} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ opacity: 0.4 }}
              />
            ) : (
              <circle
                cx="20" cy="20" r={R}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${strokeOffset}`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
              />
            )}
            <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-text)">
              {readiness.isLoading ? '…' : `${score}%`}
            </text>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Readiness
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {readiness.isLoading ? '…' : topAction ? topAction.replace(/ \(\+\d+ pts\)$/, '') : `${upcomingCount} due soon`}
            </div>
          </div>
        </button>
        </Tooltip>
      </div>

      {/* Row 2: School chips (own line so they don't crowd stats) */}
      {!loading && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
          <SchoolChipsRow
            colleges={colleges}
            profile={profile}
            onAdd={name => addCollege.mutate({ name })}
            onUpdate={(id, name) => updateCollegeMut.mutate({ id, name })}
            onRemove={id => removeCollege.mutate(id)}
          />
        </div>
      )}

      <AnimatePresence>
        {showDetail && (
          <ReadinessDetailPanel score={readiness} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EditableStatPill({ label, color, display, onSave, type, tooltip }: {
  label: string; color: string; value: number | null
  display: string; type: 'gpa' | 'gpa_weighted' | 'sat' | 'act'
  onSave: (v: string) => void
  tooltip?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(display === '—' ? '' : display)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 30)
  }

  function commit() {
    setEditing(false)
    const val = draft.trim()
    // Allow clearing the value
    if (!val) { onSave(''); setSaved(true); setTimeout(() => setSaved(false), 1800); return }
    // Basic validation
    if (type === 'gpa') {
      const n = parseFloat(val)
      if (isNaN(n) || n < 0 || n > 4.0) { setSaved(false); return }
    } else if (type === 'gpa_weighted') {
      const n = parseFloat(val)
      if (isNaN(n) || n < 0 || n > 5.0) { setSaved(false); return }
    } else if (type === 'act') {
      const n = parseInt(val)
      if (isNaN(n) || n < 1 || n > 36) { setSaved(false); return }
    } else {
      const n = parseInt(val)
      if (isNaN(n) || n < 400 || n > 1600) { setSaved(false); return }
    }
    onSave(val)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Tooltip text={tooltip || `Click to edit ${label}`} position="top">
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
          {label}
        </span>
      </Tooltip>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          type="number"
          step={type === 'gpa' || type === 'gpa_weighted' ? '0.01' : type === 'act' ? '1' : '10'}
          min={type === 'gpa' || type === 'gpa_weighted' ? '0' : type === 'act' ? '1' : '400'}
          max={type === 'gpa' ? '4.0' : type === 'gpa_weighted' ? '5.0' : type === 'act' ? '36' : '1600'}
          style={{
            fontSize: 20, fontWeight: 800, color, lineHeight: 1,
            width: type === 'gpa' || type === 'gpa_weighted' ? 56 : type === 'act' ? 48 : 72, border: 'none', borderBottom: `2px solid ${color}`,
            background: 'transparent', outline: 'none', padding: '0 0 2px',
          }}
        />
      ) : (
        <button
          onClick={startEdit}
          style={{
            fontSize: 20, fontWeight: 800, color, lineHeight: 1,
            background: 'none', border: 'none', padding: 0, cursor: 'text',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {saved ? <span style={{ color: '#059669' }}>✓</span> : display}
          {!saved && <span style={{ fontSize: 9, color: 'var(--color-text-muted)', opacity: 0.6, fontWeight: 400, marginTop: 2 }}>✎</span>}
        </button>
      )}
    </div>
  )
}

function EditableMajorPill({ label, display, onSave, tooltip }: {
  label: string; display: string; onSave: (v: string) => void
  tooltip?: string
}) {
  const color = '#059669'
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)

  function startEdit() {
    setEditing(true)
  }

  function handleSelect(val: string) {
    setEditing(false)
    onSave(val)
    if (val) { setSaved(true); setTimeout(() => setSaved(false), 1800) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Tooltip text={tooltip || `Click to edit ${label}`} position="top">
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
          {label}
        </span>
      </Tooltip>
      {editing ? (
        <div style={{ width: 200 }}>
          <MajorSelect
            value={display === 'Not set' || display === '—' ? '' : display}
            onChange={handleSelect}
            placeholder="Search major…"
          />
        </div>
      ) : (
        <button
          onClick={startEdit}
          title="Click to edit Major"
          style={{
            fontSize: 16, fontWeight: 800, color, lineHeight: 1,
            background: 'none', border: 'none', padding: 0, cursor: 'text',
            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {saved ? <span style={{ color: '#059669' }}>✓</span> : display}
          {!saved && <span style={{ fontSize: 9, color: 'var(--color-text-muted)', opacity: 0.6, fontWeight: 400, marginTop: 2 }}>✎</span>}
        </button>
      )}
    </div>
  )
}

interface QuickViewData {
  chance: number
  admissionRate: number | null
  sat25: number | null
  sat75: number | null
  avgSAT: number | null
  actMidpoint: number | null
  avgNetPrice: number | null
  tuitionInState: number | null
  tuitionOutOfState: number | null
  schoolState: string | null
}

function SchoolChipsRow({ colleges, profile, onAdd, onUpdate, onRemove }: {
  colleges: UserCollege[]
  profile: Profile | null | undefined
  onAdd: (name: string) => void
  onUpdate: (id: string, name: string) => void
  onRemove: (id: string) => void
}) {
  const [addingSchool, setAddingSchool] = useState(false)
  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [quickViewCache, setQuickViewCache] = useState<Record<string, QuickViewData | 'loading' | 'error'>>({})

  const fetchQuickView = useCallback((college: UserCollege) => {
    if (quickViewCache[college.id] && quickViewCache[college.id] !== 'error') return
    setQuickViewCache(prev => ({ ...prev, [college.id]: 'loading' }))
    fetch('/api/colleges/chances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gpa: profile?.gpa,
        gpa_weighted: profile?.gpa_weighted,
        sat: profile?.sat,
        act: profile?.act_score,
        proposed_major: profile?.proposed_major,
        schools: [{ name: college.college_name, id: college.college_id }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const r = data.results?.[0]
        if (r) {
          setQuickViewCache(prev => ({
            ...prev,
            [college.id]: {
              chance: r.chance,
              admissionRate: r.admissionRate,
              sat25: r.sat25,
              sat75: r.sat75,
              avgSAT: r.avgSAT,
              actMidpoint: r.actMidpoint ?? null,
              avgNetPrice: r.avgNetPrice ?? null,
              tuitionInState: r.tuitionInState ?? null,
              tuitionOutOfState: r.tuitionOutOfState ?? null,
              schoolState: r.schoolState ?? null,
            },
          }))
        } else {
          setQuickViewCache(prev => ({ ...prev, [college.id]: 'error' }))
        }
      })
      .catch(() => setQuickViewCache(prev => ({ ...prev, [college.id]: 'error' })))
  }, [profile, quickViewCache])

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
      {colleges.map(c => (
        <SchoolChipWithQuickView
          key={c.id}
          college={c}
          homeState={profile?.home_state ?? null}
          isActive={activeChipId === c.id}
          quickViewData={quickViewCache[c.id] ?? null}
          onOpen={() => {
            setActiveChipId(prev => prev === c.id ? null : c.id)
            fetchQuickView(c)
          }}
          onClose={() => setActiveChipId(null)}
          onEdit={v => { onUpdate(c.id, v); setActiveChipId(null) }}
          onRemove={() => { onRemove(c.id); setActiveChipId(null) }}
        />
      ))}

      {/* "+ Add" chip */}
      {addingSchool ? (
        <div style={{ width: 220 }}>
          <CollegeSelect
            value=""
            onChange={v => {
              if (v) onAdd(v)
              setAddingSchool(false)
            }}
            placeholder="Search for a college..."
            inputStyle={{ padding: '5px 10px', fontSize: 12, borderRadius: 20 }}
          />
        </div>
      ) : (
        <Tooltip text="Search and add a college to your list to see admission odds and compare schools." position="bottom">
        <button
          onClick={() => setAddingSchool(true)}
          style={{
            background: 'var(--color-column)', color: 'var(--color-text-muted)',
            fontWeight: 600, fontSize: 12, padding: '5px 12px', borderRadius: 20,
            border: '1.5px dashed var(--color-border)', cursor: 'pointer',
          }}
        >
          + Add College
        </button>
        </Tooltip>
      )}

      {/* Compare link */}
      {colleges.length >= 2 && (
        <Tooltip text="Side-by-side comparison of tuition, admit rates, SAT ranges, and more for your saved schools." position="bottom">
        <Link
          href="/compare"
          style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-primary)',
            textDecoration: 'none', padding: '5px 10px', whiteSpace: 'nowrap',
          }}
        >
          Compare →
        </Link>
        </Tooltip>
      )}
    </div>
  )
}

function OverflowSchoolRow({ name, onEdit, onRemove }: {
  name: string
  onEdit: (v: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div style={{ width: '100%' }}>
        <CollegeSelect
          value={name}
          onChange={v => { onEdit(v); setEditing(false) }}
          placeholder="Search for a college…"
          inputStyle={{ padding: '5px 10px', fontSize: 12, borderRadius: 20 }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {chipName(name)}
      </span>
      <button
        onClick={() => setEditing(true)}
        title="Edit school"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-muted)', padding: '2px 4px', flexShrink: 0 }}
      >
        ✎
      </button>
      <button
        onClick={onRemove}
        title="Remove school"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', padding: '2px 4px', flexShrink: 0, lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  )
}

function tierLabel(chance: number): { label: string; color: string; bg: string } {
  if (chance >= 65) return { label: 'Safety', color: '#34D399', bg: 'rgba(52,211,153,0.12)' }
  if (chance >= 35) return { label: 'Target', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' }
  return { label: 'Reach', color: '#FB7185', bg: 'rgba(251,113,133,0.12)' }
}

function fmt$(n: number | null): string {
  if (n == null) return '--'
  return `$${(n / 1000).toFixed(0)}k`
}

function SchoolChipWithQuickView({ college, homeState, isActive, quickViewData, onOpen, onClose, onEdit, onRemove }: {
  college: UserCollege
  homeState: string | null
  isActive: boolean
  quickViewData: QuickViewData | 'loading' | 'error' | null
  onOpen: () => void
  onClose: () => void
  onEdit: (name: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) return
    function handleClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [isActive, onClose])

  if (editing) {
    return (
      <div style={{ width: 220 }}>
        <CollegeSelect
          value={college.college_name}
          onChange={v => { onEdit(v); setEditing(false) }}
          placeholder="Search for a college..."
          inputStyle={{ padding: '5px 10px', fontSize: 12, borderRadius: 20 }}
        />
      </div>
    )
  }

  const data = typeof quickViewData === 'object' && quickViewData !== null ? quickViewData : null
  const isLoading = quickViewData === 'loading'
  const isError = quickViewData === 'error'

  return (
    <div style={{ position: 'relative' }} ref={popRef}>
      <button
        onClick={onOpen}
        title={`${college.college_name} — click for details`}
        style={{
          background: isActive ? 'var(--color-primary)' : 'var(--color-column)',
          color: isActive ? '#fff' : 'var(--color-text)',
          fontWeight: 600, fontSize: 11,
          padding: '5px 12px', borderRadius: 20,
          border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
          maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chipName(college.college_name)}</span>
      </button>

      {/* Quick-view popover */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="card-elevated"
            style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              marginTop: 8, zIndex: 60, width: 260, padding: '14px 16px',
            }}
          >
            {/* School name */}
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', marginBottom: 10, lineHeight: 1.3 }}>
              {college.college_name}
            </div>

            {isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '80%' }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '60%' }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '70%' }} />
              </div>
            )}

            {isError && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Could not load details.
              </div>
            )}

            {data && (
              <>
                {/* Tier badge + chance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
                    background: tierLabel(data.chance).bg, color: tierLabel(data.chance).color,
                  }}>
                    {tierLabel(data.chance).label}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>
                    ~{data.chance}%
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>your chance</span>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 12 }}>
                  <QuickStat label="Admit Rate" value={data.admissionRate != null ? `${data.admissionRate}%` : '--'} />
                  <QuickStat label="SAT Range" value={data.sat25 && data.sat75 ? `${data.sat25}-${data.sat75}` : data.avgSAT ? `Avg ${data.avgSAT}` : '--'} />
                  {data.actMidpoint != null && (
                    <QuickStat label="ACT Midpoint" value={`${data.actMidpoint}`} />
                  )}
                  <QuickStat
                    label={homeState && data.schoolState && homeState.toLowerCase() === data.schoolState.toLowerCase() ? 'Tuition (In-State)' : 'Tuition (Out-of-State)'}
                    value={fmt$(homeState && data.schoolState && homeState.toLowerCase() === data.schoolState.toLowerCase() ? data.tuitionInState : data.tuitionOutOfState)}
                  />
                  <QuickStat label="Avg Net Price" value={fmt$(data.avgNetPrice)} />
                </div>
              </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
              <button
                onClick={e => { e.stopPropagation(); setEditing(true); onClose() }}
                style={{
                  flex: 1, fontSize: 11, fontWeight: 600, padding: '5px 0',
                  background: 'var(--color-column)', border: '1px solid var(--color-border)',
                  borderRadius: 6, cursor: 'pointer', color: 'var(--color-text)',
                }}
              >
                Edit
              </button>
              <button
                onClick={e => { e.stopPropagation(); onRemove() }}
                style={{
                  flex: 1, fontSize: 11, fontWeight: 600, padding: '5px 0',
                  background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)',
                  borderRadius: 6, cursor: 'pointer', color: '#FB7185',
                }}
              >
                Remove
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const QUICK_STAT_TIPS: Record<string, string> = {
  'Admit Rate': 'Overall acceptance rate for all applicants at this school.',
  'SAT Range': 'Middle 50% SAT score range (25th to 75th percentile) of admitted students.',
  'ACT Midpoint': 'Midpoint ACT score of admitted students.',
  'Avg Net Price': 'Average cost after financial aid. Source: U.S. Dept. of Education.',
}

function QuickStat({ label, value }: { label: string; value: string }) {
  const tip = QUICK_STAT_TIPS[label] || Object.entries(QUICK_STAT_TIPS).find(([k]) => label.startsWith(k.split(' ')[0]))?.[1]
  const inner = (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
        {value}
      </div>
    </div>
  )
  if (tip) return <Tooltip text={tip} position="top">{inner}</Tooltip>
  return inner
}
