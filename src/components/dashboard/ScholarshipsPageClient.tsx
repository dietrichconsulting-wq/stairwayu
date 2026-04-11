'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScholarships, useCreateScholarship, useUpdateScholarship, useDeleteScholarship } from '@/hooks/useScholarships'
import type { Scholarship, ScholarshipStage, ScholarshipDifficulty, Profile } from '@/lib/types/database'
import type { ScholarshipSuggestion } from '@/lib/services/scholarshipFinder'
import { MajorSelect } from '@/components/MajorSelect'

const STAGES: ScholarshipStage[] = ['Researching', 'Applying', 'Submitted', 'Won']
const DIFFICULTIES: ScholarshipDifficulty[] = ['Easy', 'Medium', 'Hard']

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const getStageColors = (): Record<ScholarshipStage, { bg: string; color: string; border: string }> => isDark() ? {
  Researching: { bg: 'rgba(168,162,158,0.08)', color: '#A8A29E', border: 'rgba(168,162,158,0.18)' },
  Applying:    { bg: 'rgba(125,211,252,0.08)', color: '#7DD3FC', border: 'rgba(125,211,252,0.18)' },
  Submitted:   { bg: 'rgba(253,230,138,0.08)', color: '#FDE68A', border: 'rgba(253,230,138,0.18)' },
  Won:         { bg: 'rgba(134,239,172,0.08)', color: '#86EFAC', border: 'rgba(134,239,172,0.18)' },
} : {
  Researching: { bg: 'rgba(100,116,139,0.08)', color: '#64748b', border: 'rgba(100,116,139,0.2)' },
  Applying:    { bg: 'rgba(8,145,178,0.08)',   color: '#0891b2', border: 'rgba(8,145,178,0.2)'  },
  Submitted:   { bg: 'rgba(245,158,11,0.08)',  color: '#d97706', border: 'rgba(245,158,11,0.2)' },
  Won:         { bg: 'rgba(34,197,94,0.08)',   color: '#16a34a', border: 'rgba(34,197,94,0.2)'  },
}

const getDiffColors = (): Record<ScholarshipDifficulty, string> => isDark()
  ? { Easy: '#86EFAC', Medium: '#FDE68A', Hard: '#FCA5A5' }
  : { Easy: '#16a34a', Medium: '#d97706', Hard: '#dc2626' }

const emptyForm = {
  name: '', amount: '', deadline: '', stage: 'Researching' as ScholarshipStage,
  difficulty: 'Medium' as ScholarshipDifficulty, url: '', essay_required: false, notes: '',
}

interface Props {
  userId: string
  profile: Profile | null
}

