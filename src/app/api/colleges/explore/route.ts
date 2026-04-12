import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapRichResult, RICH_FIELDS } from '@/lib/services/collegeScorecard'
import { exploreSchema, parseBody } from '@/lib/validations'
import { getCipCodes } from '@/lib/majorCipMap'

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json'
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY

const SORT_FIELDS: Record<string, string> = {
  net_cost: 'latest.cost.avg_net_price.public',
  grad_rate: 'latest.completion.rate_suppressed.4yr',
  earnings: 'latest.earnings.10_yrs_after_entry.median',
  sat: 'latest.admissions.sat_scores.average.overall',
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawParams = Object.fromEntries(searchParams.entries())
  const parsed = parseBody(exploreSchema, rawParams)
  if ('error' in parsed) return parsed.error
  const { satMin, satMax, regions, major, page, perPage, sort, sortDir } = parsed.data

  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const cipCodes = major ? getCipCodes(major) : []
  const wantPrograms = cipCodes.length > 0
  const fields = wantPrograms
    ? RICH_FIELDS + ',latest.programs.cip_4_digit'
    : RICH_FIELDS

  const params = new URLSearchParams({
    api_key: API_KEY,
    fields,
    per_page: String(perPage),
    page: String(page),
    'school.degrees_awarded.predominant__range': '3..4',
    'latest.student.size__range': '500..',
  })

  if (satMin || satMax) {
    const min = satMin ?? 400
    const max = satMax ?? 1600
    params.set('latest.admissions.sat_scores.average.overall__range', `${min}..${max}`)
  }

  if (regions) {
    params.set('school.region_id', regions)
  }

  if (wantPrograms) {
    params.set('latest.programs.cip_4_digit.code', cipCodes.join(','))
    params.set('latest.programs.cip_4_digit.credential.level', '3')
  }

  const isMajorSort = sort === 'major_earnings' || sort === 'major_completions'
  if (!isMajorSort) {
    const sortField = SORT_FIELDS[sort] || SORT_FIELDS.sat
    params.set('sort', `${sortField}:${sortDir === 'asc' ? 'asc' : 'desc'}`)
  }

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Scorecard API error', details: text }, { status: 502 })
    }

    const data = await res.json()
    let results = (data.results || []).map((r: Record<string, unknown>) => {
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

    if (isMajorSort && wantPrograms) {
      if (sort === 'major_completions') {
        results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const ca = (a.programCompletions as number) || 0
          const cb = (b.programCompletions as number) || 0
          return sortDir === 'asc' ? ca - cb : cb - ca
        })
      } else {
        results.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
          const ea = (a.programEarnings1yr as number) || 0
          const eb = (b.programEarnings1yr as number) || 0
          return sortDir === 'asc' ? ea - eb : eb - ea
        })
      }
    }

    const total = data.metadata?.total ?? results.length

    return NextResponse.json({ results, total, page })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch from College Scorecard' }, { status: 502 })
  }
}
