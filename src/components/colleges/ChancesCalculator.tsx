'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

interface Props {
  schoolName: string
  schoolSlug: string
  admissionRate: number | null   // 0-100
  sat25: number | null
  sat75: number | null
  actMidpoint: number | null
}

// ACT → SAT concordance (College Board)
const ACT_TO_SAT: Record<number, number> = {
  36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370,
  29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140,
  22: 1110, 21: 1080, 20: 1050, 19: 1020, 18: 990, 17: 960, 16: 920,
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function estimate(
  gpa: number | null,
  sat: number | null,
  admit: number | null,
  s25: number | null,
  s75: number | null,
): { chance: number; band: 'safety' | 'target' | 'reach'; notes: string[] } {
  if (admit == null) {
    return { chance: 0, band: 'reach', notes: ['Acceptance rate data unavailable for this school.'] }
  }

  const baseline = admit // 0-100
  let modifier = 0
  const notes: string[] = []

  // GPA contribution: relative to a 3.5 anchor, ±25 points across the 2.5–4.0 range.
  if (gpa != null) {
    const gpaDelta = (gpa - 3.5) * 16
    modifier += gpaDelta
    if (gpa >= 3.9) notes.push(`GPA of ${gpa.toFixed(2)} is excellent.`)
    else if (gpa >= 3.5) notes.push(`GPA of ${gpa.toFixed(2)} is solid.`)
    else if (gpa >= 3.0) notes.push(`GPA of ${gpa.toFixed(2)} is average — competitive at less selective schools.`)
    else notes.push(`GPA of ${gpa.toFixed(2)} is below average for most 4-year colleges.`)
  }

  // SAT contribution: position vs school's 25/75.
  if (sat != null && s25 != null && s75 != null) {
    const mid = (s25 + s75) / 2
    const range = Math.max(40, s75 - s25)
    const z = (sat - mid) / range // -1 ≈ 25th, +1 ≈ 75th
    const satDelta = clamp(z * 25, -30, 30)
    modifier += satDelta
    if (sat >= s75 + 40) notes.push(`SAT of ${sat} is well above the 75th percentile (${s75}).`)
    else if (sat >= s75) notes.push(`SAT of ${sat} matches the 75th percentile.`)
    else if (sat >= mid) notes.push(`SAT of ${sat} is in the upper half of admitted students.`)
    else if (sat >= s25) notes.push(`SAT of ${sat} is in the lower half of admitted students.`)
    else notes.push(`SAT of ${sat} is below the 25th percentile (${s25}).`)
  } else if (sat != null) {
    notes.push(`School test score data is limited; SAT of ${sat} factored qualitatively.`)
  }

  // Selectivity floor: very selective schools punish weak profiles harder.
  let chance = baseline + modifier
  if (admit < 20) chance = chance * 0.8 // hard ceiling for elites
  chance = clamp(Math.round(chance), 1, 99)

  let band: 'safety' | 'target' | 'reach'
  if (chance >= 70) band = 'safety'
  else if (chance >= 35) band = 'target'
  else band = 'reach'

  return { chance, band, notes }
}

export function ChancesCalculator({ schoolName, schoolSlug, admissionRate, sat25, sat75, actMidpoint }: Props) {
  const [gpa, setGpa] = useState('')
  const [sat, setSat] = useState('')
  const [act, setAct] = useState('')

  const parsedGpa = gpa ? clamp(parseFloat(gpa), 0, 5) : null
  let parsedSat: number | null = sat ? clamp(parseInt(sat, 10), 400, 1600) : null
  const parsedAct = act ? clamp(parseInt(act, 10), 1, 36) : null
  if (!parsedSat && parsedAct) parsedSat = ACT_TO_SAT[parsedAct] ?? null

  const result = useMemo(
    () => estimate(parsedGpa, parsedSat, admissionRate, sat25, sat75),
    [parsedGpa, parsedSat, admissionRate, sat25, sat75],
  )

  const ready = parsedGpa != null || parsedSat != null

  const bandLabel = result.band === 'safety' ? 'Safety' : result.band === 'target' ? 'Target' : 'Reach'
  const bandColor = result.band === 'safety' ? '#22c55e' : result.band === 'target' ? '#3b82f6' : '#f59e0b'

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <h2 className="text-2xl font-bold mb-1">Calculate your chances at {schoolName}</h2>
      <p className="text-sm text-white/60 mb-6">
        Enter your GPA and either SAT or ACT. We compare against {schoolName}&apos;s published 25th–75th percentile range.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Unweighted GPA" hint="0.0 – 4.0">
          <input
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            placeholder="e.g. 3.7"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
          />
        </Field>
        <Field label="SAT total" hint="400 – 1600">
          <input
            type="number"
            min="400"
            max="1600"
            value={sat}
            onChange={(e) => setSat(e.target.value)}
            placeholder="e.g. 1350"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
          />
        </Field>
        <Field label="ACT (optional)" hint="1 – 36, used if no SAT">
          <input
            type="number"
            min="1"
            max="36"
            value={act}
            onChange={(e) => setAct(e.target.value)}
            placeholder="e.g. 30"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-blue-400"
          />
        </Field>
      </div>

      {ready ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-white/50">Estimated chance</div>
              <div className="text-5xl font-bold mt-1" style={{ color: bandColor }}>
                {result.chance}%
              </div>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase"
              style={{ background: `${bandColor}22`, color: bandColor, border: `1px solid ${bandColor}55` }}
            >
              {bandLabel}
            </span>
          </div>

          {result.notes.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm text-white/70">
              {result.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-[11px] text-white/40">
            Estimate uses {schoolName}&apos;s published acceptance rate ({admissionRate ?? '—'}%)
            {sat25 && sat75 ? ` and SAT range ${sat25}–${sat75}` : ''}. Based on published academic data only. Essays, recommendations, and other factors also affect admission decisions.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/signup?next=${encodeURIComponent(`/dashboard?school=${schoolSlug}`)}`}
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold hover:bg-blue-400"
            >
              Get a personalized strategy →
            </Link>
            <Link
              href={`/colleges/${schoolSlug}`}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold hover:bg-white/5"
            >
              View {schoolName} profile
            </Link>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-white/40">Enter at least your GPA or test score to see your estimate.</p>
      )}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wide text-white/50 mb-1.5">{label}</div>
      {children}
      <div className="text-[10px] text-white/30 mt-1">{hint}</div>
    </label>
  )
}
