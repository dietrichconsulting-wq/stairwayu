'use client'

import { useState } from 'react'
import type { ExtracurricularEntry, ECTier } from '@/lib/types/database'
import { EC_TIER_LABELS } from '@/lib/services/admissionChance'

const TIERS: ECTier[] = [1, 2, 3, 4]

interface ECPickerProps {
  entries: ExtracurricularEntry[]
  onChange: (entries: ExtracurricularEntry[]) => void
  maxEntries?: number
}

export function ECPicker({ entries, onChange, maxEntries = 10 }: ECPickerProps) {
  const [showTierHelp, setShowTierHelp] = useState(false)

  function addEntry() {
    if (entries.length >= maxEntries) return
    onChange([...entries, { name: '', tier: 4 }])
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, i) => i !== index))
  }

  function updateEntry(index: number, field: 'name' | 'tier', value: string | number) {
    const updated = entries.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    )
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{
          fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          Extracurricular Activities
        </label>
        <button
          type="button"
          onClick={() => setShowTierHelp(!showTierHelp)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', padding: 0,
          }}
        >
          {showTierHelp ? 'Hide' : 'What are'} tiers?
        </button>
      </div>

      {showTierHelp && (
        <div style={{
          background: 'var(--color-column)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            Activity Tiers — how selective colleges weight ECs
          </div>
          {TIERS.map(t => {
            const info = EC_TIER_LABELS[t]
            return (
              <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 12,
                  background: tierColor(t).bg, color: tierColor(t).text, border: `1px solid ${tierColor(t).border}`,
                  whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
                }}>
                  T{t}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>{info.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{info.examples}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={entry.name}
            onChange={e => updateEntry(i, 'name', e.target.value)}
            placeholder="e.g. Varsity Soccer Captain"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 8,
              border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
              color: 'var(--color-text)', fontSize: 13, outline: 'none', minWidth: 0,
            }}
          />
          <select
            value={entry.tier}
            onChange={e => updateEntry(i, 'tier', parseInt(e.target.value))}
            style={{
              padding: '9px 8px', borderRadius: 8,
              border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
              color: 'var(--color-text)', fontSize: 12, fontWeight: 600, outline: 'none',
              width: 120, flexShrink: 0,
            }}
          >
            {TIERS.map(t => (
              <option key={t} value={t}>T{t} — {EC_TIER_LABELS[t].label.split(' / ')[0]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => removeEntry(i)}
            title="Remove"
            style={{
              background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)',
              padding: '8px 10px', lineHeight: 1, flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      ))}

      {entries.length < maxEntries && (
        <button
          type="button"
          onClick={addEntry}
          style={{
            background: 'none', border: '1.5px dashed var(--color-border)', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)',
            padding: '9px 12px', textAlign: 'left',
          }}
        >
          + Add activity{entries.length === 0 ? '' : ` (${entries.length}/${maxEntries})`}
        </button>
      )}

      {entries.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Top 5 activities scored by tier. Higher tiers have more impact on your admission odds.
        </div>
      )}
    </div>
  )
}

function tierColor(tier: ECTier) {
  switch (tier) {
    case 1: return { bg: 'rgba(251,191,36,0.12)', text: '#D97706', border: 'rgba(251,191,36,0.3)' }
    case 2: return { bg: 'rgba(52,211,153,0.10)', text: '#059669', border: 'rgba(52,211,153,0.25)' }
    case 3: return { bg: 'rgba(96,165,250,0.10)', text: '#2563EB', border: 'rgba(96,165,250,0.25)' }
    case 4: return { bg: 'rgba(148,163,184,0.10)', text: '#64748B', border: 'rgba(148,163,184,0.25)' }
  }
}
