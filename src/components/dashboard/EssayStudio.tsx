'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ESSAY_TYPES = [
  'Common App Personal Statement',
  'Why This School',
  'Why This Major',
  'Supplemental – Activities/Impact',
  'Supplemental – Challenge/Growth',
  'Diversity Essay',
  'Short Answer (50–150 words)',
  'Other Supplemental',
]

interface Profile {
  gpa: number | null
  sat: number | null
  proposed_major: string | null
  school1_name: string | null
  school2_name: string | null
  school3_name: string | null
  school4_name: string | null
  school5_name: string | null
  school6_name: string | null
  school7_name: string | null
  school8_name: string | null
  school9_name: string | null
}

interface EssayStudioProps {
  profile: Profile | null
}

type Tab = 'brainstorm' | 'critique'
type BrainstormStep = 'setup' | 'questions' | 'prompts'

interface PromptIdea {
  title: string
  hook: string
  angle: string
  whyItWorks: string
}

interface CritiqueImprovement {
  issue: string
  detail: string
  suggestion: string
}

interface Critique {
  score: number
  scoreLabel: string
  summary: string
  strengths: string[]
  improvements: CritiqueImprovement[]
  openingFeedback: string
  closingFeedback: string
  voiceFeedback: string
  schoolFit: string
}

