'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCreateScholarship, useUpdateScholarship, useDeleteScholarship } from '@/hooks/useScholarships'
import type { Scholarship, ScholarshipStage } from '@/lib/types/database'

const STAGES: ScholarshipStage[] = ['Researching', 'Applying', 'Submitted', 'Won']
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const getStageColors = (): Record<ScholarshipStage, { bg: string; color: string }> => isDark() ? {
  Researching: { bg: 'rgba(168,162,158,0.10)', color: '#A8A29E' },
  Applying:    { bg: 'rgba(125,211,252,0.10)', color: '#7DD3FC' },
  Submitted:   { bg: 'rgba(253,230,138,0.10)', color: '#FDE68A' },
  Won:         { bg: 'rgba(134,239,172,0.10)', color: '#86EFAC' },
} : {
  Researching: { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
  Applying:    { bg: 'rgba(37,99,235,0.1)',   color: '#2563EB' },
  Submitted:   { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
  Won:         { bg: 'rgba(34,197,94,0.1)',   color: '#16a34a' },
}

interface ScholarshipPipelineProps {
  scholarships: Scholarship[]
  loading: boolean
  userId: string
}

export function ScholarshipPipeline({ scholarships, loading, userId }: ScholarshipPipelineProps) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', deadline: '', stage: 'Researching' as ScholarshipStage })
  const createScholarship = useCreateScholarship(userId)
  const updateScholarship = useUpdateScholarship(userId)
  const deleteScholarship = useDeleteScholarship(userId)

  const totalWon = scholarships.filter(s => s.stage === 'Won').reduce((sum, s) => sum + (s.amount ?? 0), 0)

  async function handleAdd() {
    if (!form.name.trim()) return
    await createScholarship.mutateAsync({
      name: form.name.trim(),
      amount: form.amount ? parseInt(form.amount) : null,
      deadline: form.deadline || null,
      stage: form.stage,
      essay_required: false,
      difficulty: 'Medium',
      url: null,
      notes: null,
    })
    setForm({ name: '', amount: '', deadline: '', stage: 'Researching' })
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="card-elevated" style={{ padding: '20px 24px' }}>
        <div className="skeleton" style={{ height: 20, width: 160, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-elevated" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          🏆 Scholarships
        </h3>
        {totalWon > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
            ${totalWon.toLocaleString()} won
          </span>
        )}
        <button
          onClick={() => setAdding(!adding)}
          style={{ background: adding ? 'var(--color-border)' : 'var(--color-primary)', color: adding ? 'var(--color-text)' : '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          {adding ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'var(--color-column)', borderRadius: 10 }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Scholarship name" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" style={inputStyle} />
                <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" style={inputStyle} />
              </div>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as ScholarshipStage }))} style={inputStyle}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleAdd} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Add Scholarship
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {STAGES.map(stage => {
          const items = scholarships.filter(s => s.stage === stage)
          const c = getStageColors()[stage]
          return (
            <div key={stage} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 10, padding: '10px 12px', minHeight: 60 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stage} ({items.length})
              </div>
              {items.slice(0, 3).map(s => (
                <div key={s.id} style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.name}</span>
                  {s.amount && <span style={{ fontSize: 10, fontWeight: 700, color: c.color, flexShrink: 0 }}>${(s.amount / 1000).toFixed(0)}k</span>}
                </div>
              ))}
              {items.length > 3 && <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>+{items.length - 3} more</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-card)',
  color: 'var(--color-text)',
  fontSize: 12,
  outline: 'none',
  width: '100%',
}
