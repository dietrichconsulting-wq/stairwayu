'use client'

import { motion } from 'framer-motion'
import type { Task } from '@/lib/types/database'

interface DeadlineRadarProps {
  tasks: Task[]
  loading: boolean
}

export function DeadlineRadar({ tasks, loading }: DeadlineRadarProps) {
  const now = Date.now()

  const upcoming = tasks
    .filter(t => t.status !== 'Done' && t.due_date)
    .map(t => ({
      ...t,
      daysUntil: Math.ceil((new Date(t.due_date!).getTime() - now) / 86400000),
    }))
    .filter(t => t.daysUntil >= -3)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 8)

  function urgencyColor(days: number) {
    if (days < 0) return '#EF4444'
    if (days <= 7) return '#F59E0B'
    if (days <= 14) return '#5EEAD4'
    return '#22C55E'
  }

  if (loading) {
    return (
      <div className="card-elevated" style={{ padding: '20px 24px' }}>
        <div className="skeleton" style={{ height: 20, width: 140, marginBottom: 16 }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 36, marginBottom: 8, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="card-elevated" style={{ padding: '20px 24px' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 14, margin: '0 0 14px' }}>
        📡 Deadline Radar
      </h3>
      {upcoming.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
          No upcoming deadlines
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.map((task, i) => {
            const color = urgencyColor(task.daysUntil)
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  background: `${color}10`,
                  border: `1px solid ${color}30`,
                  borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color, minWidth: 52, textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {task.daysUntil < 0 ? 'LATE' : task.daysUntil === 0 ? 'TODAY' : new Date(task.due_date! + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
