import { NextResponse } from 'next/server'
import { searchSchema, parseBody } from '@/lib/validations'

const FIELDS = 'id,school.name,school.city,school.state,latest.cost.attendance.academic_year,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,latest.student.size'

interface ScorecardResult {
  id: number
  'school.name': string
  'school.city': string
  'school.state': string
  'latest.cost.attendance.academic_year'?: number | null
  'latest.cost.tuition.in_state'?: number | null
  'latest.cost.tuition.out_of_state'?: number | null
  'latest.student.size'?: number | null
}

// Well-known schools that the Scorecard API fails to return for common queries.
// Maps lowercase query fragments → Scorecard IDs to inject via direct lookup.
const BOOST_IDS: Record<string, number[]> = {
  'texas': [228778, 228723, 227757],           // UT Austin, Texas A&M, Texas Tech
  'university of texas': [228778],              // UT Austin
  'ut': [228778],                               // UT Austin
  'ut austin': [228778],
  'a&m': [228723],                              // Texas A&M
  'tamu': [228723],
  'georgia': [139959, 139931],                  // UGA, Georgia Tech
  'uga': [139959],
  'georgia tech': [139931],
  'michigan': [170976, 171100],                 // U of Michigan, Michigan State
  'stanford': [243744],
  'mit': [166683],
  'harvard': [166027],
  'yale': [130794],
  'princeton': [186131],
  'columbia': [190150],
  'ucla': [110662],
  'usc': [123961],
  'berkeley': [110635],
  'uc berkeley': [110635],
  'cal': [110635],
  'florida': [134130, 136172],                  // UF, FSU
  'uf': [134130],
  'fsu': [136172],
  'ohio state': [204796],
  'osu': [204796],
  'penn state': [214777],
  'virginia': [234076, 233921],                 // UVA, Virginia Tech
  'uva': [234076],
  'carolina': [199120, 218663],                 // UNC, South Carolina
  'unc': [199120],
  'duke': [198419],
  'oregon': [209551],                           // U of Oregon
  'alabama': [100751],
  'auburn': [100858],
  'clemson': [217882],
  'wisconsin': [240444],
  'illinois': [145637],
  'purdue': [243780],
  'iowa': [153658],
  'minnesota': [174066],
  'colorado': [126614],
  'washington': [236948],                        // U of Washington
  'uw': [236948],
  'notre dame': [152080],
  'rice': [227757],
  'emory': [139658],
  'vanderbilt': [221999],
  'northwestern': [147767],
  'cornell': [190415],
  'brown': [217156],
  'dartmouth': [182670],
  'penn': [215062],
  'upenn': [215062],
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = parseBody(searchSchema, Object.fromEntries(searchParams.entries()))
  if ('error' in parsed) return NextResponse.json([])
  const q = parsed.data.q

  const key = process.env.COLLEGE_SCORECARD_API_KEY
  const base = 'https://api.data.gov/ed/collegescorecard/v1/schools'

  try {
    // Check if we need to boost specific well-known schools the API misses
    const qLowerTrimmed = q.toLowerCase().trim()
    const boostIds = BOOST_IDS[qLowerTrimmed] ?? []

    // Run queries in parallel: name prefix + full-text + optional boost by ID
    const fetches: Promise<Response>[] = [
      fetch(`${base}?api_key=${key}&school.name=${encodeURIComponent(q)}&fields=${FIELDS}&per_page=50`),
      fetch(`${base}?api_key=${key}&school.search=${encodeURIComponent(q)}&fields=${FIELDS}&per_page=50`),
    ]
    if (boostIds.length > 0) {
      fetches.push(
        fetch(`${base}?api_key=${key}&id=${boostIds.join(',')}&fields=${FIELDS}`)
      )
    }

    const responses = await Promise.all(fetches)
    const jsons = await Promise.all(responses.map(r => r.json()))

    const raw: ScorecardResult[] = []
    for (const j of jsons) {
      for (const r of (j.results ?? [])) {
        raw.push(r)
      }
    }

    // Deduplicate by id
    const seen = new Set<number>()
    const deduped: ScorecardResult[] = []
    for (const r of raw) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        deduped.push(r)
      }
    }

    const qLower = q.toLowerCase().replace(/^the\s+/, '')
    const qWords = qLower.split(/\s+/)
    const results = deduped
      // Filter out tiny/vocational schools when query is broad (single word)
      .filter(r => {
        const size = r['latest.student.size']
        if (q.includes(' ')) return true
        return size == null || size >= 1000
      })
      // Sort by relevance: boosted IDs > exact/prefix match > contains all words > larger schools
      .sort((a, b) => {
        // Boosted schools always come first
        const aBoosted = boostIds.includes(a.id) ? 0 : 1
        const bBoosted = boostIds.includes(b.id) ? 0 : 1
        if (aBoosted !== bBoosted) return aBoosted - bBoosted

        const aName = (a['school.name'] as string).toLowerCase().replace(/^the\s+/, '')
        const bName = (b['school.name'] as string).toLowerCase().replace(/^the\s+/, '')

        // Exact match (ignoring "The" prefix)
        const aExact = aName === qLower ? 0 : 1
        const bExact = bName === qLower ? 0 : 1
        if (aExact !== bExact) return aExact - bExact

        // Starts with query (ignoring "The")
        const aStarts = aName.startsWith(qLower) ? 0 : 1
        const bStarts = bName.startsWith(qLower) ? 0 : 1
        if (aStarts !== bStarts) return aStarts - bStarts

        // Contains all query words in order
        const aAll = qWords.every(w => aName.includes(w)) ? 0 : 1
        const bAll = qWords.every(w => bName.includes(w)) ? 0 : 1
        if (aAll !== bAll) return aAll - bAll

        // Larger schools first (better relevance signal)
        const aSize = a['latest.student.size'] ?? 0
        const bSize = b['latest.student.size'] ?? 0
        return bSize - aSize
      })
      .slice(0, 15)
      .map(r => ({
        id: r.id,
        name: r['school.name'],
        city: r['school.city'],
        state: r['school.state'],
        costAttendance: r['latest.cost.attendance.academic_year'] ?? null,
        tuitionInState: r['latest.cost.tuition.in_state'] ?? null,
        tuitionOutOfState: r['latest.cost.tuition.out_of_state'] ?? null,
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
