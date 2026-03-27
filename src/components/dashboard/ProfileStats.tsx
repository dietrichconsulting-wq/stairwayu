'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import type { Profile, Task, UserCollege } from '@/lib/types/database'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useUserColleges, useAddCollege, useRemoveCollege, useUpdateCollege } from '@/hooks/useUserColleges'
import { MajorSelect } from '@/components/MajorSelect'
import { CollegeSelect } from '@/components/CollegeSelect'
import { useReadinessScore } from '@/hooks/useReadinessScore'
import type { ReadinessScore } from '@/hooks/useReadinessScore'

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-elevated"
      style={{ padding: '20px 24px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {/* GPA */}
        <EditableStatPill
          label="GPA" color={isDark() ? 'var(--color-stat-gpa, #5EEAD4)' : 'var(--color-primary)'}
          value={loading ? null : profile?.gpa ?? null}
          display={loading ? '—' : profile?.gpa?.toString() ?? '—'}
          type="gpa"
          onSave={v => updateProfile.mutate({ gpa: v ? parseFloat(v) : null })}
        />
        {/* SAT */}
        <EditableStatPill
          label="SAT" color={isDark() ? 'var(--color-stat-sat, #FCD34D)' : '#d97706'}
          value={loading ? null : profile?.sat ?? null}
          display={loading ? '—' : profile?.sat?.toString() ?? '—'}
          type="sat"
          onSave={v => updateProfile.mutate({ sat: v ? parseInt(v) : null })}
        />
        {/* ACT */}
        <EditableStatPill
          label="ACT" color={isDark() ? 'var(--color-stat-act, #7DD3FC)' : '#0891b2'}
          value={loading ? null : profile?.act_score ?? null}
          display={loading ? '—' : profile?.act_score?.toString() ?? '—'}
          type="act"
          onSave={v => updateProfile.mutate({ act_score: v ? parseInt(v) : null })}
        />
        {/* Major */}
        <EditableMajorPill
          label="Major"
          display={loading ? '—' : profile?.proposed_major ?? 'Not set'}
          onSave={v => updateProfile.mutate({ proposed_major: v || null })}
        />

        {/* Readiness ring */}
        <button
          onClick={() => setShowDetail(true)}
          title="View application readiness breakdown"
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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

        {/* School chips */}
        {!loading && (
          <SchoolChipsRow
            colleges={colleges}
            onAdd={name => addCollege.mutate({ name })}
            onUpdate={(id, name) => updateCollegeMut.mutate({ id, name })}
            onRemove={id => removeCollege.mutate(id)}
          />
        )}
      </div>

      <AnimatePresence>
        {showDetail && (
          <ReadinessDetailPanel score={readiness} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EditableStatPill({ label, color, display, onSave, type }: {
  label: string; color: string; value: number | null
  display: string; type: 'gpa' | 'sat' | 'act'
  onSave: (v: string) => void
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
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          type="number"
          step={type === 'gpa' ? '0.01' : type === 'act' ? '1' : '10'}
          min={type === 'gpa' ? '0' : type === 'act' ? '1' : '400'}
          max={type === 'gpa' ? '5.0' : type === 'act' ? '36' : '1600'}
          style={{
            fontSize: 20, fontWeight: 800, color, lineHeight: 1,
            width: type === 'gpa' ? 56 : type === 'act' ? 48 : 72, border: 'none', borderBottom: `2px solid ${color}`,
            background: 'transparent', outline: 'none', padding: '0 0 2px',
          }}
        />
      ) : (
        <button
          onClick={startEdit}
          title={`Click to edit ${label}`}
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

function EditableMajorPill({ label, display, onSave }: {
  label: string; display: string; onSave: (v: string) => void
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
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </span>
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

function SchoolChipsRow({ colleges, onAdd, onUpdate, onRemove }: {
  colleges: UserCollege[]
  onAdd: (name: string) => void
  onUpdate: (id: string, name: string) => void
  onRemove: (id: string) => void
}) {
  const [showMore, setShowMore] = useState(false)
  const [addingSchool, setAddingSchool] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const visibleSchools = colleges
  const overflowSchools: UserCollege[] = []

  // Close popover on click-outside or Escape
  useEffect(() => {
    if (!showMore) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowMore(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showMore])

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 'auto', alignItems: 'center', position: 'relative' }}>
      {/* First 3 colleges as inline editable chips */}
      {visibleSchools.map(c => (
        <EditableSchoolChip
          key={c.id}
          name={c.college_name}
          onSave={v => onUpdate(c.id, v)}
        />
      ))}

      {/* "+N more" chip with popover */}
      {overflowSchools.length > 0 && (
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button
            onClick={() => setShowMore(v => !v)}
            style={{
              background: 'var(--color-column)', color: 'var(--color-text-muted)',
              fontWeight: 600, fontSize: 11, padding: '5px 12px', borderRadius: 20,
              border: '1px solid var(--color-border)', cursor: 'pointer',
            }}
          >
            +{overflowSchools.length} more
          </button>

          {/* Popover */}
          {showMore && (
            <div
              className="card-elevated"
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                zIndex: 50, minWidth: 240, padding: '12px 14px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              {overflowSchools.map(c => (
                <OverflowSchoolRow
                  key={c.id}
                  name={c.college_name}
                  onEdit={v => onUpdate(c.id, v)}
                  onRemove={() => onRemove(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* "+ Add" chip */}
      {addingSchool ? (
        <div style={{ width: 220 }}>
          <CollegeSelect
            value=""
            onChange={v => {
              if (v) onAdd(v)
              setAddingSchool(false)
            }}
            placeholder="Search for a college…"
            inputStyle={{ padding: '5px 10px', fontSize: 12, borderRadius: 20 }}
          />
        </div>
      ) : (
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

function EditableSchoolChip({ name, onSave }: { name: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div style={{ width: 220 }}>
        <CollegeSelect
          value={name}
          onChange={v => { onSave(v); setEditing(false) }}
          placeholder="Search for a college…"
          inputStyle={{ padding: '5px 10px', fontSize: 12, borderRadius: 20 }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title={`${name} — click to change`}
      style={{
        background: 'var(--color-column)', color: 'var(--color-text)', fontWeight: 600, fontSize: 11,
        padding: '5px 12px', borderRadius: 20, border: '1.5px solid var(--color-border)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{chipName(name)}</span>
      <span style={{ fontSize: 9, opacity: 0.6, flexShrink: 0 }}>✎</span>
    </button>
  )
}
