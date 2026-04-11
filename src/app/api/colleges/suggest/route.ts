import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapRichResult, RICH_FIELDS } from '@/lib/services/collegeScorecard'
import { calculateChance } from '@/lib/services/admissionChance'

const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json'
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY

export async function GET(req: Request) {
  try {
    // ── Authentication ──
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // ── Fetch user profile ──
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // ── Fetch user's existing colleges to exclude ──
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
        .filter((id: string | null): id is string => id != null && id.trim() !== '')
    )
    const excludedNames = new Set(
      userColleges
        .map((uc: { college_id: string | null; college_name: string }) => uc.college_name?.toLowerCase())
        .filter(Boolean) as string[]
    )

    // ── Build SAT/GPA range for query ──
    const satMin = profile.sat ? Math.max(400, profile.sat - 100) : undefined
    const satMax = profile.sat ? Math.min(1600, profile.sat + 100) : undefined
    const hasBasicStats = profile.sat || (profile.gpa && profile.gpa >= 2.5)

    if (!hasBasicStats) {
      return NextResponse.json({
        error: 'Profile incomplete',
        message: 'SAT score or GPA required for suggestions',
      }, { status: 400 })
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // ── Query College Scorecard API ──
    const params = new URLSearchParams({
      api_key: API_KEY,
      fields: RICH_FIELDS,
      per_page: '50', // Fetch more to account for exclusions
      'school.degrees_awarded.predominant__range': '3..4', // bachelor's+
      'latest.student.size__range': '500..', // filter tiny schools
      sort: 'latest.admissions.sat_scores.average.overall:desc',
    })

    // SAT range filter
    if (satMin && satMax) {
      params.set('latest.admissions.sat_scores.average.overall__range', `${satMin}..${satMax}`)
    }

    let scoreResults = []
    try {
      const res = await fetch(`${BASE_URL}?${params}`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        const text = await res.text()
        return NextResponse.json(
          { error: 'Scorecard API error', details: text },
          { status: 502 }
        )
      }

      const data = await res.json()
      scoreResults = (data.results || []).map(mapRichResult).filter(Boolean)
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to fetch from College Scorecard' },
        { status: 502 }
      )
    }

    // ── Filter out user's existing colleges and map to suggestions ──
    const candidates = scoreResults
      .filter((school: any) => {
        const isExcludedById = excludedIds.has(school.id)
        const isExcludedByName = excludedNames.has(school.name.toLowerCase())
        return !isExcludedById && !isExcludedByName
      })
      .slice(0, 12) // Take top 12 candidates to calculate chances

    // ── Calculate admission chances for each school ──
    const suggestions = candidates
      .map((school: any) => {
        const chanceResult = calculateChance(
          profile.sat,
          profile.gpa,
          school,
          profile.act_score,
          profile.gpa_weighted,
          profile.ec_entries
        )

        if (!chanceResult) return null

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
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.chance - a.chance) // Sort by chance (best first)

    // ── Bucket by category (safety/target/reach) ──
    const results = suggestions.slice(0, 8) // Return top 8

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Suggest API error:', err)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}
