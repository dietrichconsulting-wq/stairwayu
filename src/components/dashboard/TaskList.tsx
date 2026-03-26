'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateTaskStatus, useUpdateTask, useCreateTask } from '@/hooks/useTasks'
import type { Task, TaskStatus, TaskCategory } from '@/lib/types/database'
import confetti from 'canvas-confetti'

const CATEGORIES: TaskCategory[] = [
  'Testing', 'Applications', 'Essays', 'Financial Aid',
  'Recommendations', 'Visits', 'Scholarships', 'Research', 'Other',
]

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

const CATEGORY_COLORS_LIGHT: Record<TaskCategory, string> = {
  Testing: '#d97706',
  Applications: '#0891b2',
  Essays: '#059669',
  'Financial Aid': '#d97706',
  Recommendations: '#dc2626',
  Visits: '#0891b2',
  Scholarships: '#d97706',
  Research: '#64748b',
  Other: '#94a3b8',
}
const CATEGORY_COLORS_DARK: Record<TaskCategory, string> = {
  Testing: '#FDE68A',
  Applications: '#7DD3FC',
  Essays: '#86EFAC',
  'Financial Aid': '#FDE68A',
  Recommendations: '#FCA5A5',
  Visits: '#67E8F9',
  Scholarships: '#FCD34D',
  Research: '#A8A29E',
  Other: '#D6D3D1',
}
const getCategoryColor = (cat: TaskCategory) => isDark() ? CATEGORY_COLORS_DARK[cat] : CATEGORY_COLORS_LIGHT[cat]

interface TaskListProps {
  tasks: Task[]
  loading: boolean
  userId: string
}

export function TaskList({ tasks, loading, userId }: TaskListProps) {
  const [filter, setFilter] = useState<TaskCategory | 'All'>('All')
  const updateStatus = useUpdateTaskStatus(userId)
  const updateTask = useUpdateTask(userId)
  const createTask = useCreateTask(userId)
  const [newTitle, setNewTitle] = useState('')
  const [editingDateId, setEditingDateId] = useState<string | null>(null)

  const activeTasks = tasks.filter(t => t.status !== 'Done')
  const filtered = tasks.filter(t => filter === 'All' || t.category === filter)

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / 86400000
    if (diff < 0) return { label: 'Overdue', color: isDark() ? '#FCA5A5' : '#EF4444' }
    if (diff <= 7) return { label: `${Math.ceil(diff)}d`, color: isDark() ? '#FDE68A' : '#F59E0B' }
    return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'var(--color-text-muted)' }
  }

  async function toggleDone(task: Task) {
    if (task.status === 'Done') {
      await updateStatus.mutateAsync({ taskId: task.id, status: 'To Do' })
    } else {
      await updateStatus.mutateAsync({ taskId: task.id, status: 'Done' })
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ['#5EEAD4', '#FCD34D', '#86EFAC'] })
    }
  }

  async function addTask() {
    if (!newTitle.trim()) return
    await createTask.mutateAsync({
      title: newTitle.trim(),
      description: null,
      status: 'To Do',
      category: 'Other',
      due_date: null,
      calendar_event_id: null,
      sort_order: tasks.length,
      completed_at: null,
    })
    setNewTitle('')
  }

  if (loading) {
    return (
      <div className="card-elevated" style={{ padding: '24px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10, borderRadius: 10 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="card-elevated" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          Tasks
          <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            {activeTasks.length} active
          </span>
        </h2>
        {/* Category filter */}
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as TaskCategory | 'All')}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', outline: 'none' }}
        >
          <option value="All">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Add task */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task…"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', fontSize: 13, outline: 'none' }}
        />
        <button
          onClick={addTask}
          style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          Add
        </button>
      </div>

      {/* Active tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {filtered.map(task => {
            const isDone = task.status === 'Done'
            const dateInfo = formatDate(task.due_date)
            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--color-column)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => toggleDone(task)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: isDone ? '2px solid var(--color-success)' : '2px solid var(--color-border)',
                    background: isDone ? 'var(--color-success)' : 'var(--color-card)',
                    cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', fontWeight: 700,
                  }}
                  title={isDone ? 'Mark active' : 'Mark done'}
                >
                  {isDone ? '✓' : ''}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    textDecoration: isDone ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </div>
                  {!isDone && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: getCategoryColor(task.category), background: `${getCategoryColor(task.category)}18`, padding: '1px 6px', borderRadius: 10 }}>
                        {task.category}
                      </span>
                      {task.description && !dateInfo && (
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                          {task.description}
                        </span>
                      )}
                      {dateInfo && (
                        <span style={{ fontSize: 11, color: dateInfo.color, fontWeight: 600 }}>
                          {dateInfo.label}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {!isDone && (
                  <>
                    {/* Date picker */}
                    {editingDateId === task.id ? (
                      <input
                        type="date"
                        defaultValue={task.due_date?.split('T')[0] ?? ''}
                        autoFocus
                        onChange={e => {
                          updateTask.mutate({ taskId: task.id, updates: { due_date: e.target.value || null } })
                          setEditingDateId(null)
                        }}
                        onBlur={() => setEditingDateId(null)}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', outline: 'none' }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingDateId(task.id)}
                        title={task.due_date ? 'Change date' : 'Set a due date'}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                          fontSize: 11, color: 'var(--color-text-muted)', padding: '2px 6px',
                        }}
                      >
                        {task.due_date ? '📅' : '+ date'}
                      </button>
                    )}
                    {task.status === 'In Progress' && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', padding: '2px 8px', borderRadius: 10 }}>
                        In Progress
                      </span>
                    )}
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14, padding: '32px 0' }}>
            {filter === 'All' ? '🎉 All tasks done!' : `No ${filter} tasks`}
          </div>
        )}
      </div>

    </div>
  )
}
