'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

// ACT → SAT concordance (College Board)
const ACT_TO_SAT: Record<number, number> = {
  36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370,
  29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140,
  22: 1110, 21: 1080, 20: 1050, 19: 1020, 18: 990, 17: 960, 16: 920,
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

interface SchoolMatch {
  slug: string
  name: string
  state: string | null
  admission_rate: number | null
  sat_25: number | null
  sat_75: number | null
  avg_sat: number | null
}

function estimate(
  gpa: number | null,
  sat: number | null,
  admit: number | null,
  s25: number | null,
  s75: number | null,
) {
  if (admit == null) return { chance: 0, band: 'reach' as const }
  let mod = 0
  if (gpa != null) mod += (gpa - 3.5) * 16
  if (sat != null && s25 != null && s75 != null) {
    const mid = (s25 + s75) / 2
    const range = Math.max(40, s75 - s25)
    mod += clamp(((sat - mid) / range) * 25, -30, 30)
  }
  let chance = admit + mod
  if (admit < 20) chance *= 0.8
  chance = clamp(Math.round(chance), 1, 99)
  const band = chance >= 70 ? 'safety' : chance >= 35 ? 'target' : 'reach'
  return { chance, band: band as 'safety' | 'target' | 'reach' }
}

function useSchoolSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchoolMatch[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const sb = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )
        const { data } = await sb
          .from('colleges')
          .select('slug, name, state, admission_rate, sat_25, sat_75, avg_sat')
          .ilike('name', `%${q.trim()}%`)
          .order('popularity', { ascending: false })
          .limit(8)
        setResults((data as SchoolMatch[]) || [])
      } catch { setResults([]) }
      setLoading(false)
    }, 250)
  }, [])

  return { query, search, results, loading }
}

interface CalcProps {
  /** Show student name field and use parent-framed language. */
  parentMode?: boolean
}

export function HeroCalculator({ parentMode = false }: CalcProps) {
  const { query, search, results, loading } = useSchoolSearch()
  const [school, setSchool] = useState<SchoolMatch | null>(null)
  const [studentName, setStudentName] = useState('')
  const [gpa, setGpa] = useState('')
  const [sat, setSat] = useState('')
  const [act, setAct] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Display name: "Sarah's" or fallback
  const nameLabel = studentName.trim()
    ? `${studentName.trim()}'s`
    : parentMode ? "your child's" : 'your'

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const parsedGpa = gpa ? clamp(parseFloat(gpa) || 0, 0, 5) : null
  let parsedSat: number | null = sat ? clamp(parseInt(sat, 10) || 0, 400, 1600) : null
  const parsedAct = act ? clamp(parseInt(act, 10) || 0, 1, 36) : null
  if (!parsedSat && parsedAct) parsedSat = ACT_TO_SAT[parsedAct] ?? null

  const result = useMemo(() => {
    if (!school) return null
    return estimate(parsedGpa, parsedSat, school.admission_rate, school.sat_25, school.sat_75)
  }, [school, parsedGpa, parsedSat])

  const bandLabel = result?.band === 'safety' ? 'Safety' : result?.band === 'target' ? 'Target' : 'Reach'
  const bandColor = result?.band === 'safety' ? '#22c55e' : result?.band === 'target' ? '#3b82f6' : '#f59e0b'
  const ready = school && (parsedGpa != null || parsedSat != null)

  return (
    <div className="w-full max-w-[540px]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="mb-1 text-xs font-extrabold uppercase tracking-[0.15em] text-teal-300">
          Free Admission Calculator
        </div>
        <h2 className="mb-5 text-xl font-bold text-white">
          What are {nameLabel} real odds?
        </h2>

        {/* Student name (parent mode) */}
        {parentMode && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Student&apos;s first name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
            />
          </div>
        )}

        {/* School search */}
        <div ref={wrapRef} className="relative mb-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">
            School
          </label>
          {school ? (
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm font-semibold text-white">{school.name}</span>
              <button
                onClick={() => { setSchool(null); search('') }}
                className="ml-2 text-xs text-white/40 hover:text-white cursor-pointer border-none bg-transparent"
              >
                change
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={query}
                onChange={(e) => { search(e.target.value); setShowDropdown(true) }}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder="Search — e.g. UT Austin, Stanford"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
              />
              {showDropdown && results.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
                  {results.map((r) => (
                    <button
                      key={r.slug}
                      onClick={() => { setSchool(r); setShowDropdown(false); search('') }}
                      className="flex w-full items-center justify-between border-none bg-transparent px-3 py-2.5 text-left text-sm text-white hover:bg-white/10 cursor-pointer"
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-white/40">{r.state} · {r.admission_rate ?? '—'}%</span>
                    </button>
                  ))}
                </div>
              )}
              {loading && (
                <div className="absolute right-3 top-[38px] text-xs text-white/30">searching…</div>
              )}
            </>
          )}
        </div>

        {/* GPA + Scores */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">GPA</span>
            <input
              type="number" step="0.01" min="0" max="5" value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              placeholder="3.7"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">SAT</span>
            <input
              type="number" min="400" max="1600" value={sat}
              onChange={(e) => setSat(e.target.value)}
              placeholder="1350"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50">ACT</span>
            <input
              type="number" min="1" max="36" value={act}
              onChange={(e) => setAct(e.target.value)}
              placeholder="30"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-400"
            />
          </label>
        </div>

        {/* Result */}
        {ready && result ? (
          <div className="rounded-xl border border-white/10 bg-black/40 p-4 mb-4">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">
                  {studentName.trim()
                    ? `${studentName.trim()}'s estimated chance`
                    : parentMode ? "Your child's estimated chance" : 'Your estimated chance'}
                </div>
                <div className="text-4xl font-black mt-0.5" style={{ color: bandColor }}>
                  {result.chance}%
                </div>
              </div>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ background: `${bandColor}22`, color: bandColor, border: `1px solid ${bandColor}44` }}
              >
                {bandLabel}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-white/40">
              Based on {school.name}&apos;s {school.admission_rate ?? '—'}% acceptance rate
              {school.sat_25 && school.sat_75 ? ` and SAT range ${school.sat_25}–${school.sat_75}` : ''}.
              U.S. Dept of Education data. For guidance only.
            </p>
          </div>
        ) : !school ? (
          <p className="mb-4 text-center text-xs text-white/30">
            Search for a school to see {nameLabel} chances.
          </p>
        ) : (
          <p className="mb-4 text-center text-xs text-white/30">
            Enter {nameLabel} GPA or test score to see the estimate.
          </p>
        )}

        <Link
          href={school ? `/colleges/${school.slug}/chances` : parentMode ? '/signup?ref=parents' : '/signup'}
          className="block w-full rounded-lg bg-white py-3 text-center text-[13px] font-extrabold uppercase tracking-[0.03em] text-slate-900 no-underline hover:bg-white/90"
        >
          {ready
            ? (studentName.trim() ? `See ${studentName.trim()}'s Full Report →` : 'See Full Report →')
            : 'Start for Free →'}
        </Link>

        <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-white/30">
          <span>No credit card</span>
          <span>·</span>
          <span>Federal data only</span>
          <span>·</span>
          <span>Free forever tier</span>
        </div>
      </div>
    </div>
  )
}
