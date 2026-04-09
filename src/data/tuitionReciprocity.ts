/**
 * Regional tuition reciprocity programs.
 *
 * Each program lists the U.S. state codes whose residents may qualify for
 * in-state or reduced tuition at member institutions in OTHER member states.
 * Eligibility is NOT automatic — it depends on the specific school and major.
 * We only surface a program when BOTH the student's home state AND the
 * school's state are members of that program.
 *
 * Sources are official program websites; member state lists last verified
 * 2025. Do not modify without re-checking the source URL.
 */

export interface ReciprocityProgram {
  id: string
  name: string
  shortName: string
  url: string
  memberStates: readonly string[]
  /** Short factual sentence about the eligibility rule. */
  caveat: string
}

export const RECIPROCITY_PROGRAMS: readonly ReciprocityProgram[] = [
  {
    id: 'wue',
    name: 'Western Undergraduate Exchange',
    shortName: 'WUE',
    url: 'https://www.wiche.edu/tuition-savings/wue/',
    // https://www.wiche.edu/tuition-savings/wue/
    memberStates: ['AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'ND', 'OR', 'SD', 'UT', 'WA', 'WY'],
    caveat: 'WUE participants charge no more than 150% of in-state tuition. Each school sets its own eligible majors and may have GPA or capacity limits.',
  },
  {
    id: 'msep',
    name: 'Midwest Student Exchange Program',
    shortName: 'MSEP',
    url: 'https://msep.mhec.org/',
    // https://msep.mhec.org/
    memberStates: ['IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'WI'],
    caveat: 'MSEP guarantees no more than 150% of in-state tuition at public schools (or a 10% discount at participating privates). Each school chooses which programs participate.',
  },
  {
    id: 'acm',
    name: 'Academic Common Market',
    shortName: 'ACM',
    url: 'https://www.sreb.org/academic-common-market',
    // https://www.sreb.org/academic-common-market — SREB
    memberStates: ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV'],
    caveat: 'ACM grants in-state tuition only for specific majors that are NOT offered in your home state. You must apply through your state ACM coordinator.',
  },
  {
    id: 'nebhe',
    name: 'New England Regional Student Program (Tuition Break)',
    shortName: 'NEBHE Tuition Break',
    url: 'https://nebhe.org/tuitionbreak/',
    // https://nebhe.org/tuitionbreak/
    memberStates: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT'],
    caveat: 'NEBHE Tuition Break grants reduced tuition only for approved majors not offered (or limited) in your home state.',
  },
] as const

/**
 * Return programs where both the student's home state and the school's state
 * are members. Empty array if no overlap or if either state is missing.
 */
export function findApplicablePrograms(
  homeState: string | null | undefined,
  schoolState: string | null | undefined,
): ReciprocityProgram[] {
  if (!homeState || !schoolState) return []
  const hs = homeState.toUpperCase()
  const ss = schoolState.toUpperCase()
  if (hs === ss) return []
  return RECIPROCITY_PROGRAMS.filter(
    p => p.memberStates.includes(hs) && p.memberStates.includes(ss),
  )
}
