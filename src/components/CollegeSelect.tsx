'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface CollegeResult {
  id: number
  name: string
  city: string
  state: string
  costAttendance?: number | null
  tuitionInState?: number | null
  tuitionOutOfState?: number | null
}

interface CollegeSelectProps {
  value: string
  onChange: (value: string, result?: CollegeResult) => void
  placeholder?: string
  style?: React.CSSProperties
  inputStyle?: React.CSSProperties
  showCost?: boolean
}

export function CollegeSelect({ value, onChange, placeholder = 'Search for a college…', style, inputStyle: customInputStyle, showCost }: CollegeSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<CollegeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const lastQueryRef = useRef('')

  const fetchResults = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); setError(false); return }
    lastQueryRef.current = query
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/colleges/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(val: string) {
    setSearch(val)
    if (!open) setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchResults(val), 300)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const defaultInputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-column)',
    color: 'var(--color-text)',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : value}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => { setOpen(true); setSearch(value); if (value.length >= 2) fetchResults(value) }}
        placeholder={value || placeholder}
        style={{ ...defaultInputStyle, ...customInputStyle }}
      />
      {open && (search.length >= 2 || results.length > 0) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: 220,
          overflowY: 'auto',
          background: 'var(--color-column, #fff)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 8,
          marginTop: 4,
          zIndex: 50,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {loading ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Searching…
            </div>
          ) : error ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#EF4444' }}>Search failed</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fetchResults(lastQueryRef.current) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', padding: 0 }}
              >
                Retry
              </button>
            </div>
          ) : results.length === 0 && search.length >= 2 ? (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              No results — type the full name or try a different spelling
            </div>
          ) : (
            results.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { onChange(r.name, r); setOpen(false); setSearch(''); inputRef.current?.blur() }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '9px 14px',
                  border: 'none',
                  background: r.name === value ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = r.name === value ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent' }}
              >
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 8 }}>
                  <span>{r.city}, {r.state}</span>
                  {showCost && r.costAttendance && (
                    <span style={{ fontWeight: 600, color: '#059669' }}>
                      ~${Math.round(r.costAttendance).toLocaleString()}/yr
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
