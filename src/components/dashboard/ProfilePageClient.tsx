'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSeedTasks, useTasks } from '@/hooks/useTasks'
import { MajorSelect } from '@/components/MajorSelect'
import { CollegeSelect } from '@/components/CollegeSelect'
import { createClient } from '@/lib/supabase/client'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export function ProfilePageClient({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId)
  const { data: tasks = [] } = useTasks(userId)
  const updateProfile = useUpdateProfile(userId)
  const seedTasks = useSeedTasks(userId)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    display_name: '', gpa: '', sat: '', proposed_major: '', home_state: '',
    school1_name: '', school2_name: '', school3_name: '', school4_name: '',
  })

  const [weeklyNudge, setWeeklyNudge] = useState(true)
  const [lastNudgeSent, setLastNudgeSent] = useState<string | null>(null)
  const [nudgeSaving, setNudgeSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        gpa: profile.gpa?.toString() ?? '',
        sat: profile.sat?.toString() ?? '',
        proposed_major: profile.proposed_major ?? '',
        home_state: profile.home_state ?? '',
        school1_name: profile.school1_name ?? '',
        school2_name: profile.school2_name ?? '',
        school3_name: profile.school3_name ?? '',
        school4_name: profile.school4_name ?? '',
      })

      // Load email preferences
      const supabase = createClient()
      supabase
        .from('email_preferences')
        .select('weekly_nudge, last_nudge_sent')
        .eq('user_id', userId)
        .single()
        .then(({ data }: { data: { weekly_nudge: boolean; last_nudge_sent: string | null } | null }) => {
          if (data) {
            setWeeklyNudge(data.weekly_nudge)
            setLastNudgeSent(data.last_nudge_sent)
          }
        })
    }
  }, [profile, userId])

  async function handleToggleNudge(enabled: boolean) {
    setWeeklyNudge(enabled)
    setNudgeSaving(true)
    const supabase = createClient()
    await supabase
      .from('email_preferences')
      .upsert({ user_id: userId, weekly_nudge: enabled }, { onConflict: 'user_id' })
    setNudgeSaving(false)
  }

  async function handleSave() {
    await updateProfile.mutateAsync({
      display_name: form.display_name || null,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      sat: form.sat ? parseInt(form.sat) : null,
      proposed_major: form.proposed_major || null,
      home_state: form.home_state || null,
      school1_name: form.school1_name || null,
      school2_name: form.school2_name || null,
      school3_name: form.school3_name || null,
      school4_name: form.school4_name || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 600 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48, marginBottom: 16, borderRadius: 10 }} />
        ))}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Profile</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Update your stats and schools here — every tool in the app uses this info.
      </p>

      <div className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Academic Info</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Display Name" value={form.display_name} onChange={v => setForm(f => ({ ...f, display_name: v }))} placeholder="Your name" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Home State</label>
            <select value={form.home_state} onChange={e => setForm(f => ({ ...f, home_state: e.target.value }))} style={inputStyle}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Field label="GPA" type="number" step="0.01" min="0" max="5.0" value={form.gpa} onChange={v => setForm(f => ({ ...f, gpa: v }))} placeholder="3.9" />
          <Field label="SAT Score" type="number" min="400" max="1600" value={form.sat} onChange={v => setForm(f => ({ ...f, sat: v }))} placeholder="1400" />
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Intended Major</label>
            <MajorSelect value={form.proposed_major} onChange={v => setForm(f => ({ ...f, proposed_major: v }))} />
          </div>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Target Schools</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(['school1_name', 'school2_name', 'school3_name', 'school4_name'] as const).map((key, i) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>School {i + 1}{i === 0 ? ' (Top choice)' : ''}</label>
              <CollegeSelect value={form[key]} onChange={v => setForm(f => ({ ...f, [key]: v }))} placeholder="Search for a college…" />
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Email Notifications</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Get a personalized weekly recap of upcoming tasks and scholarship deadlines.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Weekly email updates</span>
            {lastNudgeSent && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Last email sent: {new Date(lastNudgeSent).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={() => handleToggleNudge(!weeklyNudge)}
            disabled={nudgeSaving}
            aria-pressed={weeklyNudge}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: nudgeSaving ? 'default' : 'pointer',
              background: weeklyNudge ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              opacity: nudgeSaving ? 0.6 : 1,
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: weeklyNudge ? 23 : 3, width: 18, height: 18,
              borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={updateProfile.isPending} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          {updateProfile.isPending ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
        </button>

        {tasks.length === 0 && (
          <button
            onClick={() => seedTasks.mutate()}
            disabled={seedTasks.isPending}
            style={{ background: 'var(--color-column)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            {seedTasks.isPending ? 'Seeding…' : '+ Seed Default Tasks (29)'}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function Field({ label, style: _style, onChange, ...inputProps }: { label: string; style?: React.CSSProperties; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>{label}</label>
      <input {...inputProps} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
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
  fontSize: 13,
  outline: 'none',
  width: '100%',
}
