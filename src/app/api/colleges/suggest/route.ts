import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapRichResult, RICH_FIELDS } from '@/lib/services/collegeScorecard'
import { calculateChance } from '@/lib/services/admissionChance'
import { getCipCodes } from '@/lib/majorCipMap'
import { scoreProgramStrength, stairwayRanking } from '@/lib/services/programStrength'

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json'
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY

function fitScore(
  chance: number,
  avgSAT: number | null,
  studentSAT: number | null,
  programStrengthScore: number | null,
  hasMajor: boolean,
) {
  // Prefer realistic-but-interesting schools, not only the easiest admits.
  const chanceFit = Math.max(0, 100 - Math.abs(chance - 45) * 1.45)
  const satFit = studentSAT && avgSAT
    ? Math.max(0, 100 - Math.abs(avgSAT - studentSAT) / 2.5)
    : 55
  const programFit = programStrengthScore ?? 50

  return hasMajor
    ? chanceFit * 0.42 + satFit * 0.18 + programFit * 0.40
    : chanceFit * 0.68 + satFit * 0.32
}

function bestMatchingProgram(raw: Record<string, unknown>, cipCodes: string[]) {
  const programs = (raw['latest.programs.cip_4_digit'] as Array<Record<string, unknown>>) || []
  const matching = programs.filter((p) => {
    const credential = p.credential as Record<string, unknown> | undefined
    return cipCodes.includes(p.code as string) && credential?.level === 3
  })

  if (matching.length === 0) return null

  return matching.reduce((a, b) => {
    const aCounts = a.counts as Record<string, unknown> | undefined
    const bCounts = b.counts as Record<string, unknown> | undefined
    return ((bCounts?.ipeds_awards1 as number) || 0) > ((aCounts?.ipeds_awards1 as number) || 0) ? b : a
  })
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: userColleges = [], error: collegesError } = await supabase
      .from('user_colleges')
      .select('college_name, college_id')
      .eq('user_id', user.id)

    if (collegesError) {
      return NextResponse.json({ error: 'Failed to fetch user colleges' }, { status: 500 })
    }

    const excludedIds = new Set(
      userColleges
        .map((uc: { college_id: string | null; college_name: string }) => uc.college_id)
        .filter((id: string | null): id is string => id != null && id.trim() !== ''),
    )
    const excludedNames = new Set(
      userColleges
        .map((uc: { college_id: string | null; college_name: string }) => uc.college_name?.toLowerCase())
        .filter(Boolean) as string[],
    )

    const satMin = profile.sat ? Math.max(400, profile.sat - 180) : undefined
    const satMax = profile.sat ? Math.min(1600, profile.sat + 180) : undefined
    const hasBasicStats = profile.sat || (profile.gpa && profile.gpa >= 2.5)
    const intendedMajor = typeof profile.proposed_major === 'string' && profile.proposed_major !== 'Undecided'
      ? profile.proposed_major.trim()
      : ''
    const cipCodes = intendedMajor ? getCipCodes(intendedMajor) : []
    const hasMajor = cipCodes.length > 0

    if (!hasBasicStats) {
      return NextResponse.json({
        error: 'Profile incomplete',
        message: 'SAT score or GPA required for suggestions',
      }, { status: 400 })
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const params = new URLSearchParams({
      api_key: API_KEY,
      fields: hasMajor ? `${RICH_FIELDS},latest.programs.cip_4_digit` : RICH_FIELDS,
      per_page: '100',
      page: '0',
      'school.degrees_awarded.predominant__range': '3..4',
      'latest.student.size__range': '500..',
      sort: 'latest.admissions.sat_scores.average.overall:desc',
    })

    // Use a wider SAT pool; chance + SAT proximity are ranked after fetch.
    if (satMin && satMax) {
      params.set('latest.admissions.sat_scores.average.overall__range', `${satMin}..${satMax}`)
    }

    if (hasMajor) {
      params.set('latest.programs.cip_4_digit.code', cipCodes.join(','))
      params.set('latest.programs.cip_4_digit.credential.level', '3')
    }

    let rawResults: Record<string, unknown>[] = []
    try {
      const res = await fetch(`${BASE_URL}?${params}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json(
          { error: 'Scorecard API error', details: text },
          { status: 502 },
        )
      }

      const data = await res.json()
      rawResults = data.results || []

      // Program queries often exceed one Scorecard page; fetch enough to make
      // program-strength scoring meaningful without slowing the dashboard badly.
      if (hasMajor) {
        const total = data.metadata?.total ?? rawResults.length
        const pages = Math.min(Math.ceil(total / 100), 8)
        if (pages > 1) {
          const fetches = []
          for (let p = 1; p < pages; p++) {
            const pageParams = new URLSearchParams(params)
            pageParams.set('page', String(p))
            fetches.push(
              fetch(`${BASE_URL}?${pageParams}`, { signal: AbortSignal.timeout(10000) })
                .then(r => r.ok ? r.json() : null),
            )
          }
          const pageResults = await Promise.all(fetches)
          for (const pageData of pageResults) {
            if (pageData?.results) rawResults = rawResults.concat(pageData.results)
          }
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch from College Scorecard' },
        { status: 502 },
      )
    }

    const scoreResults = rawResults.map((raw) => {
      const base = mapRichResult(raw)
      if (!base) return null

      if (!hasMajor) return base

      const best = bestMatchingProgram(raw, cipCodes)
      if (!best) return base

      const counts = best.counts as Record<string, unknown> | undefined
      const earnings = best.earnings as Record<string, Record<string, unknown>> | undefined
      return {
        ...base,
        programCompletions: (counts?.ipeds_awards1 as number) || 0,
        programEarnings1yr: (earnings?.['1_yr']?.overall_median_earnings as number) || null,
        programCipTitle: (best.title as string) || null,
      }
    }).filter((school): school is any => Boolean(school))

    const scoredResults = scoreProgramStrength(scoreResults, hasMajor)

    const candidates = scoredResults
      .filter((school: any) => {
        const isExcludedById = excludedIds.has(school.id)
        const isExcludedByName = excludedNames.has(school.name.toLowerCase())
        return !isExcludedById && !isExcludedByName
      })
      .slice(0, 80)

    const suggestions = candidates
      .map((school: any) => {
        const chanceResult = calculateChance(
          profile.sat,
          profile.gpa,
          school,
          profile.act_score,
          profile.gpa_weighted,
          profile.ec_entries,
        )

        if (!chanceResult) return null

        const programStrengthScore = school.programStrengthScore ?? null
        return {
          schoolName: school.name,
          schoolId: school.id,
          chance: chanceResult.chance,
          insights: chanceResult.insights,
          admissionRate: school.admissionRate,
          avgSAT: school.avgSAT,
          sat25: school.sat25,
          sat75: school.sat75,
          actMidpoint: school.actMidpoint || null,
          avgNetPrice: school.avgNetPrice || null,
          tuitionInState: school.tuitionInState || null,
          tuitionOutOfState: school.tuitionOutOfState || null,
          schoolState: school.state || null,
          programStrengthScore,
          programStrengthGrade: stairwayRanking(programStrengthScore),
          programCompletions: school.programCompletions ?? null,
          programCipTitle: school.programCipTitle ?? null,
          suggestedMajor: intendedMajor || null,
          suggestionScore: fitScore(
            chanceResult.chance,
            school.avgSAT ?? null,
            profile.sat ?? null,
            programStrengthScore,
            hasMajor,
          ),
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.suggestionScore - a.suggestionScore)

    return NextResponse.json({ results: suggestions.slice(0, 8) })
  } catch (err) {
    console.error('Suggest API error:', err)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 },
    )
  }
}
