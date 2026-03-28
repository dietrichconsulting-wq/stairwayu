'use client'

import { useState, useRef, useEffect } from 'react'
import { MAJORS } from '@/lib/majors'

interface MajorSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function MajorSelect({ value, onChange, placeholder = 'Search or select a major…', style }: MajorSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useRef(`major-listbox-${Math.random().toString(36).slice(2, 8)}`).current

  const filtered = search.trim()
    ? MAJORS.filter(m => m.toLowerCase().includes(search.toLowerCase()))
    : MAJORS

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

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-label="Search or select a major"
        value={open ? search : value}
        onChange={e => { setSearch(e.target.value); setActiveIndex(-1); if (!open) setOpen(true) }}
        onFocus={() => { setOpen(true); setSearch('') }}
        onKeyDown={e => {
          if (!open) return
          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, filtered.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
          else if (e.key === 'Enter' && activeIndex >= 0 && filtered[activeIndex]) { e.preventDefault(); onChange(filtered[activeIndex]); setOpen(false); setSearch(''); inputRef.current?.blur() }
          else if (e.key === 'Escape') { setOpen(false); setSearch('') }
        }}
        placeholder={value || placeholder}
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1.5px solid var(--color-border)',
          background: 'var(--color-column)',
          color: 'var(--color-text)',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Major search results"
          style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: 200,
          overflowY: 'auto',
          background: 'var(--color-column, #fff)',
          border: '1.5px solid var(--color-border)',
          borderRadius: 8,
          marginTop: 4,
          zIndex: 50,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              No matches — type to use a custom major
            </div>
          ) : (
            filtered.map((m, idx) => (
              <button
                key={m}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={idx === activeIndex}
                type="button"
                onClick={() => { onChange(m); setOpen(false); setSearch(''); inputRef.current?.blur() }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 14px',
                  border: 'none',
                  background: idx === activeIndex ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : m === value ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
                  color: m === value ? 'var(--color-primary)' : 'var(--color-text)',
                  fontSize: 13,
                  fontWeight: m === value ? 700 : 400,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { setActiveIndex(idx); (e.target as HTMLElement).style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = m === value ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent' }}
              >
                {m}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
