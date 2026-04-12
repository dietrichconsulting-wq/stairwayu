'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  text: string
  children: React.ReactNode
  /** Where to show the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Max width in px */
  maxWidth?: number
  /** Delay before showing (ms) */
  delay?: number
}

export function Tooltip({ text, children, position = 'top', maxWidth = 220, delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return
      const rect = triggerRef.current.getBoundingClientRect()
      const gap = 8

      let top = 0
      let left = 0

      if (position === 'top') {
        top = rect.top - gap
        left = rect.left + rect.width / 2
      } else if (position === 'bottom') {
        top = rect.bottom + gap
        left = rect.left + rect.width / 2
      } else if (position === 'left') {
        top = rect.top + rect.height / 2
        left = rect.left - gap
      } else {
        top = rect.top + rect.height / 2
        left = rect.right + gap
      }

      setCoords({ top, left })
      setVisible(true)
    }, delay)
  }, [position, delay])

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
    setCoords(null)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Clamp tooltip to viewport after render
  useEffect(() => {
    if (!visible || !tooltipRef.current || !coords) return
    const el = tooltipRef.current
    const rect = el.getBoundingClientRect()
    const pad = 8

    let adjustLeft = 0
    let adjustTop = 0

    if (rect.right > window.innerWidth - pad) {
      adjustLeft = window.innerWidth - pad - rect.right
    }
    if (rect.left < pad) {
      adjustLeft = pad - rect.left
    }
    if (rect.top < pad) {
      adjustTop = pad - rect.top
    }
    if (rect.bottom > window.innerHeight - pad) {
      adjustTop = window.innerHeight - pad - rect.bottom
    }

    if (adjustLeft !== 0 || adjustTop !== 0) {
      setCoords(prev => prev ? { top: prev.top + adjustTop, left: prev.left + adjustLeft } : prev)
    }
  }, [visible, coords])

  const transformOrigin =
    position === 'top' ? 'bottom center' :
    position === 'bottom' ? 'top center' :
    position === 'left' ? 'center right' :
    'center left'

  const translate =
    position === 'top' ? 'translate(-50%, -100%)' :
    position === 'bottom' ? 'translate(-50%, 0)' :
    position === 'left' ? 'translate(-100%, -50%)' :
    'translate(0, -50%)'

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {children}
      </span>
      {visible && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: translate,
            transformOrigin,
            zIndex: 9999,
            pointerEvents: 'none',
            maxWidth,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'var(--color-tooltip-bg, rgba(15, 23, 42, 0.92))',
            color: 'var(--color-tooltip-text, #f1f5f9)',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: '0.01em',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            animation: 'tooltip-fade-in 0.15s ease-out',
          }}
        >
          {text.includes('\n') ? (
            <span style={{ whiteSpace: 'pre-line' }}>{text}</span>
          ) : text}
        </div>,
        document.body,
      )}
    </>
  )
}
