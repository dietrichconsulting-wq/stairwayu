'use client'

import { useDailyChallenges } from '@/hooks/useDailyChallenges'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { useRef } from 'react'
import { Tooltip } from '@/components/ui/Tooltip'

interface DailyChallengesProps {
  userId: string
}

export function DailyChallenges({ userId }: DailyChallengesProps) {
  const { challenges, completedKeys, isLoading } = useDailyChallenges(userId)
  const celebratedRef = useRef(false)

  const completedCount = challenges.filter(c => completedKeys.has(c.key)).length
  const allDone = completedCount === challenges.length && challenges.length > 0

  // Celebrate when all 3 are done
  if (allDone && !celebratedRef.current) {
    celebratedRef.current = true
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, colors: ['#5EEAD4', '#FCD34D', '#86EFAC'] })
    }, 300)
  }

  if (isLoading) {
    return (
      <div className="card-elevated" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div className="skeleton" style={{ height: 20, width: 160, borderRadius: 6, marginBottom: 14 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card-elevated" data-tour="daily-challenges" style={{ padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Tooltip text="Complete daily challenges to earn XP and discover new schools. Challenges refresh every day." position="right" maxWidth={240}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
            Daily Challenges
          </h2>
        </Tooltip>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: allDone ? '#22C55E' : 'var(--color-text-muted)' }}>
            {completedCount}/{challenges.length}
          </span>
          {/* Mini progress dots */}
          <div style={{ display: 'flex', gap: 3 }}>
            {challenges.map((c, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: completedKeys.has(c.key) ? '#22C55E' : 'var(--color-border)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {challenges.map((challenge, i) => {
            const done = completedKeys.has(challenge.key)
            return (
              <motion.div
                key={challenge.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${done ? 'rgba(34,197,94,0.25)' : 'var(--color-border)'}`,
                  background: done ? 'rgba(34,197,94,0.06)' : 'var(--color-column)',
                  transition: 'border-color 0.3s, background 0.3s',
                }}
              >
                {/* Check circle */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  background: done ? '#22C55E' : 'var(--color-border)',
                  color: done ? '#fff' : 'var(--color-text-muted)',
                  transition: 'background 0.3s, color 0.3s',
                }}>
                  {done ? '\u2713' : i + 1}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: done ? 'var(--color-text-muted)' : 'var(--color-text)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {challenge.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1, lineHeight: 1.3 }}>
                    {challenge.description}
                  </div>
                </div>

                {/* XP badge + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 7px',
                    borderRadius: 6,
                    background: done ? 'rgba(34,197,94,0.15)' : 'rgba(37,99,235,0.1)',
                    color: done ? '#22C55E' : 'var(--color-primary)',
                  }}>
                    +{challenge.xpReward} XP
                  </span>
                  {!done && (
                    <Link
                      href={challenge.cta.href}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: 7,
                        border: '1.5px solid var(--color-border)',
                        background: 'var(--color-card)',
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {challenge.cta.label} →
                    </Link>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {allDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#22C55E',
          }}
        >
          All challenges complete! Come back tomorrow for more.
        </motion.div>
      )}
    </div>
  )
}
