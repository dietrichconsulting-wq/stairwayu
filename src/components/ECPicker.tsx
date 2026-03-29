'use client'

import { useState } from 'react'
import type { ExtracurricularEntry, ECTier } from '@/lib/types/database'
import { EC_TIER_LABELS, EC_TIER_POINTS } from '@/lib/services/admissionChance'

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
          borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
            How extracurricular scoring works
          </div>

          {/* Tier table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TIERS.map(t => {
              const info = EC_TIER_LABELS[t]
              const pts = EC_TIER_POINTS[t]
              return (
                <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 12,
                    background: tierColor(t).bg, color: tierColor(t).text, border: `1px solid ${tierColor(t).border}`,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
                  }}>
                    T{t}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                      {info.label} <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>+{pts} pts</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{info.examples}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Scoring rules */}
          <div style={{
            borderTop: '1px solid var(--color-border)', paddingTop: 8,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)' }}>Scoring rules</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Your <strong>top 5</strong> activities (by tier) are scored, capped at <strong>15 points</strong>.<br />
              At highly selective schools (&lt;10% admit), ECs are weighted <strong>1.4x</strong> — they matter more when stats alone don&apos;t separate applicants.<br />
              At open-admission schools (&gt;70% admit), ECs are weighted <strong>0.6x</strong> — stats dominate.
            </div>
          </div>
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

      {entries.filter(e => e.name.trim()).length > 0 && (() => {
        const valid = entries.filter(e => e.name.trim())
        const sorted = [...valid].sort((a, b) => a.tier - b.tier).slice(0, 5)
        const raw = sorted.reduce((sum, e) => sum + (EC_TIER_POINTS[e.tier] || 0), 0)
        const capped = Math.min(raw, 15)
        return (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8,
            background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-column))',
            border: '1px solid color-mix(in srgb, var(--color-primary) 15%, var(--color-border))',
          }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              Top {Math.min(valid.length, 5)} of {valid.length} scored
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)' }}>
              {capped} / 15 pts
            </span>
          </div>
        )
      })()}
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
