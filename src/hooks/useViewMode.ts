'use client'

import { useCallback, useEffect, useState } from 'react'

export type ViewMode = 'student' | 'mom'

const STORAGE_KEY = 'stairwayu_view_mode'
const EVENT = 'stairwayu:view_mode_change'

function readMode(): ViewMode {
  if (typeof window === 'undefined') return 'student'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'mom' || saved === 'student') return saved
    // Legacy: earlier builds used 'family' — migrate silently
    if (saved === 'family') return 'mom'
  } catch {}
  return 'student'
}

function applyTheme(mode: ViewMode) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (mode === 'mom') html.removeAttribute('data-theme')
  else html.setAttribute('data-theme', 'dark')
}

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>('student')

  useEffect(() => {
    const initial = readMode()
    setMode(initial)
    applyTheme(initial)

    const onChange = (e: Event) => {
      const next = (e as CustomEvent<ViewMode>).detail
      if (next === 'mom' || next === 'student') {
        setMode(next)
        applyTheme(next)
      }
    }
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])

  const update = useCallback((next: ViewMode) => {
    setMode(next)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
    } catch {}
  }, [])

  return [mode, update]
}
