'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface PhaseUnlockOverlayProps {
  phase: string | null
  onDismiss: () => void
}

const PHASE_CONFIG: Record<string, { emoji: string; color: string; next: string | null }> = {
  Prep:     { emoji: '📝', color: '#F59E0B', next: 'Research' },
  Research: { emoji: '🔭', color: '#0EA5E9', next: 'Apply' },
  Apply:    { emoji: '🚀', color: '#F59E0B', next: 'Final' },
  Final:    { emoji: '🎓', color: '#22C55E', next: null },
}

export function PhaseUnlockOverlay({ phase, onDismiss }: PhaseUnlockOverlayProps) {
  useEffect(() => {
    if (!phase) return
    // Big confetti burst
    const duration = 2000
    const end = Date.now() + duration
    const colors = ['#5EEAD4', '#FCD34D', '#86EFAC', '#FCA5A5', '#7DD3FC']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()

    // Auto-dismiss after 4 seconds
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [phase, onDismiss])

  const cfg = phase ? PHASE_CONFIG[phase] : null

  return (
    <AnimatePresence>
      {phase && cfg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={`${phase} Phase Unlocked`}
          onClick={onDismiss}
          onKeyDown={e => { if (e.key === 'Escape') onDismiss() }}
          tabIndex={-1}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--color-card)',
              borderRadius: 24,
              padding: '48px 56px',
              textAlign: 'center',
              maxWidth: 420,
              boxShadow: `0 0 80px ${cfg.color}33, 0 20px 60px rgba(0,0,0,0.3)`,
              border: `2px solid ${cfg.color}44`,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.2 }}
              style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}
            >
              {cfg.emoji}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.1em', color: cfg.color, marginBottom: 8,
              }}
            >
              Phase Complete
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                fontSize: 28, fontWeight: 900, color: 'var(--color-text)',
                marginBottom: 12,
              }}
            >
              {phase} Phase Unlocked!
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {cfg.next
                ? `Amazing progress! You're moving into the ${cfg.next} phase.`
                : 'You did it! Every milestone is complete. Congratulations!'}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={onDismiss}
              style={{
                background: cfg.color, color: '#fff', border: 'none',
                borderRadius: 12, padding: '12px 32px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              {cfg.next ? `Let's go!` : 'Celebrate!'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
