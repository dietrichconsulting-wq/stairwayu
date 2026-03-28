'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface Toast {
  id: string
  message: string
  emoji?: string
  /** auto-dismiss in ms, default 4000 */
  duration?: number
}

let _pushToast: ((t: Toast) => void) | null = null

/** Fire a toast from anywhere (must be after CelebrationToastContainer mounts) */
export function showToast(t: Omit<Toast, 'id'>) {
  _pushToast?.({ ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })
}

export function CelebrationToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((t: Toast) => {
    setToasts(prev => [...prev, t])
  }, [])

  useEffect(() => {
    _pushToast = push
    return () => { _pushToast = null }
  }, [push])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none', maxWidth: 360,
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      role="alert"
      tabIndex={0}
      aria-label={`${toast.message}. Press Enter to dismiss.`}
      style={{
        pointerEvents: 'auto',
        background: 'var(--color-card)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 14,
        padding: '14px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onDismiss(toast.id) }}
    >
      {toast.emoji && <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{toast.emoji}</span>}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
        {toast.message}
      </span>
    </motion.div>
  )
}
