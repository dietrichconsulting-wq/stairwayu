import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { mapRichResult, RICH_FIELDS } from '@/lib/services/collegeScorecard'
import { exploreSchema, parseBody } from '@/lib/validations'
import { getCipCodes } from '@/lib/majorCipMap'
import { scoreProgramStrength } from '@/lib/services/programStrength'

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json'
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY

// Live Scorecard API sort fields (fallback path)
const SCORECARD_SORT_FIELDS: Record<string, string> = {
  net_cost: 'latest.cost.avg_net_price.public',
  grad_rate: 'latest.completion.rate_suppressed.4yr',
  earnings: 'latest.earnings.10_yrs_after_entry.median',
  sat: 'latest.admissions.sat_scores.average.overall',
}

// Local `colleges` table sort columns (primary path)
const LOCAL_SORT_COLUMNS: Record<string, string> = {
  net_cost: 'avg_net_price',
  grad_rate: 'grad_rate_4yr',
  earnings: 'median_earnings_10yr',
  sat: 'avg_sat',
}

// Mapped-result keys for the final in-memory sort (applies to every path)
const RESULT_SORT_KEYS: Record<string, string> = {
  net_cost: 'avgNetPrice',
  grad_rate: 'gradRate4yr',
  earnings: 'medianEarnings10yr',
  sat: 'avgSAT',
  program_strength: 'programStrengthScore',
  major_completions: 'programCompletions',
  major_earnings: 'programEarnings1yr',
}

interface ExploreParams {
  regionIds: number[]
  cipCodes: string[]
  page: number
  perPage: number
  sort: string
  sortDir: string
}

/** Map a `colleges` row to the same shape mapRichResult() produces. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbRow(row: any) {
  return {
    id: row.ipeds_id,
    name: row.name,
    city: row.city,
    state: row.state,
    url: row.url ?? null,
    control: row.control,
    isPublic: row.is_public,
    localeCode: row.locale ?? null,
    regionId: row.region_id ?? null,
    admissionRate: row.admission_rate ?? null,
    avgSAT: row.avg_sat ?? null,
    sat25: row.sat_25 ?? null,
    sat75: row.sat_75 ?? null,
    actMidpoint: row.act_midpoint ?? null,
    tuitionInState: row.tuition_in_state ?? null,
    tuitionOutOfState: row.tuition_out_of_state ?? null,
    avgNetPrice: row.avg_net_price ?? null,
    netPriceByIncome: row.net_price_by_income ?? {
      '0-30k': null, '30-48k': null, '48-75k': null, '75-110k': null, '110k+': null,
    },
    costOfAttendance: row.cost_of_attendance ?? null,
    enrollment: row.enrollment ?? null,
    retentionRate: row.retention_rate ?? null,
    gradRate4yr: row.grad_rate_4yr ?? row.grad_rate_overall ?? null,
    medianEarnings6yr: row.median_earnings_6yr ?? null,
    medianEarnings10yr: row.median_earnings_10yr ?? null,
    _dataSource: 'local',
  }
}

/**
 * Primary path: serve Explore from the local `colleges` (+ `college_programs`)
 * tables, refreshed monthly by the ingest job. Returns null when local data
 * isn't usable yet (table empty, migration 038 not applied, or ingest hasn't
 * re-run with program data) so the caller can fall back to the live API.
 */
async function exploreFromLocal(
  supabase: SupabaseClient,
  { regionIds, cipCodes, page, perPage, sort, sortDir }: ExploreParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | null> {
  const wantPrograms = cipCodes.length > 0

  if (wantPrograms) {
    // Inner join: only schools offering a bachelor's program in the major.
    // Cap matches the live path's 15-page / 1500-school ceiling.
    let q = supabase
      .from('colleges')
      .select('*, college_programs!inner(cip_code, title, completions, earnings_1yr, earnings_4yr)')
      .in('college_programs.cip_code', cipCodes)
      .limit(1500)
    if (regionIds.length) q = q.in('region_id', regionIds)

    const { data, error } = await q
    // Empty also covers the pre-ingest state where college_programs has no rows.
    if (error || !data || data.length === 0) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => {
      const base = mapDbRow(row)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const programs: any[] = row.college_programs || []
      const best = programs.reduce(
        (a, b) => ((b?.completions || 0) > (a?.completions || 0) ? b : a),
        programs[0],
      )
      return {
        ...base,
        programCompletions: best?.completions || 0,
        programEarnings1yr: best?.earnings_1yr ?? null,
        programEarnings4yr: best?.earnings_4yr ?? null,
        programCipTitle: best?.title ?? null,
      }
    })
  }

  // No major: one page, sorted and paginated in the database.
  let q = supabase.from('colleges').select('*')
  if (regionIds.length) q = q.in('region_id', regionIds)
  const sortCol = LOCAL_SORT_COLUMNS[sort]
  if (sortCol) {
    q = q.order(sortCol, { ascending: sortDir === 'asc', nullsFirst: false })
  } else {
    q = q.order('popularity', { ascending: false })
  }
  q = q.range(page * perPage, page * perPage + perPage - 1)

  const { data, error } = await q
  if (error || !data || data.length === 0) return null
  // Migration applied but ingest not yet re-run: new columns are all null,
  // which would degrade cost/region display — use the live API instead.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (data.every((r: any) => r.region_id == null && r.cost_of_attendance == null)) return null

  return data.map(mapDbRow)
}

