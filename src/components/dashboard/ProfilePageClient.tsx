'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useUserColleges, useAddCollege, useRemoveCollege, useUpdateCollege } from '@/hooks/useUserColleges'
import { useSeedTasks, useTasks } from '@/hooks/useTasks'
import { MajorSelect } from '@/components/MajorSelect'
import { CollegeSelect } from '@/components/CollegeSelect'
import { createClient } from '@/lib/supabase/client'
import type { UserCollege, ExtracurricularEntry } from '@/lib/types/database'
import { useAchievements } from '@/hooks/useAchievements'
import { ECPicker } from '@/components/ECPicker'
import { EC_TIER_LABELS, EC_TIER_POINTS } from '@/lib/services/admissionChance'
import type { ECTier } from '@/lib/types/database'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export function ProfilePageClient({ userId }: { userId: string }) {
  const { data: profile, isLoading } = useProfile(userId)
  const { data: colleges = [], isLoading: collegesLoading } = useUserColleges(userId)
  const addCollege = useAddCollege(userId)
  const removeCollege = useRemoveCollege(userId)
  const updateCollege = useUpdateCollege(userId)
  const { data: tasks = [] } = useTasks(userId)
  const updateProfile = useUpdateProfile(userId)
  const seedTasks = useSeedTasks(userId)
  const [saved, setSaved] = useState(false)
  const { earned, locked, total: achievementTotal } = useAchievements(userId)

  const [form, setForm] = useState({
    display_name: '', gpa: '', gpa_weighted: '', sat: '', act_score: '', proposed_major: '', home_state: '',
    ec_entries: [] as ExtracurricularEntry[],
  })

  const [weeklyNudge, setWeeklyNudge] = useState(true)
  const [lastNudgeSent, setLastNudgeSent] = useState<string | null>(null)
  const [nudgeSaving, setNudgeSaving] = useState(false)

  // Referral state
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralLink, setReferralLink] = useState<string | null>(null)
  const [referralCount, setReferralCount] = useState(0)
  const [referralLoading, setReferralLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchReferralCode = useCallback(async () => {
    setReferralLoading(true)
    try {
      const supabase = createClient()

      // Ensure we have an active auth session before querying RLS-protected tables
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('Referral: no active session, retrying in 1s…')
        setTimeout(() => fetchReferralCode(), 1000)
        return
      }

      const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const randomChars = (n: number) => Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')

      // Check for existing referral code
      const { data: existing, error: selectErr } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .maybeSingle()

      if (selectErr) console.error('Referral select error:', selectErr)

      let code: string | null = existing?.referral_code ?? null

      if (!code) {
        // Generate a code like `sophia-x7k2`
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .maybeSingle()

        const rawName = profile?.display_name || 'user'
        const firstName = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'

        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = `${firstName}-${randomChars(4)}`
          const { error } = await supabase
            .from('referrals')
            .insert({ referrer_id: userId, referral_code: candidate })
          if (!error) { code = candidate; break }
          console.error(`Referral insert attempt ${attempt + 1} failed:`, error)
        }
      }

      if (code) {
        setReferralCode(code)
        setReferralLink(`https://www.stairwayu.com/signup?ref=${code}`)

        const { count } = await supabase
          .from('referral_completions')
          .select('id', { count: 'exact', head: true })
          .eq('referral_code', code)
        setReferralCount(count ?? 0)
      }
    } catch (err) {
      console.error('Referral fetch error:', err)
    }
    setReferralLoading(false)
  }, [userId])

  useEffect(() => {
    fetchReferralCode()
  }, [fetchReferralCode])

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        gpa: profile.gpa?.toString() ?? '',
        gpa_weighted: profile.gpa_weighted?.toString() ?? '',
        sat: profile.sat?.toString() ?? '',
        act_score: profile.act_score?.toString() ?? '',
        proposed_major: profile.proposed_major ?? '',
        home_state: profile.home_state ?? '',
        ec_entries: profile.ec_entries ?? [],
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
      gpa_weighted: form.gpa_weighted ? parseFloat(form.gpa_weighted) : null,
      sat: form.sat ? parseInt(form.sat) : null,
      act_score: form.act_score ? parseInt(form.act_score) : null,
      proposed_major: form.proposed_major || null,
      home_state: form.home_state || null,
      ec_entries: form.ec_entries.filter(e => e.name.trim()) || null,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading || collegesLoading) {
    return (
      <div style={{ maxWidth: 600 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48, marginBottom: 16, borderRadius: 10 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 600, flex: '1 1 600px', minWidth: 0 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Profile</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Update your stats and schools here — every tool in the app uses this info.
      </p>

      <div className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Academic Info</h2>
        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Field label="Display Name" value={form.display_name} onChange={v => setForm(f => ({ ...f, display_name: v }))} placeholder="Your name" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Home State</label>
            <select value={form.home_state} onChange={e => setForm(f => ({ ...f, home_state: e.target.value }))} style={inputStyle}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Unweighted GPA (4.0)" type="number" step="0.01" min="0" max="4.0" value={form.gpa} onChange={v => setForm(f => ({ ...f, gpa: v }))} placeholder="3.9" />
          <Field label="Weighted GPA (5.0)" type="number" step="0.01" min="0" max="5.0" value={form.gpa_weighted} onChange={v => setForm(f => ({ ...f, gpa_weighted: v }))} placeholder="4.3" />
          <Field label="SAT Score" type="number" min="400" max="1600" value={form.sat} onChange={v => setForm(f => ({ ...f, sat: v }))} placeholder="1400" />
          <Field label="ACT Score" type="number" min="1" max="36" step="1" value={form.act_score} onChange={v => setForm(f => ({ ...f, act_score: v }))} placeholder="30" />
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Intended Major</label>
            <MajorSelect value={form.proposed_major} onChange={v => setForm(f => ({ ...f, proposed_major: v }))} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <ECPicker
              entries={form.ec_entries}
              onChange={ec_entries => setForm(f => ({ ...f, ec_entries }))}
            />
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Achievements</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          {earned.length} of {achievementTotal} unlocked
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {earned.map(a => (
            <motion.div
              key={a.key}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-column))',
                border: '1.5px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))',
                borderRadius: 12,
                padding: '14px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6 }}>{a.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.3 }}>{a.description}</div>
            </motion.div>
          ))}
          {locked.map(a => (
            <div
              key={a.key}
              style={{
                background: 'var(--color-column)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 12,
                padding: '14px 12px',
                textAlign: 'center',
                opacity: 0.45,
              }}
            >
              <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 6, filter: 'grayscale(1)' }}>{a.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)' }}>{a.label}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.3 }}>{a.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Schools That Want You</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {colleges.map((college, i) => (
            <CollegeRow
              key={college.id}
              college={college}
              index={i}
              onUpdate={(name) => updateCollege.mutate({ id: college.id, name })}
              onRemove={() => removeCollege.mutate(college.id)}
            />
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>
              {colleges.length === 0 ? 'Add your first school' : 'Add another school'}
            </label>
            <CollegeSelect
              value=""
              onChange={v => { if (v) addCollege.mutate({ name: v }) }}
              placeholder="Search for a college…"
            />
          </div>
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

      {/* Subscription Management */}
      <div id="subscription" className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💳</span> Subscription
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Manage your plan, update payment info, or cancel your subscription.
        </p>
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/stripe/portal', { method: 'POST' })
              const data = await res.json()
              if (data.url) {
                window.location.href = data.url
              }
            } catch {}
          }}
          style={{
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          Manage Subscription
        </button>
      </div>

      {/* Suggest to a Friend */}
      <div id="referrals" className="card-elevated" style={{ padding: '28px 28px 32px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎁</span> Suggest to a Friend
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          Earn <strong>50 XP</strong> and <strong>7 extra days free</strong> for every friend who signs up.
        </p>

        {referralLoading ? (
          <div>
            <div className="skeleton" style={{ height: 40, borderRadius: 8, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 6 }} />
          </div>
        ) : referralLink ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                readOnly
                value={referralLink}
                style={{ ...inputStyle, flex: 1, fontSize: 12, color: 'var(--color-text-muted)', userSelect: 'all' }}
                onFocus={e => e.target.select()}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(referralLink)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch {}
                }}
                style={{
                  background: copied ? 'var(--color-primary)' : 'var(--color-column)',
                  color: copied ? '#fff' : 'var(--color-text)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {typeof navigator !== 'undefined' && typeof (navigator as { share?: unknown }).share === 'function' && (
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: 'Stairway U',
                      text: `I'm using Stairway U to plan my college apps — check it out: ${referralLink}`,
                      url: referralLink,
                    }).catch(() => {})
                  }}
                  style={{
                    background: 'var(--color-column)', color: 'var(--color-text)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: 8, padding: '0 14px', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Share
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {referralCount === 0
                ? 'Know someone applying to college? Share the link and earn XP + 7 free days.'
                : `You've referred ${referralCount} friend${referralCount === 1 ? '' : 's'} — ${referralCount * 50} XP earned 🎉`}
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Could not load referral link.</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
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

      {/* Delete Account */}
      <div className="card-elevated" style={{ padding: '28px 28px 32px', borderColor: 'var(--color-danger, #ef4444)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--color-danger, #ef4444)' }}>Delete Account</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Permanently delete your account and all data (profile, tasks, scholarships, schools). This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              background: 'none', color: 'var(--color-danger, #ef4444)',
              border: '1.5px solid var(--color-danger, #ef4444)',
              borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Delete My Account
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>
              Type <strong>delete my account</strong> to confirm:
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="delete my account"
              style={inputStyle}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={async () => {
                  setDeleting(true)
                  try {
                    const res = await fetch('/api/account/delete', { method: 'POST' })
                    if (res.ok) {
                      window.location.href = '/login'
                    } else {
                      alert('Failed to delete account. Please try again.')
                    }
                  } catch {
                    alert('Failed to delete account. Please try again.')
                  }
                  setDeleting(false)
                }}
                disabled={deleteConfirmText !== 'delete my account' || deleting}
                style={{
                  background: deleteConfirmText === 'delete my account' ? 'var(--color-danger, #ef4444)' : 'var(--color-border)',
                  color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 24px', fontWeight: 700, fontSize: 13,
                  cursor: deleteConfirmText === 'delete my account' && !deleting ? 'pointer' : 'not-allowed',
                  opacity: deleteConfirmText === 'delete my account' ? 1 : 0.5,
                }}
              >
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                style={{
                  background: 'var(--color-column)', color: 'var(--color-text)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 10, padding: '10px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* Right sidebar: EC Tier Guide */}
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      style={{
        flex: '0 0 280px', position: 'sticky', top: 24, alignSelf: 'flex-start',
      }}
    >
      <div className="card-elevated" style={{ padding: '20px 20px 24px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>How to pick a tier</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Extracurricular Activities
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16, lineHeight: 1.4 }}>
          The same activity can be any tier — it depends on <strong>your role</strong>, not the club itself.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {([1, 2, 3, 4] as ECTier[]).map(t => {
            const info = EC_TIER_LABELS[t]
            const pts = EC_TIER_POINTS[t]
            const colors = ecTierColor(t)
            return (
              <div key={t} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 12,
                  background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                  whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
                }}>
                  T{t}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                    {info.label} <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>+{pts} pts</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3, fontStyle: 'italic' }}>{info.question}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.3, marginTop: 2, opacity: 0.7 }}>{info.examples}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 14, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Example: Key Club</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              <strong>Member</strong> = T4 (1 pt)<br />
              <strong>Board member / 2+ yrs</strong> = T3 (3 pts)<br />
              <strong>President</strong> = T2 (5 pts)<br />
              <strong>International board</strong> = T1 (8 pts)
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>Example: Basketball</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              <strong>JV player</strong> = T4 (1 pt)<br />
              <strong>Varsity starter</strong> = T3 (3 pts)<br />
              <strong>Varsity + regional wins</strong> = T2 (5 pts)<br />
              <strong>Recruited D1 / All-State</strong> = T1 (8 pts)
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 8,
          background: 'color-mix(in srgb, var(--color-primary) 6%, var(--color-column))',
          border: '1px solid color-mix(in srgb, var(--color-primary) 15%, var(--color-border))',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
            Your <strong>top 5</strong> activities are scored, capped at <strong>15 pts</strong>. At selective schools (&lt;10% admit rate), ECs are weighted <strong>1.4x</strong>.
          </div>
        </div>
      </div>
    </motion.aside>
    </div>
  )
}

