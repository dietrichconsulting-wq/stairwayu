// @ts-nocheck
/**
 * Shared College Scorecard ingestion logic.
 * Used by both:
 *   - scripts/ingest-colleges.mjs (one-time CLI run)
 *   - src/app/api/cron/ingest-colleges/route.ts (monthly Vercel cron)
 *
 * Idempotent. Upserts on ipeds_id. Preserves existing slugs.
 */
import { createClient } from '@supabase/supabase-js'

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY
const PER_PAGE = 100

const FIELDS = [
  'id',
  'school.name', 'school.city', 'school.state', 'school.school_url', 'school.ownership',
  'school.locale', 'school.region_id',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.act_scores.midpoint.cumulative',
  'latest.cost.tuition.in_state', 'latest.cost.tuition.out_of_state',
  'latest.cost.avg_net_price.public', 'latest.cost.avg_net_price.private',
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  'latest.cost.attendance.academic_year',
  'latest.student.size',
  'latest.student.retention_rate.four_year.full_time',
  'latest.completion.rate_suppressed.4yr',
  'latest.completion.rate_suppressed.overall',
  'latest.earnings.10_yrs_after_entry.median',
  'latest.earnings.6_yrs_after_entry.median',
  'latest.programs.cip_4_digit',
].join(',')

