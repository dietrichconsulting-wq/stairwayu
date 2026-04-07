'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpdateTaskStatus, useUpdateTask, useCreateTask } from '@/hooks/useTasks'
import type { Task, TaskStatus, TaskCategory } from '@/lib/types/database'
import { Tooltip } from '@/components/ui/Tooltip'
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
  collapsedMax?: number
}

export function TaskList({ tasks, loading, userId, collapsedMax }: TaskListProps) {
  const [filter, setFilter] = useState<TaskCategory | 'All'>('All')
  const [expanded, setExpanded] = useState(false)
  const updateStatus = useUpdateTaskStatus(userId)
  const updateTask = useUpdateTask(userId)
  const createTask = useCreateTask(userId)
  const [newTitle, setNewTitle] = useState('')
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const activeTasks = tasks.filter(t => t.status !== 'Done')
  const allFiltered = tasks.filter(t => filter === 'All' || t.category === filter)
  const isCollapsible = collapsedMax != null && !expanded && allFiltered.length > collapsedMax
  const filtered = isCollapsible ? allFiltered.slice(0, collapsedMax) : allFiltered

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

  function startEditing(task: Task) {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  async function saveEdit(taskId: string) {
    const trimmed = editingTitle.trim()
    if (trimmed) {
      await updateTask.mutateAsync({ taskId, updates: { title: trimmed } })
    }
    setEditingTaskId(null)
  }

  function snoozeTask(task: Task) {
    const current = task.due_date ? new Date(task.due_date) : new Date()
    const snoozed = new Date(current)
    snoozed.setDate(snoozed.getDate() + 1)
    updateTask.mutate({ taskId: task.id, updates: { due_date: snoozed.toISOString().split('T')[0] } })
  }

  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTaskId])

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
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          Tasks
          <span style={{ marginLeft: 2, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            {activeTasks.length} active
          </span>
          <Tooltip text="Tasks are listed in the recommended order. Due dates are never auto-generated — you set your own dates to avoid errors from AI hallucinations." position="bottom" maxWidth={260}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', cursor: 'help', lineHeight: 1 }} aria-label="Info about task dates">
              &#9432;
            </span>
          </Tooltip>
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
                className="task-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--color-column)',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => toggleDone(task)}
                  aria-label={isDone ? `Mark "${task.title}" as active` : `Mark "${task.title}" as done`}
                  aria-pressed={isDone}
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
                  {editingTaskId === task.id ? (
                    <input
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(task.id)
                        if (e.key === 'Escape') setEditingTaskId(null)
                      }}
                      onBlur={() => saveEdit(task.id)}
                      style={{
                        fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                        width: '100%', padding: '2px 6px', borderRadius: 6,
                        border: '1.5px solid var(--color-primary)', background: 'var(--color-card)',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
                {!isDone && editingTaskId !== task.id && (
                  <>
                    {/* Date picker */}
                    {editingDateId === task.id ? (
                      <input
                        type="date"
                        defaultValue={task.due_date?.split('T')[0] ?? ''}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            (e.target as HTMLInputElement).blur()
                          } else if (e.key === 'Escape') {
                            setEditingDateId(null)
                          }
                        }}
                        onBlur={e => {
                          const v = e.target.value
                          const orig = task.due_date?.split('T')[0] ?? ''
                          // Only commit fully-valid dates (4-digit year >= 1900) to avoid
                          // partial-typing onChange firing mid-edit and closing the picker.
                          if (v !== orig && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number(v.slice(0, 4)) >= 1900) {
                            updateTask.mutate({ taskId: task.id, updates: { due_date: v } })
                          } else if (!v && orig) {
                            updateTask.mutate({ taskId: task.id, updates: { due_date: null } })
                          }
                          setEditingDateId(null)
                        }}
                        style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', outline: 'none' }}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingDateId(task.id)}
                        title={task.due_date ? 'Change date — only you set due dates, never AI' : 'Set your own due date — we never auto-generate dates'}
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
                    {/* Action buttons: Edit, Snooze, Complete */}
                    <div className="task-row__actions" style={{
                      display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0,
                    }}>
                      <button
                        onClick={() => startEditing(task)}
                        title="Edit task"
                        className="task-action-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => snoozeTask(task)}
                        title="Snooze (+1 day)"
                        className="task-action-btn"
                      >
                        Snooze
                      </button>
                      <button
                        onClick={() => toggleDone(task)}
                        title="Mark complete"
                        className="task-action-btn task-action-btn--complete"
                      >
                        Done
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            {filter === 'All' ? (
              <>
                <svg width="80" height="70" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 12px' }}>
                  {/* Checklist */}
                  <rect x="18" y="10" width="44" height="50" rx="5" fill="var(--color-column)" stroke="var(--color-border)" strokeWidth="1.5" />
                  {/* Check lines */}
                  <circle cx="28" cy="24" r="4" fill="#22C55E" opacity="0.6" />
                  <path d="M26 24 L27.5 25.5 L30 22.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="36" y1="24" x2="54" y2="24" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
                  <circle cx="28" cy="36" r="4" fill="#22C55E" opacity="0.6" />
                  <path d="M26 36 L27.5 37.5 L30 34.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="36" y1="36" x2="50" y2="36" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
                  <circle cx="28" cy="48" r="4" fill="#22C55E" opacity="0.6" />
                  <path d="M26 48 L27.5 49.5 L30 46.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="36" y1="48" x2="52" y2="48" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
                  {/* Star burst */}
                  <circle cx="58" cy="14" r="8" fill="#FBBF24" opacity="0.15" />
                  <text x="54.5" y="18" fontSize="12" fill="#FBBF24" opacity="0.8">⭐</text>
                </svg>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>All tasks done!</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>You&apos;re on top of everything. Add a new task or take a well-earned break.</div>
              </>
            ) : (
              <>
                <svg width="60" height="50" viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 10px' }}>
                  <rect x="10" y="5" width="40" height="40" rx="5" fill="var(--color-column)" stroke="var(--color-border)" strokeWidth="1.5" />
                  <line x1="20" y1="18" x2="40" y2="18" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
                  <line x1="20" y1="25" x2="36" y2="25" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
                  <line x1="20" y1="32" x2="38" y2="32" stroke="var(--color-text-muted)" strokeWidth="1.5" opacity="0.2" strokeLinecap="round" />
                </svg>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No {filter} tasks</div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Show all / Show less toggle */}
      {collapsedMax != null && allFiltered.length > collapsedMax && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 12,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-primary)',
            textAlign: 'center',
          }}
        >
          {expanded ? 'Show less' : `Show all ${allFiltered.length} tasks`}
        </button>
      )}

    </div>
  )
}
