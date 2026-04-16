import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getNationalProgramGrade } from '@/lib/services/collegeScorecard'

/**
 * GET /api/colleges/grades?ipeds_id=...&cip_codes=1101,1107,...
 *
 * Returns cached Stairway Grades for the given school + CIP codes.
 * If any grades are missing from the cache, computes them in the
 * background and returns what's available now. The next request
 * will include the newly computed grades.
 *
 * Public endpoint — no auth required (grades are non-sensitive).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ipedsId = searchParams.get('ipeds_id')
  const cipCodesRaw = searchParams.get('cip_codes')

  if (!ipedsId || !cipCodesRaw) {
    return NextResponse.json(
      { error: 'ipeds_id and cip_codes are required' },
      { status: 400 },
    )
  }

  const cipCodes = cipCodesRaw.split(',').filter(Boolean).slice(0, 30)
  if (cipCodes.length === 0) {
    return NextResponse.json({ grades: {} })
  }

  // 1. Check cache
  const supabase = await createClient()
  const { data: cached } = await supabase
    .from('program_grades')
    .select('cip_code, score, grade, computed_at')
    .eq('ipeds_id', ipedsId)
    .in('cip_code', cipCodes)

  const gradeMap: Record<
    string,
    { score: number | null; grade: string | null }
  > = {}
  const cachedCodes = new Set<string>()

  for (const row of cached || []) {
    gradeMap[row.cip_code] = { score: row.score, grade: row.grade }
    cachedCodes.add(row.cip_code)
  }

  // 2. Find cache misses
  const missingCodes = cipCodes.filter((c) => !cachedCodes.has(c))

  // 3. Compute missing grades in background (don't block the response).
  //    We use waitUntil-style fire-and-forget. The grades will be in the
  //    cache by the time the next visitor hits this page.
  if (missingCodes.length > 0) {
    computeAndCacheGrades(ipedsId, missingCodes).catch(() => {
      // Swallow errors — cache misses are non-critical
    })
  }

  return NextResponse.json({ grades: gradeMap })
}

/**
 * Compute Stairway Grades for a list of CIP codes at a given school,
 * then upsert results into the program_grades cache table.
 *
 * Runs with a concurrency pool of 4 to avoid Scorecard rate limits.
 */
async function computeAndCacheGrades(
  ipedsId: string,
  cipCodes: string[],
): Promise<void> {
  const POOL_SIZE = 4
  const results: { cipCode: string; score: number | null; grade: string | null }[] = []
  let cursor = 0

  const workers = Array.from(
    { length: Math.min(POOL_SIZE, cipCodes.length) },
    async () => {
      while (true) {
        const i = cursor++
        if (i >= cipCodes.length) return
        const cip = cipCodes[i]
        const result = await getNationalProgramGrade(cip, ipedsId)
        results.push({
          cipCode: cip,
          score: result?.score ?? null,
          grade: result?.grade ?? null,
        })
      }
    },
  )
  await Promise.all(workers)

  // Upsert all results into Supabase (service client bypasses RLS)
  if (results.length === 0) return
  const serviceClient = await createServiceClient()

  const rows = results.map((r) => ({
    ipeds_id: ipedsId,
    cip_code: r.cipCode,
    score: r.score,
    grade: r.grade,
    computed_at: new Date().toISOString(),
  }))

  await serviceClient
    .from('program_grades')
    .upsert(rows, { onConflict: 'ipeds_id,cip_code' })
}