function slugify(name: string, ipedsId: string) {
  const base = String(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
  return base || `school-${ipedsId}`
}

const pct = (x: any) => (x == null ? null : Math.round(x * 100))
const int = (x: any) => (x == null ? null : Math.round(x))

function mapRow(r: any) {
  const schoolType = Number(r['school.ownership'])
  const isPublic = schoolType === 1
  const cr25 = r['latest.admissions.sat_scores.25th_percentile.critical_reading']
  const cr75 = r['latest.admissions.sat_scores.75th_percentile.critical_reading']
  const m25  = r['latest.admissions.sat_scores.25th_percentile.math']
  const m75  = r['latest.admissions.sat_scores.75th_percentile.math']
  const enrollment = r['latest.student.size'] || null

  // Net price by income bracket — same keys mapRichResult() emits
  const prefix = isPublic ? 'public' : 'private'
  const np = (bracket: string) => r[`latest.cost.net_price.${prefix}.by_income_level.${bracket}`] ?? null

  return {
    ipeds_id: String(r.id),
    name: r['school.name'],
    city: r['school.city'] || null,
    state: r['school.state'] || null,
    url: r['school.school_url'] || null,
    control: isPublic ? 'Public' : (schoolType === 2 ? 'Private Nonprofit' : 'Private For-Profit'),
    is_public: isPublic,
    locale: r['school.locale'] != null ? Number(r['school.locale']) : null,
    region_id: r['school.region_id'] != null ? Number(r['school.region_id']) : null,
    admission_rate: pct(r['latest.admissions.admission_rate.overall']),
    avg_sat: int(r['latest.admissions.sat_scores.average.overall']),
    sat_25: (cr25 && m25) ? cr25 + m25 : null,
    sat_75: (cr75 && m75) ? cr75 + m75 : null,
    act_midpoint: r['latest.admissions.act_scores.midpoint.cumulative'] || null,
    tuition_in_state: r['latest.cost.tuition.in_state'] || null,
    tuition_out_of_state: r['latest.cost.tuition.out_of_state'] || null,
    avg_net_price: isPublic
      ? (r['latest.cost.avg_net_price.public']  || null)
      : (r['latest.cost.avg_net_price.private'] || null),
    net_price_by_income: {
      '0-30k':   np('0-30000'),
      '30-48k':  np('30001-48000'),
      '48-75k':  np('48001-75000'),
      '75-110k': np('75001-110000'),
      '110k+':   np('110001-plus'),
    },
    cost_of_attendance: r['latest.cost.attendance.academic_year'] ?? null,
    enrollment,
    retention_rate: pct(r['latest.student.retention_rate.four_year.full_time']),
    grad_rate_4yr:  pct(r['latest.completion.rate_suppressed.4yr']),
    grad_rate_overall: pct(r['latest.completion.rate_suppressed.overall']),
    median_earnings_10yr: r['latest.earnings.10_yrs_after_entry.median'] || null,
    median_earnings_6yr:  r['latest.earnings.6_yrs_after_entry.median']  || null,
    popularity: enrollment || 0,
  }
}

/**
 * Extract bachelor's-level (credential level 3) program rows for the
 * `college_programs` table. One row per (school, CIP-4 code); when the API
 * returns multiple level-3 entries for a code, keep the highest-completions
 * one (same rule the Explore page used against the live API).
 */
function mapPrograms(r: any) {
  const ipedsId = String(r.id)
  const programs = (r['latest.programs.cip_4_digit'] as any[]) || []
  const byCode = new Map<string, any>()
  for (const p of programs) {
    if (Number(p?.credential?.level) !== 3 || !p?.code) continue
    const row = {
      ipeds_id: ipedsId,
      cip_code: String(p.code),
      title: p.title || null,
      completions: p.counts?.ipeds_awards1 ?? null,
      earnings_1yr: p.earnings?.['1_yr']?.overall_median_earnings ?? null,
      earnings_4yr: p.earnings?.['4_yr']?.overall_median_earnings ?? null,
    }
    const prev = byCode.get(row.cip_code)
    if (!prev || (row.completions || 0) > (prev.completions || 0)) byCode.set(row.cip_code, row)
  }
  return [...byCode.values()]
}

async function fetchPage(page: number) {
  const params = new URLSearchParams({
    api_key: SCORECARD_KEY!,
    fields: FIELDS,
    per_page: String(PER_PAGE),
    page: String(page),
    'school.degrees_awarded.predominant__range': '3..4',
    'school.operating': '1',
    'latest.student.size__range': '500..',
  })
  const res = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools.json?${params}`)
  if (!res.ok) throw new Error(`Scorecard ${res.status} on page ${page}`)
  return res.json() as Promise<{ metadata: { total: number }, results: any[] }>
}

export interface IngestOptions {
  /** Cap total pages fetched (smoke testing). */
  limitPages?: number
  /** Stop early after this many seconds (Vercel cron has a 5-min ceiling). */
  maxSeconds?: number
}

export interface IngestResult {
  pagesFetched: number
  totalUpserted: number
  durationMs: number
  finished: boolean
}

export async function ingestColleges(opts: IngestOptions = {}): Promise<IngestResult> {
  if (!SCORECARD_KEY) throw new Error('COLLEGE_SCORECARD_API_KEY missing')
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase env missing')

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

  // Pull existing slugs once so we never regenerate a published slug.
  const { data: existing } = await sb.from('colleges').select('ipeds_id, slug')
  const slugByIpeds = new Map<string, string>()
  const usedSlugs = new Set<string>()
  for (const row of existing || []) {
    slugByIpeds.set(row.ipeds_id, row.slug)
    usedSlugs.add(row.slug)
  }

  const started = Date.now()
  const limitPages = opts.limitPages ?? Infinity
  const maxMs = (opts.maxSeconds ?? 270) * 1000

  let page = 0
  let totalPages = Infinity
  let totalUpserted = 0
  let finished = false

  while (page < Math.min(totalPages, limitPages)) {
    if (Date.now() - started > maxMs) break
    const data = await fetchPage(page)
    totalPages = Math.ceil(data.metadata.total / PER_PAGE)
    const validResults = (data.results || []).filter((r: any) => r['school.name'])
    const mapped = validResults.map(mapRow)

    // Slug resolution: keep existing, otherwise generate + dedupe.
    for (const r of mapped as any[]) {
      const known = slugByIpeds.get(r.ipeds_id)
      if (known) {
        r.slug = known
      } else {
        let slug = slugify(r.name, r.ipeds_id)
        if (usedSlugs.has(slug)) slug = `${slug}-${r.ipeds_id}`
        usedSlugs.add(slug)
        slugByIpeds.set(r.ipeds_id, slug)
        r.slug = slug
      }
      r.data_year = new Date().getFullYear()
    }

    const { error } = await sb.from('colleges').upsert(mapped as any[], { onConflict: 'ipeds_id' })
    if (error) throw error

    // Program rows reference colleges via FK, so upsert after the parent batch
    // and only for schools that made it into `mapped`.
    const programRows = validResults.flatMap(mapPrograms)
    if (programRows.length) {
      const { error: progError } = await sb
        .from('college_programs')
        .upsert(programRows, { onConflict: 'ipeds_id,cip_code' })
      if (progError) throw progError
    }
    totalUpserted += mapped.length
    page += 1
    if (page >= totalPages) finished = true
  }

  return {
    pagesFetched: page,
    totalUpserted,
    durationMs: Date.now() - started,
    finished,
  }
}