export function EssayStudio({ profile }: EssayStudioProps) {
  const [tab, setTab] = useState<Tab>('brainstorm')

  const schools = [
    profile?.school1_name,
    profile?.school2_name,
    profile?.school3_name,
    profile?.school4_name,
    profile?.school5_name,
    profile?.school6_name,
    profile?.school7_name,
    profile?.school8_name,
    profile?.school9_name,
  ].filter(Boolean) as string[]

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Essay Studio ✍️</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Brainstorm essay topics or paste a draft to get AI feedback tailored to each school.
      </p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {(['brainstorm', 'critique'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              border: tab === t ? 'none' : '1.5px solid var(--color-border)',
              background: tab === t ? 'var(--color-primary)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--color-text-muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t === 'brainstorm' ? '💡 Brainstorm' : '🔍 Critique Draft'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'brainstorm' ? (
          <motion.div key="brainstorm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <BrainstormTab schools={schools} profile={profile} />
          </motion.div>
        ) : (
          <motion.div key="critique" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CritiqueTab schools={schools} profile={profile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Brainstorm Tab ───────────────────────────────────────────────────────────

function BrainstormTab({ schools, profile }: { schools: string[]; profile: Profile | null }) {
  const [school, setSchool] = useState(schools[0] || '')
  const [essayType, setEssayType] = useState(ESSAY_TYPES[0])
  const [step, setStep] = useState<BrainstormStep>('setup')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [prompts, setPrompts] = useState<PromptIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchQuestions() {
    if (!school) { setError('Select a school first.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/essays/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'questions',
          school,
          essayType,
          major: profile?.proposed_major,
          gpa: profile?.gpa,
          sat: profile?.sat,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setQuestions(data.questions)
      setAnswers(Object.fromEntries(data.questions.map((q: string) => [q, ''])))
      setStep('questions')
    } catch {
      setError('Failed to load questions. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPrompts() {
    const unanswered = questions.filter(q => !answers[q]?.trim())
    if (unanswered.length > 1) { setError('Please answer at least 3 questions.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/essays/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prompts',
          school,
          essayType,
          major: profile?.proposed_major,
          gpa: profile?.gpa,
          sat: profile?.sat,
          answers,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPrompts(data.prompts)
      setStep('prompts')
    } catch {
      setError('Failed to generate prompts. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('setup')
    setQuestions([])
    setAnswers({})
    setPrompts([])
    setError('')
  }

  return (
    <div>
      {/* Setup */}
      <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: step === 'setup' ? 20 : 0 }}>
          <SelectField label="School" value={school} onChange={setSchool} options={schools.length ? schools : ['Add schools in your profile']} disabled={step !== 'setup'} />
          <SelectField label="Essay Type" value={essayType} onChange={setEssayType} options={ESSAY_TYPES} disabled={step !== 'setup'} />
        </div>

        {step === 'setup' && (
          <>
            {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <button onClick={fetchQuestions} disabled={loading || !school} style={primaryBtn(loading || !school)}>
              {loading ? <><Spinner /> Thinking…</> : <>💡 Start Brainstorm</>}
            </button>
          </>
        )}

        {step !== 'setup' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{school}</strong> · {essayType}
            </span>
            <button onClick={reset} style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              ← Start over
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      <AnimatePresence>
        {step === 'questions' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card-elevated" style={{ padding: '24px 28px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Tell us about yourself</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                Answer these questions so we can suggest essay angles specific to you. Be honest and specific — the more detail, the better.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {questions.map((q, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-primary)', marginRight: 6 }}>{i + 1}.</span>{q}
                    </label>
                    <textarea
                      value={answers[q] || ''}
                      onChange={e => setAnswers(a => ({ ...a, [q]: e.target.value }))}
                      placeholder="Write 2–4 sentences…"
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 8,
                        border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
                        color: 'var(--color-text)', fontSize: 13, resize: 'vertical',
                        outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                      }}
                    />
                  </div>
                ))}
              </div>
              {error && <div style={{ color: '#EF4444', fontSize: 12, margin: '12px 0 0' }}>{error}</div>}
              <button onClick={fetchPrompts} disabled={loading} style={{ ...primaryBtn(loading), marginTop: 20 }}>
                {loading ? <><Spinner /> Generating ideas…</> : <>✨ Generate Essay Ideas</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Ideas */}
      <AnimatePresence>
        {step === 'prompts' && prompts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>
              Your essay ideas for <span style={{ color: 'var(--color-primary)' }}>{school}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {prompts.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card-elevated"
                  style={{ padding: '20px 24px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: 'var(--color-primary)',
                      background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)',
                      borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      Idea {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>{p.title}</div>

                      <div style={{
                        fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-muted)',
                        borderLeft: '3px solid var(--color-primary)', paddingLeft: 12,
                        marginBottom: 12, lineHeight: 1.5,
                      }}>
                        &ldquo;{p.hook}&rdquo;
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <InfoBlock label="The Angle" text={p.angle} />
                        <InfoBlock label={`Why It Works for ${school.split(' ')[0]}`} text={p.whyItWorks} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Critique Tab ─────────────────────────────────────────────────────────────

function CritiqueTab({ schools, profile }: { schools: string[]; profile: Profile | null }) {
  const [school, setSchool] = useState(schools[0] || '')
  const [essayType, setEssayType] = useState(ESSAY_TYPES[0])
  const [draft, setDraft] = useState('')
  const [critique, setCritique] = useState<Critique | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const liveWordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0

  async function handleCritique() {
    if (!draft.trim() || liveWordCount < 20) { setError('Paste your essay draft first (at least 20 words).'); return }
    if (!school) { setError('Select a school first.'); return }
    setError('')
    setLoading(true)
    setCritique(null)
    try {
      const res = await fetch('/api/essays/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school,
          essayType,
          major: profile?.proposed_major,
          gpa: profile?.gpa,
          sat: profile?.sat,
          draft,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCritique(data.critique)
      setWordCount(data.wordCount)
    } catch {
      setError('Failed to critique essay. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = critique
    ? critique.score >= 8 ? '#059669'
      : critique.score >= 6 ? '#d97706'
      : '#dc2626'
    : 'var(--color-text)'

  return (
    <div>
      <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <SelectField label="School" value={school} onChange={setSchool} options={schools.length ? schools : ['Add schools in your profile']} />
          <SelectField label="Essay Type" value={essayType} onChange={setEssayType} options={ESSAY_TYPES} />
        </div>

        <label style={labelStyle}>Your Draft</label>
        <div style={{ position: 'relative' }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Paste your essay draft here…"
            rows={12}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: '1.5px solid var(--color-border)', background: 'var(--color-column)',
              color: 'var(--color-text)', fontSize: 13, resize: 'vertical',
              outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, marginTop: 6,
            }}
          />
          <span style={{
            position: 'absolute', bottom: 10, right: 12,
            fontSize: 11, color: liveWordCount > 650 ? '#dc2626' : 'var(--color-text-muted)',
            fontWeight: 600, pointerEvents: 'none',
          }}>
            {liveWordCount} words
          </span>
        </div>

        {error && <div style={{ color: '#EF4444', fontSize: 12, margin: '10px 0 0' }}>{error}</div>}

        <button onClick={handleCritique} disabled={loading} style={{ ...primaryBtn(loading), marginTop: 16 }}>
          {loading ? <><Spinner /> Analyzing your essay…</> : <>🔍 Critique My Essay</>}
        </button>
      </div>

      {/* Critique Results */}
      <AnimatePresence>
        {critique && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* Score header */}
            <div className="card-elevated" style={{ padding: '20px 24px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{critique.score}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: scoreColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>/ 10</div>
              </div>
              <div style={{ width: 1, height: 48, background: 'var(--color-border)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: scoreColor, marginBottom: 4 }}>{critique.scoreLabel}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{critique.summary}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {wordCount} words
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {/* Strengths */}
              <div className="card-elevated" style={{ padding: '18px 20px' }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                  ✓ Strengths
                </h4>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {critique.strengths.map((s, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#059669', fontWeight: 700 }}>·</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Voice & School Fit */}
              <div className="card-elevated" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Voice & Authenticity
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{critique.voiceFeedback}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Fit for {school.split(' ').slice(0, 2).join(' ')}
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{critique.schoolFit}</p>
                </div>
              </div>
            </div>

            {/* Opening / Closing */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <FeedbackBlock label="Opening" text={critique.openingFeedback} color="#0891b2" />
              <FeedbackBlock label="Closing" text={critique.closingFeedback} color="#0891b2" />
            </div>

            {/* Areas to improve */}
            {critique.improvements?.length > 0 && (
              <div className="card-elevated" style={{ padding: '20px 24px' }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                  ⚡ Areas to Improve
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {critique.improvements.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{
                        background: 'rgba(245,158,11,0.05)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 10, padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', marginBottom: 4 }}>{item.issue}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{item.detail}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5, padding: '8px 12px', background: 'var(--color-column)', borderRadius: 8, borderLeft: '3px solid #d97706' }}>
                        <span style={{ fontWeight: 700, color: '#d97706' }}>Try: </span>{item.suggestion}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options, disabled }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)',
          background: disabled ? 'var(--color-border)' : 'var(--color-column)',
          color: 'var(--color-text)', fontSize: 13, outline: 'none', cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ background: 'var(--color-column)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text)', lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}

function FeedbackBlock({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div className="card-elevated" style={{ padding: '16px 18px' }}>
      <h4 style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
        {label}
      </h4>
      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{text}</p>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--color-text-muted)' : 'var(--color-primary)',
    color: '#fff', border: 'none', borderRadius: 10,
    padding: '11px 26px', fontWeight: 700, fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
  }
}
