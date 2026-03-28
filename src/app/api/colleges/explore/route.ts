// @ts-nocheck
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapRichResult, RICH_FIELDS } from '@/lib/services/collegeScorecard'

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
  const satMin = searchParams.get('satMin')
  const satMax = searchParams.get('satMax')
  const regions = searchParams.get('regions') // comma-separated region IDs
  const page = parseInt(searchParams.get('page') || '0')
  const perPage = Math.min(parseInt(searchParams.get('perPage') || '30'), 60)
  const sort = searchParams.get('sort') || 'sat'
  const sortDir = searchParams.get('sortDir') || 'desc'

  if (!API_KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const params = new URLSearchParams({
    api_key: API_KEY,
    fields: RICH_FIELDS,
    per_page: String(perPage),
    page: String(page),
    'school.degrees_awarded.predominant__range': '3..4', // bachelor's+
    'latest.student.size__range': '500..', // filter tiny schools
  })

  // SAT range filter
  if (satMin || satMax) {
    const min = satMin || '400'
    const max = satMax || '1600'
    params.set('latest.admissions.sat_scores.average.overall__range', `${min}..${max}`)
  }

  // Region filter
  if (regions) {
    params.set('school.region_id', regions)
  }

  // Sort
  const sortField = SORT_FIELDS[sort] || SORT_FIELDS.sat
  params.set('sort', `${sortField}:${sortDir === 'asc' ? 'asc' : 'desc'}`)

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Scorecard API error', details: text }, { status: 502 })
    }

    const data = await res.json()
    const results = (data.results || []).map(mapRichResult).filter(Boolean)
    const total = data.metadata?.total ?? results.length

    return NextResponse.json({ results, total, page })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch from College Scorecard' }, { status: 502 })
  }
}