/** Fallback path: the original live College Scorecard API query. */
async function exploreFromScorecard(
  { regionIds, cipCodes, page, perPage, sort, sortDir }: ExploreParams,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[] | NextResponse> {
  const wantPrograms = cipCodes.length > 0
  const fields = wantPrograms
    ? RICH_FIELDS + ',latest.programs.cip_4_digit'
    : RICH_FIELDS

  const params = new URLSearchParams({
    api_key: API_KEY!,
    fields,
    'school.degrees_awarded.predominant__range': '3..4',
    'latest.student.size__range': '500..',
  })

  // NOTE: SAT range filter removed intentionally. Many schools (all UCs, test-optional
  // schools) don't report SAT data to the Scorecard, so filtering by SAT range excludes
  // them entirely. Instead, the admission chance calculator handles SAT-based relevance
  // client-side, and results are sorted by Stairway Ranking when a major is selected.

  if (regionIds.length) {
    params.set('school.region_id', regionIds.join(','))
  }

  if (wantPrograms) {
    params.set('latest.programs.cip_4_digit.code', cipCodes.join(','))
    params.set('latest.programs.cip_4_digit.credential.level', '3')
  }

  const isClientSort = sort === 'major_earnings' || sort === 'major_completions' || sort === 'program_strength'
  if (!isClientSort) {
    const sortField = SCORECARD_SORT_FIELDS[sort] || SCORECARD_SORT_FIELDS.sat
    params.set('sort', `${sortField}:${sortDir === 'asc' ? 'asc' : 'desc'}`)
  }

  // When filtering by major, the result set is small (typically <300) but the
  // Scorecard API caps at 100/page. Fetch all pages so no schools are missed.
  // Without a major filter, use standard single-page fetch.
  let allRaw: Record<string, unknown>[] = []
  let total = 0

  if (wantPrograms) {
    // First page
    params.set('per_page', '100')
    params.set('page', '0')
    const res = await fetch(`${BASE_URL}?${params}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Scorecard API error', details: text }, { status: 502 })
    }
    const data = await res.json()
    allRaw = data.results || []
    total = data.metadata?.total ?? allRaw.length

    // Fetch remaining pages in parallel if needed (cap at 15 pages / 1500 schools)
    if (total > 100) {
      const pages = Math.min(Math.ceil(total / 100), 15)
      const fetches = []
      for (let p = 1; p < pages; p++) {
        const pageParams = new URLSearchParams(params)
        pageParams.set('page', String(p))
        fetches.push(
          fetch(`${BASE_URL}?${pageParams}`, { signal: AbortSignal.timeout(12000) })
            .then(r => r.ok ? r.json() : null)
        )
      }
      const pageResults = await Promise.all(fetches)
      for (const pr of pageResults) {
        if (pr?.results) allRaw = allRaw.concat(pr.results)
      }
    }
  } else {
    params.set('per_page', String(perPage))
    params.set('page', String(page))
    const res = await fetch(`${BASE_URL}?${params}`, { signal: AbortSignal.timeout(12000) })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Scorecard API error', details: text }, { status: 502 })
    }
    const data = await res.json()
    allRaw = data.results || []
  }

  return allRaw.map((r: Record<string, unknown>) => {
    const base = mapRichResult(r)
    if (!base) return null

    if (wantPrograms) {
      const programs = (r['latest.programs.cip_4_digit'] as Array<Record<string, unknown>>) || []
      const matching = programs.filter(
        (p: Record<string, unknown>) =>
          cipCodes.includes(p.code as string) &&
          (p.credential as Record<string, unknown>)?.level === 3
      )
      if (matching.length) {
        const best = matching.reduce((a: Record<string, unknown>, b: Record<string, unknown>) =>
          (((b.counts as Record<string, unknown>)?.ipeds_awards1 as number) || 0) >
          (((a.counts as Record<string, unknown>)?.ipeds_awards1 as number) || 0) ? b : a
        )
        const counts = best.counts as Record<string, unknown> | undefined
        const earnings = best.earnings as Record<string, Record<string, unknown>> | undefined
        return {
          ...base,
          programCompletions: (counts?.ipeds_awards1 as number) || 0,
          programEarnings1yr: (earnings?.['1_yr']?.overall_median_earnings as number) || null,
          programEarnings4yr: (earnings?.['4_yr']?.overall_median_earnings as number) || null,
          programCipTitle: (best.title as string) || null,
        }
      }
    }
    return base
  }).filter(Boolean)
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawParams = Object.fromEntries(searchParams.entries())
  const parsed = parseBody(exploreSchema, rawParams)
  if ('error' in parsed) return parsed.error
  const { regions, major, page, perPage, sort, sortDir } = parsed.data

  const exploreParams: ExploreParams = {
    regionIds: regions
      ? regions.split(',').filter(s => s.trim() !== '').map(Number).filter(Number.isFinite)
      : [],
    cipCodes: major ? getCipCodes(major) : [],
    page,
    perPage,
    sort,
    sortDir,
  }
  const hasMajor = exploreParams.cipCodes.length > 0

  try {
    // Local-first: the colleges/college_programs tables refreshed monthly by
    // the ingest job. Falls back to the live Scorecard API until those tables
    // are populated (or if the local query fails).
    let results = await exploreFromLocal(supabase, exploreParams)

    if (!results) {
      if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
      const live = await exploreFromScorecard(exploreParams)
      if (live instanceof NextResponse) return live
      results = live
    }

    // Compute program strength scores for all results
    results = scoreProgramStrength(results, hasMajor)

    // Final in-memory sort (nulls last) so both data paths behave identically
    const sortKey = RESULT_SORT_KEYS[sort] || 'avgSAT'
    const dir = sortDir === 'asc' ? 1 : -1
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    results.sort((a: any, b: any) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      return (va - vb) * dir
    })

    return NextResponse.json({ results, total: results.length, page: 0 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from College Scorecard' }, { status: 502 })
  }
}
