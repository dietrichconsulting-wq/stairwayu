'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { INTEREST_TAGS, InterestTag, Career } from '@/lib/majorExplorer'

interface MajorExplorerProps {
  currentMajor?: string | null
  onSelectMajor: (major: string) => void
}

type ExplorerState = 'interests' | 'careers' | 'confirmation' | 'saved'

export function MajorExplorer({ currentMajor, onSelectMajor }: MajorExplorerProps) {
  const router = useRouter()
  const [state, setState] = useState<ExplorerState>('interests')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null)

  const handleToggleTag = (id: string) => {
    setSelectedTagIds(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id)
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleShowCareers = () => {
    if (selectedTagIds.length > 0) {
      setState('careers')
    }
  }

  const handleSelectMajorChip = (major: string) => {
    setSelectedMajor(major)
    setState('confirmation')
  }

  const handleConfirmMajor = () => {
    if (selectedMajor) {
      onSelectMajor(selectedMajor)
      setState('saved')
    }
  }

  const handleBackToInterests = () => {
    setState('interests')
  }

  const handleBackToCareers = () => {
    setState('careers')
    setSelectedMajor(null)
  }

  // Derived state for careers
  const parseSalary = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10)

  // Get all careers from selected tags
  const selectedTags = INTEREST_TAGS.filter(t => selectedTagIds.includes(t.id))
  
  // Collect deduplicated careers
  const allCareersMap = new Map<string, Career>()
  selectedTags.forEach(tag => {
    tag.careers.forEach(c => {
      if (!allCareersMap.has(c.title)) {
        allCareersMap.set(c.title, c)
      }
    })
  })
  
  const allCareersList = Array.from(allCareersMap.values())
  allCareersList.sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary))

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 16,
      padding: '24px',
      marginBottom: 24,
      overflow: 'hidden'
    }} className="card-elevated">
      <AnimatePresence mode="wait">
        {state === 'interests' && (
          <motion.div
            key="interests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>🧭 Find Your Major</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
                Pick interests that excite you (up to 5)
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12
            }}>
              {INTEREST_TAGS.map((tag, i) => {
                const isSelected = selectedTagIds.includes(tag.id)
                return (
                  <motion.button
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    onClick={() => handleToggleTag(tag.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 100,
                      border: isSelected ? '1px solid rgba(94,234,212,0.25)' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(94,234,212,0.10)' : 'var(--color-column)',
                      color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </motion.button>
                )
              })}
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
              {selectedTagIds.length > 0 && (
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {selectedTagIds.length} selected
                </span>
              )}
              <button
                disabled={selectedTagIds.length === 0}
                onClick={handleShowCareers}
                style={{
                  background: 'var(--color-accent-text)',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: selectedTagIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedTagIds.length === 0 ? 0.5 : 1
                }}
              >
                See Careers →
              </button>
            </div>
          </motion.div>
        )}

        {state === 'careers' && (
          <motion.div
            key="careers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleBackToInterests}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 0,
                fontSize: 14,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              ← Back to interests
            </button>
            
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Career Matches</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 14, color: 'var(--color-text-muted)' }}>
                {allCareersList.length} careers match your interests
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allCareersList.length >= 10 ? (
                // Grouped by interest tag
                selectedTags.map(tag => {
                  const tagCareers = tag.careers.filter(c => allCareersMap.has(c.title))
                  if (tagCareers.length === 0) return null
                  tagCareers.sort((a, b) => parseSalary(b.salary) - parseSalary(a.salary))
                  return (
                    <details key={tag.id} open style={{ 
                      background: 'var(--color-column)', 
                      borderRadius: 12, border: '1px solid var(--color-border)',
                      marginBottom: 8
                    }}>
                      <summary style={{ 
                        padding: '12px 16px', fontWeight: 600, fontSize: 15, 
                        color: 'var(--color-text)', cursor: 'pointer', userSelect: 'none' 
                      }}>
                        {tag.emoji} {tag.label}
                      </summary>
                      <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {tagCareers.map(c => (
                          <CareerCard key={c.title} career={c} onSelectMajor={handleSelectMajorChip} />
                        ))}
                      </div>
                    </details>
                  )
                })
              ) : (
                // Flat list
                allCareersList.map(c => (
                  <CareerCard key={c.title} career={c} onSelectMajor={handleSelectMajorChip} />
                ))
              )}
            </div>
          </motion.div>
        )}

        {state === 'confirmation' && selectedMajor && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              background: 'var(--color-column)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: 18, color: 'var(--color-text)', margin: '0 0 16px 0' }}>
                🎯 Set "{selectedMajor}" as your intended major?
              </h3>
              
              {currentMajor && currentMajor !== 'Undecided' && (
                <div style={{ 
                  color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 16,
                  background: 'rgba(239,68,68,0.1)', padding: '6px 12px', borderRadius: 6, display: 'inline-block'
                }}>
                  This will replace your current major: {currentMajor}
                </div>
              )}

              <div style={{ 
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: 12, marginBottom: 20, textAlign: 'left',
                maxWidth: 400, margin: '0 auto 20px auto'
              }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Career paths
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>
                  {INTEREST_TAGS.flatMap(t => t.careers)
                    .filter(c => c.majors.includes(selectedMajor))
                    .map((c, idx, arr) => {
                      if (arr.findIndex(x => x.title === c.title) === idx) {
                        return c.title
                      }
                      return null
                    }).filter(Boolean).join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button
                  onClick={handleConfirmMajor}
                  style={{
                    background: 'var(--color-accent-text)',
                    color: '#000',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Set as My Major
                </button>
                <button
                  onClick={handleBackToCareers}
                  style={{
                    background: 'var(--color-column)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    padding: '10px 20px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Keep Exploring
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {state === 'saved' && selectedMajor && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{
              background: 'var(--color-column)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: 28,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
                {selectedMajor} — locked in!
              </h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: '0 0 24px 0', lineHeight: 1.5 }}>
                Your strategy and school matches will now factor in {selectedMajor} program strength.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => router.push('/explore')}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  🔍 Explore Top {selectedMajor} Schools
                </button>
                <button
                  onClick={() => router.push('/strategy')}
                  style={{
                    background: 'var(--color-column)',
                    color: 'var(--color-text)',
                    border: '1.5px solid var(--color-border)',
                    padding: '12px 24px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Build My Strategy
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CareerCard({ career: c, onSelectMajor }: { career: Career, onSelectMajor: (m: string) => void }) {
  const isPositiveGrowth = c.growth.startsWith('+')
  
  return (
    <div style={{ 
      padding: 16, border: '1px solid var(--color-border)', 
      borderRadius: 8, background: 'var(--color-card)' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>{c.title}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>{c.description}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-stat-sat)', cursor: 'help' }}
            title="Median annual wage for all U.S. workers in this occupation (Bureau of Labor Statistics). This is the midpoint across all experience levels — not a starting salary or a first-10-years average. Early-career pay is typically lower; experienced workers often earn more."
          >
            {c.salary}/yr
          </div>
          <div style={{ fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <span
              style={{
                background: isPositiveGrowth ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: isPositiveGrowth ? 'var(--color-success)' : 'var(--color-danger)',
                padding: '2px 6px', borderRadius: 4, fontWeight: 500, cursor: 'help'
              }}
              title={`Projected 10-year job growth for this occupation (Bureau of Labor Statistics). ${isPositiveGrowth ? 'Positive means more jobs are expected to be added than lost' : 'Negative means the field is projected to shrink'}. The U.S. average across all jobs is about +3%.`}
            >
              {isPositiveGrowth ? '↗' : '↘'} {c.growth}
            </span>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Leads to:</span>
        {c.majors.map(m => (
          <button key={m} onClick={() => onSelectMajor(m)} style={{
            background: 'var(--color-column)', border: '1px solid var(--color-border)', 
            color: 'var(--color-text)', borderRadius: 16, padding: '4px 10px', fontSize: 12, 
            cursor: 'pointer', transition: 'background 0.1s'
          }}>
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