function CollegeRow({ college, index, onUpdate, onRemove }: {
  college: UserCollege
  index: number
  onUpdate: (name: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={labelStyle}>School {index + 1}{index === 0 ? ' (Top choice)' : ''}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {editing ? (
          <div style={{ flex: 1 }}>
            <CollegeSelect
              value={college.college_name}
              onChange={v => { if (v) onUpdate(v); setEditing(false) }}
              placeholder="Search for a college…"
            />
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            style={{ ...inputStyle, flex: 1, cursor: 'text', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>{college.college_name}</span>
            <span style={{ fontSize: 9, color: 'var(--color-text-muted)', opacity: 0.6 }}>✎</span>
          </div>
        )}
        <button
          onClick={onRemove}
          title="Remove school"
          style={{
            background: 'none', border: '1.5px solid var(--color-border)', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)', padding: '8px 10px',
            lineHeight: 1, flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
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

function ecTierColor(tier: ECTier) {
  switch (tier) {
    case 1: return { bg: 'rgba(251,191,36,0.12)', text: '#D97706', border: 'rgba(251,191,36,0.3)' }
    case 2: return { bg: 'rgba(52,211,153,0.10)', text: '#059669', border: 'rgba(52,211,153,0.25)' }
    case 3: return { bg: 'rgba(96,165,250,0.10)', text: '#2563EB', border: 'rgba(96,165,250,0.25)' }
    case 4: return { bg: 'rgba(148,163,184,0.10)', text: '#64748B', border: 'rgba(148,163,184,0.25)' }
  }
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
