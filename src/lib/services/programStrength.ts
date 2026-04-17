/**
 * Program Strength Score (0–100)
 *
 * A composite score approximating Niche-style "Best Colleges for [Major]"
 * rankings using only public College Scorecard / IPEDS data.
 *
 * Each factor is percentile-ranked within the current result set so the
 * score is relative to the search context (SAT range, region, etc.).
 *
 * Factors & weights (when a major is selected):
 *   Graduation rate      20%   — institutional quality
 *   Retention rate       10%   — student satisfaction proxy
 *   Selectivity          15%   — inverse admission rate
 *   Program share        25%   — completions / enrollment (% majoring)
 *   Program earnings     20%   — 1yr post-grad earnings for major
 *   School earnings      10%   — 10yr median (fallback breadth signal)
 *
 * When NO major is selected the program-specific factors (share + program
 * earnings = 45%) are redistributed proportionally across the school-level
 * factors, giving a pure "school quality" ranking.
 */

export interface ScorableSchool {
  gradRate4yr: number | null
  retentionRate: number | null
  admissionRate: number | null       // 0–100 (already multiplied)
  enrollment: number | null
  medianEarnings10yr: number | null
  programCompletions?: number | null
  programEarnings1yr?: number | null
}

interface FactorDef {
  key: string
  weight: number
  extract: (s: ScorableSchool) => number | null
  /** If true, lower raw values are better (e.g. admission rate → more selective) */
  invert?: boolean
}

const FACTORS_WITH_MAJOR: FactorDef[] = [
  {
    key: 'gradRate',
    weight: 0.20,
    extract: (s) => s.gradRate4yr,
  },
  {
    key: 'retention',
    weight: 0.10,
    extract: (s) => s.retentionRate,
  },
  {
    key: 'selectivity',
    weight: 0.15,
    extract: (s) => s.admissionRate,
    invert: true, // lower admission rate = more selective = better
  },
  {
    key: 'programShare',
    weight: 0.25,
    extract: (s) => {
      const c = s.programCompletions
      const e = s.enrollment
      if (c == null || c === 0 || e == null || e === 0) return null
      return (c / e) * 100 // percentage
    },
  },
  {
    key: 'programEarnings',
    weight: 0.20,
    extract: (s) => s.programEarnings1yr ?? null,
  },
  {
    key: 'schoolEarnings',
    weight: 0.10,
    extract: (s) => s.medianEarnings10yr,
  },
]

const FACTORS_NO_MAJOR: FactorDef[] = [
  {
    key: 'gradRate',
    weight: 0.36,
    extract: (s) => s.gradRate4yr,
  },
  {
    key: 'retention',
    weight: 0.18,
    extract: (s) => s.retentionRate,
  },
  {
    key: 'selectivity',
    weight: 0.27,
    extract: (s) => s.admissionRate,
    invert: true,
  },
  {
    key: 'schoolEarnings',
    weight: 0.19,
    extract: (s) => s.medianEarnings10yr,
  },
]

/**
 * Compute percentile rank (0–1) for a value within a sorted array.
 * Uses the "percentage of values below" method.
 */
function percentileRank(value: number, sorted: number[]): number {
  if (sorted.length <= 1) return 0.5
  let below = 0
  for (const v of sorted) {
    if (v < value) below++
    else break
  }
  return below / (sorted.length - 1)
}

/**
 * Score an array of schools on Program Strength.
 * Returns the same array with `programStrengthScore` (0–100, 1 decimal) added.
 *
 * Schools missing too many factors get `null` instead of a score.
 */
export function scoreProgramStrength<T extends ScorableSchool>(
  schools: T[],
  hasMajor: boolean,
): (T & { programStrengthScore: number | null })[] {
  if (schools.length === 0) return []

  const factors = hasMajor ? FACTORS_WITH_MAJOR : FACTORS_NO_MAJOR

  // Build sorted value arrays for percentile ranking, one per factor
  const sortedValues: Record<string, number[]> = {}
  for (const f of factors) {
    const vals: number[] = []
    for (const s of schools) {
      const v = f.extract(s)
      if (v != null) vals.push(v)
    }
    vals.sort((a, b) => a - b)
    sortedValues[f.key] = vals
  }

  return schools.map((school) => {
    let totalWeight = 0
    let weightedSum = 0
    let factorsUsed = 0

    for (const f of factors) {
      const raw = f.extract(school)
      if (raw == null) continue

      const sorted = sortedValues[f.key]
      if (sorted.length < 3) continue // not enough data to rank meaningfully

      let pctile = percentileRank(raw, sorted)
      if (f.invert) pctile = 1 - pctile

      weightedSum += pctile * f.weight
      totalWeight += f.weight
      factorsUsed++
    }

    // Require at least 2 factors to produce a score
    if (factorsUsed < 2 || totalWeight === 0) {
      return { ...school, programStrengthScore: null }
    }

    // Normalize by actual weight used (handles missing data gracefully)
    const score = Math.round((weightedSum / totalWeight) * 1000) / 10 // 0–100, 1 decimal
    return { ...school, programStrengthScore: Math.min(100, Math.max(0, score)) }
  })
}

/**
 * Map a Stairway Ranking composite score (0–100) to a letter (A+ through C).
 *
 * Tiers are skewed up because every school in the set is an accredited
 * 4-year program with 500+ enrollment — the floor is "ranked lower in
 * this major," not "failing." No D/F letters.
 *
 * Letters are RELATIVE to the current result set (percentile-based), so
 * a school's Stairway Ranking may shift when filters change. Surface this
 * in the tooltip in the UI.
 */
export function stairwayRanking(score: number | null | undefined): string | null {
  if (score == null) return null
  if (score >= 90) return 'A+'
  if (score >= 78) return 'A'
  if (score >= 66) return 'A-'
  if (score >= 54) return 'B+'
  if (score >= 40) return 'B'
  if (score >= 25) return 'B-'
  return 'C'
}