export function ScholarshipsPageClient({ userId, profile }: Props) {
  const { data: scholarships = [], isLoading } = useScholarships(userId)
  const createScholarship = useCreateScholarship(userId)
  const updateScholarship = useUpdateScholarship(userId)
  const deleteScholarship = useDeleteScholarship(userId)

  const [tab, setTab] = useState<'find' | 'pipeline'>('find')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)

  // Finder state
  const [finderProfile, setFinderProfile] = useState({
    gpa: profile?.gpa?.toString() ?? '',
    gpa_weighted: profile?.gpa_weighted?.toString() ?? '',
    sat: profile?.sat?.toString() ?? '',
    act: profile?.act_score?.toString() ?? '',
    major: profile?.proposed_major ?? '',
    homeState: profile?.home_state ?? '',
    gradYear: profile?.grad_year?.toString() ?? '',
    extracurriculars: profile?.extracurriculars ?? '',
    careerInterests: profile?.career_interests ?? '',
    background: '',
    circumstances: '',
  })
  const [suggestions, setSuggestions] = useState<ScholarshipSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  // Progressive disclosure
  const [showProfileFields, setShowProfileFields] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())

  const totalWon = scholarships.filter(s => s.stage === 'Won').reduce((sum, s) => sum + (s.amount ?? 0), 0)
  const totalApplied = scholarships.filter(s => s.stage !== 'Researching').length

  async function handleSubmit() {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      amount: form.amount ? parseInt(form.amount) : null,
      deadline: form.deadline || null,
      stage: form.stage,
      difficulty: form.difficulty,
      essay_required: form.essay_required,
      url: form.url || null,
      notes: form.notes || null,
    }
    if (editId) {
      await updateScholarship.mutateAsync({ id: editId, ...payload })
      setEditId(null)
    } else {
      await createScholarship.mutateAsync(payload)
    }
    setForm(emptyForm)
    setAdding(false)
  }

  function startEdit(s: Scholarship) {
    setForm({
      name: s.name,
      amount: s.amount?.toString() ?? '',
      deadline: s.deadline ?? '',
      stage: s.stage,
      difficulty: s.difficulty,
      essay_required: s.essay_required,
      url: s.url ?? '',
      notes: s.notes ?? '',
    })
    setEditId(s.id)
    setAdding(true)
  }

  async function handleFind() {
    setSearchError('')
    setSearching(true)
    setSuggestions([])
    try {
      const res = await fetch('/api/scholarships/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpa: finderProfile.gpa ? parseFloat(finderProfile.gpa) : null,
          gpa_weighted: finderProfile.gpa_weighted ? parseFloat(finderProfile.gpa_weighted) : null,
          sat: finderProfile.sat ? parseInt(finderProfile.sat) : null,
          act: finderProfile.act ? parseInt(finderProfile.act) : null,
          major: finderProfile.major || null,
          homeState: finderProfile.homeState || null,
          gradYear: finderProfile.gradYear ? parseInt(finderProfile.gradYear) : null,
          extracurriculars: finderProfile.extracurriculars || null,
          careerInterests: finderProfile.careerInterests || null,
          background: finderProfile.background || null,
          circumstances: finderProfile.circumstances || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSearchError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  async function addToMyPipeline(s: ScholarshipSuggestion) {
    const key = s.name
    setAddedIds(prev => new Set([...prev, key]))
    await createScholarship.mutateAsync({
      name: s.name,
      amount: s.amount && s.amount > 0 ? s.amount : null,
      deadline: s.deadline || null,
      stage: 'Researching',
      difficulty: s.difficulty,
      essay_required: s.essayRequired,
      url: s.url || null,
      notes: `${s.org} — ${s.eligibility}`,
    })
  }

  if (isLoading) {
    return <div style={{ maxWidth: 960 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12, borderRadius: 12 }} />)}</div>
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Scholarships</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Track every scholarship from research to award so nothing slips through the cracks. · {totalApplied} in pipeline{totalWon > 0 ? ` · $${totalWon.toLocaleString()} won` : ''}
          </p>
        </div>
        {tab === 'pipeline' && (
          <button onClick={() => { setForm(emptyForm); setEditId(null); setAdding(true) }}
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add Scholarship
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--color-column)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {([
          { id: 'find', label: 'Find Scholarships' },
          { id: 'pipeline', label: 'My Pipeline' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'var(--color-card)' : 'transparent',
            border: 'none', borderRadius: 9, padding: '8px 20px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FIND TAB ── */}
      {tab === 'find' && (
        <div>
          {/* Header banner */}
          <div className="card-elevated" style={{
            padding: '20px 24px', marginBottom: 20,
            background: 'linear-gradient(135deg, rgba(94,234,212,0.08) 0%, rgba(252,211,77,0.06) 100%)',
            border: '1.5px solid rgba(94,234,212,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32 }}>🎯</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>Scholarship Finder</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  Matched from a curated database of verified scholarships with real application links — no AI-generated results.
                </div>
              </div>
            </div>
          </div>

          {/* Questionnaire */}
          <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Step 1 — Confirm your profile
            </div>

            {/* Collapsible Profile Fields Section */}
            {!showProfileFields && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 14px',
                background: 'color-mix(in srgb, var(--color-primary) 4%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--color-primary) 15%, transparent)',
                borderRadius: 10,
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
                  Using your profile: GPA <span style={{ fontWeight: 700 }}>{finderProfile.gpa}</span>, SAT <span style={{ fontWeight: 700 }}>{finderProfile.sat}</span>, {finderProfile.major && <span>{finderProfile.major}</span>}
                </div>
                <button
                  onClick={() => setShowProfileFields(true)}
                  style={{
                    background: 'var(--color-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Edit
                </button>
              </div>
            )}

            {/* Profile fields grid (shown when expanded) */}
            {showProfileFields && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelS}>UW GPA (4.0)</label>
                  <input value={finderProfile.gpa} onChange={e => setFinderProfile(p => ({ ...p, gpa: e.target.value }))} placeholder="e.g. 3.8" style={iS} />
                </div>
                <div>
                  <label style={labelS}>W GPA (5.0)</label>
                  <input value={finderProfile.gpa_weighted} onChange={e => setFinderProfile(p => ({ ...p, gpa_weighted: e.target.value }))} placeholder="e.g. 4.3" style={iS} />
                </div>
                <div>
                  <label style={labelS}>SAT Score</label>
                  <input value={finderProfile.sat} onChange={e => setFinderProfile(p => ({ ...p, sat: e.target.value }))} placeholder="e.g. 1350" style={iS} />
                </div>
                <div>
                  <label style={labelS}>ACT Score</label>
                  <input value={finderProfile.act} onChange={e => setFinderProfile(p => ({ ...p, act: e.target.value }))} placeholder="e.g. 29" style={iS} />
                </div>
                <div>
                  <label style={labelS}>Intended Major</label>
                  <MajorSelect value={finderProfile.major} onChange={v => setFinderProfile(p => ({ ...p, major: v }))} />
                </div>
                <div>
                  <label style={labelS}>Home State</label>
                  <input value={finderProfile.homeState} onChange={e => setFinderProfile(p => ({ ...p, homeState: e.target.value }))} placeholder="e.g. TX" style={iS} />
                </div>
                <div>
                  <label style={labelS}>Graduation Year</label>
                  <input value={finderProfile.gradYear} onChange={e => setFinderProfile(p => ({ ...p, gradYear: e.target.value }))} placeholder="e.g. 2026" style={iS} />
                </div>
              </div>
            )}

            {/* Unique fields always shown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelS}>Extracurriculars & Activities</label>
                <textarea value={finderProfile.extracurriculars} onChange={e => setFinderProfile(p => ({ ...p, extracurriculars: e.target.value }))}
                  placeholder="e.g. Student government, robotics club, varsity tennis…" rows={2} style={{ ...iS, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelS}>Career Interests</label>
                <textarea value={finderProfile.careerInterests} onChange={e => setFinderProfile(p => ({ ...p, careerInterests: e.target.value }))}
                  placeholder="e.g. Software engineering, healthcare, entrepreneurship…" rows={2} style={{ ...iS, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '16px 0 12px' }}>
              Step 2 — Tell us more (optional but helps!)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelS}>Background / Identity</label>
                <input value={finderProfile.background} onChange={e => setFinderProfile(p => ({ ...p, background: e.target.value }))}
                  placeholder="e.g. Hispanic, first-generation, LGBTQ+, female in STEM…" style={iS} />
              </div>
              <div>
                <label style={labelS}>Special Circumstances</label>
                <input value={finderProfile.circumstances} onChange={e => setFinderProfile(p => ({ ...p, circumstances: e.target.value }))}
                  placeholder="e.g. Military family, foster care, financial need, disability…" style={iS} />
              </div>
            </div>

            {searchError && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{searchError}</div>}

            <button onClick={handleFind} disabled={searching}
              style={{
                background: searching ? 'var(--color-border)' : 'var(--color-primary)',
                color: searching ? 'var(--color-text-muted)' : '#fff',
                border: 'none', borderRadius: 10, padding: '12px 32px',
                fontWeight: 700, fontSize: 14, cursor: searching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: searching ? 'none' : '0 2px 10px color-mix(in srgb, var(--color-primary) 30%, transparent)',
                transition: 'all 0.2s',
              }}>
              {searching ? (
                <><span className="strategy-spinner" /> Matching scholarships…</>
              ) : (
                <>Find My Scholarships</>
              )}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {suggestions.length} verified scholarships matched
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)' }}>
                    ✓ Real links
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {suggestions.map((s, i) => {
                    const isAdded = addedIds.has(s.name)
                    const isExpanded = expandedCards.has(i)
                    const toggleExpand = () => {
                      setExpandedCards(prev => {
                        const next = new Set(prev)
                        if (next.has(i)) next.delete(i)
                        else next.add(i)
                        return next
                      })
                    }
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="card-elevated" style={{
                          padding: '18px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                        onClick={toggleExpand}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                      >

                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.3 }}>{s.name}</div>
                          </div>
                          {s.amount && s.amount > 0 ? (
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', flexShrink: 0 }}>{s.amountLabel}</div>
                          ) : (
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', flexShrink: 0 }}>Varies</div>
                          )}
                        </div>

                        {/* Difficulty badge + deadline (always shown) */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: `${getDiffColors()[s.difficulty]}22`, color: getDiffColors()[s.difficulty] }}>
                            {s.difficulty}
                          </span>
                          {s.deadlineLabel && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              📅 {s.deadlineLabel}
                            </span>
                          )}
                        </div>

                        {/* Action buttons (always shown) */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                            style={{ flex: 1, textAlign: 'center', background: 'var(--color-primary)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '9px 12px', fontWeight: 700, fontSize: 12 }}>
                            Apply Now →
                          </a>
                          <button
                            onClick={e => { e.stopPropagation(); addToMyPipeline(s) }}
                            disabled={isAdded}
                            style={{
                              flex: 1, background: isAdded ? 'rgba(34,197,94,0.1)' : 'var(--color-column)',
                              border: `1.5px solid ${isAdded ? '#16a34a' : 'var(--color-border)'}`,
                              borderRadius: 8, padding: '9px 12px', fontWeight: 700, fontSize: 12,
                              cursor: isAdded ? 'default' : 'pointer',
                              color: isAdded ? '#16a34a' : 'var(--color-text)',
                            }}>
                            {isAdded ? '✓ Added' : '+ Pipeline'}
                          </button>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                            {/* Organization name */}
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Organization</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text)' }}>{s.org}</div>
                            </div>

                            {/* Eligibility */}
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Eligibility</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>
                                {s.eligibility}
                              </div>
                            </div>

                            {/* Why match */}
                            <div style={{ background: 'color-mix(in srgb, var(--color-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)', borderRadius: 8, padding: '8px 10px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Why you match</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{s.whyMatch}</div>
                            </div>

                            {/* Essay badge if present */}
                            {s.essayRequired && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>
                                  ✍️ Essay required
                                </span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {suggestions.length === 0 && !searching && (
            <div className="card-elevated" style={{ padding: '36px 28px', textAlign: 'center', border: '1.5px dashed var(--color-border)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Let's find you some free money 💰</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                Fill in your details above and hit Find My Scholarships — we'll match you with real scholarships you actually qualify for.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PIPELINE TAB ── */}
      {tab === 'pipeline' && (
        <div>
          {/* Add/Edit Form */}
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="card-elevated" style={{ padding: '20px 24px', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{editId ? 'Edit' : 'New'} Scholarship</h3>
                <div className="scholarship-form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Scholarship name *" style={iS} />
                  <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Amount ($)" type="number" style={iS} />
                  <input value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} type="date" style={iS} />
                </div>
                <div className="scholarship-form-row-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value as ScholarshipStage }))} style={iS}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as ScholarshipDifficulty }))} style={iS}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="URL (optional)" style={iS} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '9px 0' }}>
                    <input type="checkbox" checked={form.essay_required} onChange={e => setForm(f => ({ ...f, essay_required: e.target.checked }))} />
                    Essay required
                  </label>
                </div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes…" rows={2}
                  style={{ ...iS, width: '100%', resize: 'vertical', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleSubmit}
                    style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    {editId ? 'Save Changes' : 'Add Scholarship'}
                  </button>
                  <button onClick={() => { setAdding(false); setEditId(null) }}
                    style={{ background: 'var(--color-column)', border: '1.5px solid var(--color-border)', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: 'var(--color-text)' }}>
                    Cancel
                  </button>
                  {editId && (
                    <button onClick={async () => { await deleteScholarship.mutateAsync(editId); setAdding(false); setEditId(null) }}
                      style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid #EF4444', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: '#EF4444' }}>
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Kanban */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {STAGES.map(stage => {
              const items = scholarships.filter(s => s.stage === stage)
              const c = getStageColors()[stage]
              const stageTotal = items.reduce((sum, s) => sum + (s.amount ?? 0), 0)
              return (
                <div key={stage} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '14px 14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color }}>
                      {items.length > 0 && `${items.length}${stageTotal > 0 ? ` · $${(stageTotal / 1000).toFixed(0)}k` : ''}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(s => (
                      <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}
                        onClick={() => { startEdit(s); setTab('pipeline') }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>{s.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {s.amount && <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>${(s.amount / 1000).toFixed(0)}k</span>}
                          <span style={{ fontSize: 10, fontWeight: 600, color: getDiffColors()[s.difficulty] }}>{s.difficulty}</span>
                          {s.deadline && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                          {s.essay_required && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Essay</span>}
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              style={{ fontSize: 10, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                              Apply →
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {items.length === 0 && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>Nothing here yet</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {scholarships.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              No scholarships saved yet — let's find you some free money.{' '}
              <button onClick={() => setTab('find')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Find scholarships →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const iS: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)',
  background: 'var(--color-column)', color: 'var(--color-text)', fontSize: 13, outline: 'none', width: '100%',
}

const labelS: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5,
}
