'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useSeedTasks } from '@/hooks/useTasks'
import { MajorSelect } from '@/components/MajorSelect'
import { CollegeSelect } from '@/components/CollegeSelect'
import { ECPicker } from '@/components/ECPicker'
import type { ExtracurricularEntry } from '@/lib/types/database'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3]

const CLIMATES = [
  { value: 'Warm/Hot', label: '☀️ Warm / Hot', desc: 'Sun belt, Southern states, Southwest' },
  { value: 'Mild', label: '🌤 Mild / Moderate', desc: 'Pacific Northwest, Mid-Atlantic' },
  { value: 'Cold/Snowy', label: '❄️ Cold / Snowy', desc: 'Midwest, Northeast, Mountain' },
  { value: 'Any', label: '🌍 No preference', desc: 'Climate doesn\'t matter to me' },
]

const SIZES = [
  { value: 'Small', label: 'Small', desc: 'Under 5,000 students' },
  { value: 'Medium', label: 'Medium', desc: '5,000 – 15,000 students' },
  { value: 'Large', label: 'Large', desc: '15,000 – 30,000 students' },
  { value: 'Very Large', label: 'Very Large', desc: '30,000+ students' },
  { value: 'Any', label: 'No preference', desc: 'Any size works' },
]

const TYPES = [
  { value: 'Public', label: '🏛 Public University', desc: 'State schools, lower in-state tuition' },
  { value: 'Private', label: '🎓 Private University', desc: 'Often more financial aid available' },
  { value: 'Either', label: '⚖️ Either / Both', desc: 'Open to all options' },
]

const DISTANCES = [
  { value: 'Close (<2h)', label: '🏠 Close to home', desc: 'Within ~2 hours driving' },
  { value: 'Regional (<5h)', label: '🚗 Regional', desc: 'Within ~5 hours driving' },
  { value: 'Anywhere', label: '✈️ Anywhere', desc: 'Willing to go anywhere in the US' },
]

const STEPS = ['About You', 'Academics', 'Preferences', 'Target Schools']

type FormData = {
  display_name: string
  home_state: string
  grad_year: string
  gpa: string
  gpa_weighted: string
  sat: string
  ec_entries: ExtracurricularEntry[]
  act_score: string
  proposed_major: string
  extracurriculars: string
  career_interests: string
  desired_climate: string[]
  school_size_pref: string[]
  school_type_pref: string[]
  distance_pref: string[]
  schools: string[] // dynamic list of school names
}

