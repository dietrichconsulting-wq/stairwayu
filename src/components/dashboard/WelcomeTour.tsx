'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TOUR_STEPS } from './welcomeTourSteps'
import type { TourStep } from './welcomeTourSteps'

interface WelcomeTourProps {
  onComplete: () => void
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const PAD = 8 // spotlight padding around target element
const TOOLTIP_GAP = 12
const TOOLTIP_W = 340
const MOBILE_BP = 768

export function WelcomeTour({ onComplete }: WelcomeTourProps) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect | null>(null)
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 })
  const [isMobile, setIsMobile] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipHeight, setTooltipHeight] = useState(180)

  const current: TourStep = TOUR_STEPS[step]

  // ── Measure viewport ──
  useEffect(() => {
    function measure() {
      setViewportSize({ w: window.innerWidth, h: window.innerHeight })
      setIsMobile(window.innerWidth < MOBILE_BP)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // ── Locate target element and scroll into view ──
  const locateTarget = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`)
    if (!el) {
      setTargetRect(null)
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // Wait for scroll to settle before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        setTargetRect({ x: r.x, y: r.y, width: r.width, height: r.height })
      })
    })
  }, [current.target])

  useLayoutEffect(() => {
    locateTarget()
  }, [locateTarget, step])

  // Re-measure on resize
  useEffect(() => {
    locateTarget()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewportSize])

  // Measure tooltip height for positioning
  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipHeight(tooltipRef.current.offsetHeight)
    }
  }, [step])

  // ── Lock body scroll ──
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // ── Keyboard nav ──
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onComplete()
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      if (e.key === 'ArrowLeft') handleBack()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1)
    else onComplete()
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  // ── SVG spotlight path (full screen with rectangular cutout) ──
  function buildMaskPath(): string {
    const { w, h } = viewportSize
    // Outer rect (covers entire screen)
    const outer = `M 0 0 H ${w} V ${h} H 0 Z`
    if (!targetRect) return outer

    const r = 12 // border-radius for cutout
    const x = targetRect.x - PAD
    const y = targetRect.y - PAD
    const tw = targetRect.width + PAD * 2
    const th = targetRect.height + PAD * 2

    // Inner rect cutout (counter-clockwise for evenodd fill)
    const cutout = `M ${x + r} ${y}
      H ${x + tw - r} Q ${x + tw} ${y} ${x + tw} ${y + r}
      V ${y + th - r} Q ${x + tw} ${y + th} ${x + tw - r} ${y + th}
      H ${x + r} Q ${x} ${y + th} ${x} ${y + th - r}
      V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`

    return `${outer} ${cutout}`
  }

  // ── Tooltip position ──
  function getTooltipStyle(): React.CSSProperties {
    if (isMobile) {
      // Bottom sheet on mobile
      return {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '20px 20px 0 0',
        width: 'auto',
        maxWidth: 'none',
      }
    }

    if (!targetRect) {
      // Center fallback
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: TOOLTIP_W,
      }
    }

    const { placement } = current
    let top = 0
    let left = 0

    switch (placement) {
      case 'bottom':
        top = targetRect.y + targetRect.height + PAD + TOOLTIP_GAP
        left = targetRect.x + targetRect.width / 2 - TOOLTIP_W / 2
        break
      case 'top':
        top = targetRect.y - PAD - TOOLTIP_GAP - tooltipHeight
        left = targetRect.x + targetRect.width / 2 - TOOLTIP_W / 2
        break
      case 'right':
        top = targetRect.y + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.x + targetRect.width + PAD + TOOLTIP_GAP
        break
      case 'left':
        top = targetRect.y + targetRect.height / 2 - tooltipHeight / 2
        left = targetRect.x - PAD - TOOLTIP_GAP - TOOLTIP_W
        break
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, viewportSize.w - TOOLTIP_W - 12))
    top = Math.max(12, Math.min(top, viewportSize.h - tooltipHeight - 12))

    return { position: 'fixed', top, left, width: TOOLTIP_W }
  }

  const isLast = step === TOUR_STEPS.length - 1

  const content = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
      {/* Overlay with spotlight cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox={`0 0 ${viewportSize.w} ${viewportSize.h}`}
      >
        <motion.path
          d={buildMaskPath()}
          fillRule="evenodd"
          fill="rgba(0,0,0,0.6)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </svg>

      {/* Click shield (blocks interaction behind tooltip) */}
      <div
        style={{ position: 'fixed', inset: 0, cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      />

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          ref={tooltipRef}
          initial={isMobile ? { y: 60, opacity: 0 } : { y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: isMobile ? 60 : -12, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{
            ...getTooltipStyle(),
            background: 'var(--color-card)',
            border: '1.5px solid var(--color-border)',
            borderRadius: isMobile ? '20px 20px 0 0' : 16,
            padding: isMobile ? '28px 24px 32px' : '24px 24px 20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            zIndex: 10001,
          }}
        >
          {/* Step indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={onComplete}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                padding: '2px 4px',
              }}
            >
              Skip tour
            </button>
          </div>

          {/* Content */}
          <h3 style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--color-text)',
            margin: '0 0 8px',
          }}>
            {current.title}
          </h3>
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            margin: '0 0 20px',
          }}>
            {current.description}
          </p>

          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === step
                    ? 'var(--color-primary)'
                    : i < step
                      ? 'color-mix(in srgb, var(--color-primary) 40%, var(--color-border))'
                      : 'var(--color-border)',
                  transition: 'width 0.2s, background 0.2s',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {step > 0 && (
              <button
                onClick={handleBack}
                style={{
                  background: 'var(--color-column)',
                  color: 'var(--color-text)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {isLast ? "Got it — let's go!" : 'Next'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )

  return createPortal(content, document.body)
}
