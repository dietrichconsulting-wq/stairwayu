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
  desired_climate: string
  school_size_pref: string
  school_type_pref: string
  distance_pref: string
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
    desired_climate: '',
    school_size_pref: '',
    school_type_pref: '',
    distance_pref: '',
    schools: ['', '', '', ''], // start with 4 slots visible
  })

  function set(key: keyof FormData, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function canAdvance() {
    if (step === 0) return form.display_name.trim().length > 0 && form.home_state.length > 0
    if (step === 1) return form.proposed_major.trim().length > 0
    if (step === 2) return form.desired_climate.length > 0 && form.school_size_pref.length > 0 && form.school_type_pref.length > 0 && form.distance_pref.length > 0
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
        ec_entries: form.ec_entries.filter(e => e.name.trim()) || null,
        career_interests: form.career_interests || null,
        desired_climate: form.desired_climate || null,
        school_size_pref: form.school_size_pref || null,
        school_type_pref: form.school_type_pref || null,
        distance_pref: form.distance_pref || null,
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
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
          Stairway U
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {step === 0 && "Let's get to know you"}
          {step === 1 && 'Tell us about your academics'}
          {step === 2 && 'What are you looking for?'}
          {step === 3 && 'Which schools are you eyeing?'}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
          {step === 0 && 'This helps us personalize your dashboard and roadmap.'}
          {step === 1 && 'Be honest — this powers your AI strategy and school fit analysis.'}
          {step === 2 && 'These preferences help us match you to the right schools.'}
          {step === 3 && "Add up to 9 schools. You can always change these later."}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i < step ? 'var(--color-primary)' : i === step ? 'var(--color-primary)' : 'var(--color-column)',
              border: i === step ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: i <= step ? '#fff' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 700,
              opacity: i > step ? 0.4 : 1,
              transition: 'all 0.2s',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === step ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: i > step ? 0.4 : 1 }}>
              {s}
            </span>
          </div>
        ))}
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
              {step === 1 && <StepAcademics form={form} set={set} setForm={setForm} />}
              {step === 2 && <StepPreferences form={form} set={set} />}
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
              Continue →
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
function StepAcademics({ form, set, setForm }: { form: FormData; set: (k: keyof FormData, v: string) => void; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Unweighted GPA (4.0 scale)" value={form.gpa} onChange={v => set('gpa', v)} placeholder="3.9" type="number" step="0.01" min="0" max="4.0" />
        <Field label="Weighted GPA (5.0 scale)" value={form.gpa_weighted} onChange={v => set('gpa_weighted', v)} placeholder="4.3" type="number" step="0.01" min="0" max="5.0" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="SAT Score" value={form.sat} onChange={v => set('sat', v)} placeholder="1400" type="number" min="400" max="1600" />
        <Field label="ACT Score" value={form.act_score} onChange={v => set('act_score', v)} placeholder="32" type="number" min="1" max="36" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Intended Major <span style={{ color: 'var(--color-primary)', marginLeft: 2 }}>*</span></label>
        <MajorSelect value={form.proposed_major} onChange={v => set('proposed_major', v)} />
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
  )
}

// ─── Step 3: Preferences ─────────────────────────────────────────────────────
function StepPreferences({ form, set }: { form: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <OptionGroup
        label="Preferred Climate"
        options={CLIMATES}
        value={form.desired_climate}
        onSelect={v => set('desired_climate', v)}
      />
      <OptionGroup
        label="School Size"
        options={SIZES}
        value={form.school_size_pref}
        onSelect={v => set('school_size_pref', v)}
        cols={5}
      />
      <OptionGroup
        label="School Type"
        options={TYPES}
        value={form.school_type_pref}
        onSelect={v => set('school_type_pref', v)}
      />
      <OptionGroup
        label="Distance from Home"
        options={DISTANCES}
        value={form.distance_pref}
        onSelect={v => set('distance_pref', v)}
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
        You can search and add more schools later. Even adding one is enough to get started.
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
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function OptionGroup({
  label, options, value, onSelect, cols,
}: {
  label: string
  options: { value: string; label: string; desc: string }[]
  value: string
  onSelect: (v: string) => void
  cols?: number
}) {
  return (
    <div>
      <div style={{ ...labelStyle, marginBottom: 10 }}>{label} <Required /></div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols ?? options.length}, 1fr)`, gap: 8 }}>
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            style={{
              padding: '10px 8px',
              borderRadius: 10,
              border: value === opt.value ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: value === opt.value ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)' : 'var(--color-column)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: value === opt.value ? 'var(--color-primary)' : 'var(--color-text)', marginBottom: 2 }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{opt.desc}</div>
          </button>
        ))}
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