export function OnboardingClient({ userId, initialName = '' }: { userId: string; initialName?: string }) {
  const router = useRouter()
  const seedTasks = useSeedTasks(userId)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [form, setForm] = useState<FormData>({
    display_name: initialName,
    home_state: '',
    grad_year: String(CURRENT_YEAR + 1),
    gpa: '',
    gpa_weighted: '',
    sat: '',
    act_score: '',
    proposed_major: '',
    ec_entries: [],
    extracurriculars: '',
    career_interests: '',
    desired_climate: [],
    school_size_pref: [],
    school_type_pref: [],
    distance_pref: [],
    schools: ['', '', '', ''], // start with 4 slots visible, can add up to 8
  })

  function set(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // For multi-select preference fields: "Any"/"Either"/"Anywhere" are exclusive; others toggle
  function togglePref(key: 'desired_climate' | 'school_size_pref' | 'school_type_pref' | 'distance_pref', value: string, exclusiveValues: string[]) {
    setForm(f => {
      const current = f[key] as string[]
      if (exclusiveValues.includes(value)) {
        // Clicking an exclusive option: select only it (or deselect if already sole selection)
        return { ...f, [key]: current.length === 1 && current[0] === value ? [] : [value] }
      }
      // Clicking a normal option: remove any exclusive values, then toggle
      const withoutExclusive = current.filter(v => !exclusiveValues.includes(v))
      const next = withoutExclusive.includes(value)
        ? withoutExclusive.filter(v => v !== value)
        : [...withoutExclusive, value]
      return { ...f, [key]: next }
    })
  }

  function canAdvance() {
    if (step === 0) return form.display_name.trim().length > 0 && form.home_state.length > 0
    if (step === 1) return form.proposed_major.trim().length > 0
    if (step === 2) return form.desired_climate.length > 0 && form.school_size_pref.length > 0 && form.school_type_pref.length > 0 && form.distance_pref.length > 0 // arrays — at least one selected each
    return true
  }

  async function handleFinish() {
    setSaving(true)
    setSaveError('')
    try {
      const supabase = createClient()
      // Update profile (no school columns)
      const { error } = await supabase.from('profiles').update({
        display_name: form.display_name || null,
        home_state: form.home_state || null,
        grad_year: form.grad_year ? parseInt(form.grad_year) : null,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        gpa_weighted: form.gpa_weighted ? parseFloat(form.gpa_weighted) : null,
        sat: form.sat ? parseInt(form.sat) : null,
        act_score: form.act_score ? parseInt(form.act_score) : null,
        proposed_major: form.proposed_major || null,
        extracurriculars: form.extracurriculars || null,
        ec_entries: form.ec_entries.filter(e => e.name.trim()).length > 0 ? form.ec_entries.filter(e => e.name.trim()) : null,
        career_interests: form.career_interests || null,
        desired_climate: form.desired_climate.length > 0 ? form.desired_climate.join(',') : null,
        school_size_pref: form.school_size_pref.length > 0 ? form.school_size_pref.join(',') : null,
        school_type_pref: form.school_type_pref.length > 0 ? form.school_type_pref.join(',') : null,
        distance_pref: form.distance_pref.length > 0 ? form.distance_pref.join(',') : null,
        onboarding_complete: true,
      }).eq('id', userId)
      if (error) throw error

      // Insert schools into user_colleges
      const schoolNames = form.schools.filter(s => s.trim())
      if (schoolNames.length > 0) {
        const rows = schoolNames.map((name, i) => ({
          user_id: userId,
          college_name: name,
          sort_order: i + 1,
        }))
        const { error: schoolError } = await supabase
          .from('user_colleges')
          .upsert(rows, { onConflict: 'user_id,college_name' })
        if (schoolError) throw schoolError
      }

      await seedTasks.mutateAsync()
      router.push('/dashboard')
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 24px',
    }}>
      {/* Loading overlay */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)',
              backdropFilter: 'blur(8px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 32,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.25, y: 8 }}
                  animate={{ opacity: [0.25, 1, 0.25], y: [8, 0, 8] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: 48,
                    height: 32 + i * 18,
                    borderRadius: 8,
                    background: 'linear-gradient(to top, var(--color-primary), color-mix(in srgb, var(--color-primary) 65%, white))',
                    boxShadow: '0 6px 24px color-mix(in srgb, var(--color-primary) 40%, transparent)',
                  }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Building your dashboard…
              </div>
              <motion.div
                style={{ fontSize: 13, color: 'var(--color-text-muted)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                Seeding tasks, milestones, and your roadmap
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Stairway U
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {step === 0 && "Let's build your college gameplan. 🎓"}
          {step === 1 && 'Now the fun part — your stats 📊'}
          {step === 2 && 'What\'s your ideal campus? 🏫'}
          {step === 3 && 'Dream schools — let\'s go 🎯'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
          {step === 0 && 'Takes 2 minutes. Powers your entire dashboard and roadmap.'}
          {step === 1 && 'Be honest — this powers your AI strategy and school fit analysis.'}
          {step === 2 && 'These preferences help us match you to the right schools.'}
          {step === 3 && "Add up to 8 schools on Free. Upgrade to Pro for unlimited."}
        </p>
      </div>

      {/* Progress stairway */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 36 }}>
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          const height = 28 + i * 14 // ascending stair heights: 28, 42, 56, 70
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 64, height, borderRadius: 8,
                background: done
                  ? 'var(--color-primary)'
                  : active
                    ? 'linear-gradient(to top, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white))'
                    : 'var(--color-column)',
                border: active ? '2px solid var(--color-primary)' : done ? 'none' : '1.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done || active ? '#fff' : 'var(--color-text-muted)',
                fontSize: 13, fontWeight: 700,
                opacity: !done && !active ? 0.35 : 1,
                transition: 'all 0.3s ease',
                boxShadow: active ? '0 4px 16px color-mix(in srgb, var(--color-primary) 40%, transparent)' : 'none',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
                color: active ? 'var(--color-primary)' : done ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
                opacity: !done && !active ? 0.35 : 1,
              }}>
                {s}
              </span>
            </div>
          )
        })}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-elevated" style={{ padding: '32px 32px 28px' }}>
              {step === 0 && <StepAbout form={form} set={set} />}
              {step === 1 && <StepAcademics form={form} set={set} setForm={setForm} onSkipAhead={() => {
                // S2.T5 — Skip Ahead jumps Academics → Target Schools, pre-filling
                // all preferences with "no preference" defaults so handleFinish still has
                // valid values. User can revisit preferences on the dashboard.
                setForm(f => ({
                  ...f,
                  desired_climate: ['Any'],
                  school_size_pref: ['Any'],
                  school_type_pref: ['Either'],
                  distance_pref: ['Anywhere'],
                }))
                setStep(3)
              }} />}
              {step === 2 && <StepPreferences form={form} togglePref={togglePref} onSkip={() => {
                setForm(f => ({
                  ...f,
                  desired_climate: ['Any'],
                  school_size_pref: ['Any'],
                  school_type_pref: ['Either'],
                  distance_pref: ['Anywhere'],
                }))
                setStep(s => s + 1)
              }} />}
              {step === 3 && <StepSchools schools={form.schools} setSchools={schools => setForm(f => ({ ...f, schools }))} />}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        {saveError && (
          <div style={{ color: 'var(--color-danger)', fontSize: 13, marginTop: 12, padding: '10px 14px', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', borderRadius: 8 }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            style={{
              background: 'transparent', border: '1.5px solid var(--color-border)',
              borderRadius: 10, padding: '11px 24px', fontWeight: 600, fontSize: 14,
              cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.3 : 1,
              color: 'var(--color-text)',
            }}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              style={{
                background: canAdvance() ? 'var(--color-primary)' : 'var(--color-border)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '11px 28px', fontWeight: 700, fontSize: 14,
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              {step === 0 && "Let's Go →"}
              {step === 1 && 'Looking Good — Next →'}
              {step === 2 && 'Almost There →'}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                borderRadius: 10, padding: '11px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              {saving ? 'Setting up your dashboard…' : '🚀 Launch My Dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: About You ────────────────────────────────────────────────────────
function StepAbout({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Field label="Your Name" value={form.display_name} onChange={v => set('display_name', v)} placeholder="e.g. Alex Johnson" required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Home State <Required /></label>
          <select value={form.home_state} onChange={e => set('home_state', e.target.value)} style={inputStyle}>
            <option value="">Select state</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Expected Graduation Year <Required /></label>
          <select value={form.grad_year} onChange={e => set('grad_year', e.target.value)} style={inputStyle}>
            {GRAD_YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Academics ────────────────────────────────────────────────────────
// S2.T5 — Intended major is the only required field and leads the step.
// GPA, test scores, activities, and career interests collapse under a
// "Sharpen your results · Optional" disclosure so a first-time user can move
// forward in under 30 seconds. Skip Ahead jumps straight to Target Schools.
function StepAcademics({ form, set, setForm, onSkipAhead }: {
  form: FormData
  set: (k: keyof FormData, v: string) => void
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  onSkipAhead: () => void
}) {
  const canSkip = form.proposed_major.trim().length > 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero field — the only thing we require */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Intended Major <Required /></label>
        <MajorSelect value={form.proposed_major} onChange={v => set('proposed_major', v)} />
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.4 }}>
          This is all we need to start recommending schools. Stats and activities can be added anytime.
        </p>
      </div>

      {/* Everything below is optional — collapsed by default to reduce friction */}
      <details style={{
        borderRadius: 12,
        border: '1.5px dashed var(--color-border)',
        background: 'var(--color-column)',
      }}>
        <summary style={{
          cursor: 'pointer',
          padding: '14px 18px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.03em',
          color: 'var(--color-text)',
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>Sharpen your results · Optional</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
            GPA · SAT/ACT · Activities
          </span>
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '4px 18px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Unweighted GPA (4.0 scale)" value={form.gpa} onChange={v => set('gpa', v)} placeholder="3.9" type="number" step="0.01" min="0" max="4.0" />
            <Field label="Weighted GPA (5.0 scale)" value={form.gpa_weighted} onChange={v => set('gpa_weighted', v)} placeholder="4.3" type="number" step="0.01" min="0" max="5.0" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="SAT Score" value={form.sat} onChange={v => set('sat', v)} placeholder="1400" type="number" min="400" max="1600" />
            <Field label="ACT Score" value={form.act_score} onChange={v => set('act_score', v)} placeholder="32" type="number" min="1" max="36" />
          </div>
          <ECPicker
            entries={form.ec_entries}
            onChange={ec_entries => setForm(f => ({ ...f, ec_entries }))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Career Interests</label>
            <textarea
              value={form.career_interests}
              onChange={e => set('career_interests', e.target.value)}
              placeholder="e.g. Software engineering at a startup, medicine, environmental law..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      </details>

      {/* Skip Ahead — gated on having a major picked */}
      <button
        type="button"
        onClick={onSkipAhead}
        disabled={!canSkip}
        style={{
          alignSelf: 'center',
          background: 'transparent',
          border: 'none',
          padding: '6px 10px',
          fontSize: 13,
          fontWeight: 600,
          color: canSkip ? 'var(--color-text-muted)' : 'var(--color-border)',
          cursor: canSkip ? 'pointer' : 'not-allowed',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 3,
        }}
        title={canSkip ? 'Skip preferences and jump to target schools' : 'Pick an intended major first'}
      >
        Skip ahead — I&apos;ll set preferences later
      </button>
    </div>
  )
}

// ─── Step 3: Preferences ─────────────────────────────────────────────────────
function StepPreferences({ form, togglePref, onSkip }: { form: FormData; togglePref: (key: 'desired_climate' | 'school_size_pref' | 'school_type_pref' | 'distance_pref', value: string, exclusiveValues: string[]) => void; onSkip: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <button
        type="button"
        onClick={onSkip}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 12,
          border: '1.5px dashed var(--color-border)',
          background: 'var(--color-column)',
          color: 'var(--color-text)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.15s',
        }}
      >
        <span>⏭</span>
        <span>Skip — I'm open to anything</span>
      </button>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '-12px 0 -8px', textAlign: 'center' }}>
        — or select all that apply below —
      </p>
      <OptionGroup
        label="Preferred Climate"
        options={CLIMATES}
        selected={form.desired_climate}
        onToggle={v => togglePref('desired_climate', v, ['Any'])}
      />
      <OptionGroup
        label="School Size"
        options={SIZES}
        selected={form.school_size_pref}
        onToggle={v => togglePref('school_size_pref', v, ['Any'])}
        cols={5}
      />
      <OptionGroup
        label="School Type"
        options={TYPES}
        selected={form.school_type_pref}
        onToggle={v => togglePref('school_type_pref', v, ['Either'])}
      />
      <OptionGroup
        label="Distance from Home"
        options={DISTANCES}
        selected={form.distance_pref}
        onToggle={v => togglePref('distance_pref', v, ['Anywhere'])}
      />
    </div>
  )
}

// ─── Step 4: Target Schools ───────────────────────────────────────────────────
function StepSchools({ schools, setSchools }: { schools: string[]; setSchools: (s: string[]) => void }) {
  const hints = [
    'Your dream / reach school',
    'Another reach or strong target',
    'A solid target school',
    'A school you\'re very confident about',
  ]

  function updateSchool(index: number, value: string) {
    const next = [...schools]
    next[index] = value
    setSchools(next)
  }

  function addSlot() {
    setSchools([...schools, ''])
  }

  function removeSlot(index: number) {
    setSchools(schools.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>
        <span style={{ color: '#FFD86B', fontWeight: 700 }}>Add at least one</span> to get started.
      </p>
      {schools.map((school, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={labelStyle}>
            {i === 0 ? 'School 1 — Top Choice' : `School ${i + 1}`}
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <CollegeSelect
                value={school}
                onChange={v => updateSchool(i, v)}
                placeholder={hints[i] ?? 'Search for a college…'}
              />
            </div>
            {i >= 4 && (
              <button
                type="button"
                onClick={() => removeSlot(i)}
                style={{ background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 10px', lineHeight: 1, flexShrink: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      {schools.length < 8 ? (
        <button
          type="button"
          onClick={addSlot}
          style={{
            background: 'var(--color-column)', color: 'var(--color-text-muted)',
            border: '1.5px dashed var(--color-border)', borderRadius: 8,
            padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          + Add another school
        </button>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 0', lineHeight: 1.5 }}>
          Free plan tracks up to 8 schools. You can upgrade to Pro later for unlimited.
        </div>
      )}
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function OptionGroup({
  label, options, selected, onToggle, cols,
}: {
  label: string
  options: { value: string; label: string; desc: string }[]
  selected: string[]
  onToggle: (v: string) => void
  cols?: number
}) {
  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: 10 }}>{label} <Required /></div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols ?? options.length}, 1fr)`, gap: 8 }}>
        {options.map(opt => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              style={{
                padding: '10px 8px',
                borderRadius: 10,
                border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                background: active ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'var(--color-column)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--color-primary)' : 'var(--color-text)', marginBottom: 2 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{opt.desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, onChange, required: req, ...inputProps }: {
  label: string
  onChange: (v: string) => void
  required?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label} {req && <Required />}</label>
      <input {...inputProps} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

function Required() {
  return <span style={{ color: 'var(--color-primary)', marginLeft: 2 }}>*</span>
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
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
