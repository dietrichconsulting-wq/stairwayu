/**
 * Curated Early Decision / Early Action admit rates for top schools.
 *
 * Sourced from each school's publicly-reported Common Data Set (CDS),
 * most recently available cycle at time of compilation. Figures are
 * rounded to whole percentage points. Where a school offers multiple
 * early plans (e.g. ED I + ED II, or ED + EA), numbers are blended or
 * represent the restrictive/binding round — see `notes` per school.
 *
 * This data is for context only. Admit rates fluctuate yearly and
 * applicant pools differ materially between rounds (recruited athletes,
 * legacies, and development cases are heavily concentrated in ED).
 *
 * Keyed by IPEDS unitid (stable, numeric, matches our colleges table).
 */
export type EarlyPlan = 'ED' | 'EA' | 'REA' | 'SCEA'

export interface EarlyAdmitData {
  /** Primary early plan offered. REA/SCEA are non-binding restrictive. */
  plan: EarlyPlan
  /** Admit rate for the early round, as a percentage (e.g. 12 = 12%). */
  earlyRate: number
  /** Regular Decision admit rate, as a percentage. */
  regularRate: number
  /** Most recent CDS cycle this data reflects (e.g. '2023–2024'). */
  cycle: string
  /** Optional notes for transparency (e.g. 'ED I + ED II blended'). */
  notes?: string
}

/**
 * Rates are approximate — verify against the school's latest CDS
 * before citing in any formal advice.
 */
export const EARLY_ADMIT_RATES: Record<string, EarlyAdmitData> = {
  // Ivies & Ivy+
  '166027': { plan: 'REA', earlyRate: 8,  regularRate: 3,  cycle: '2023–2024', notes: 'Harvard REA (restrictive, non-binding).' },
  '130794': { plan: 'SCEA', earlyRate: 10, regularRate: 4,  cycle: '2023–2024', notes: 'Yale SCEA (single-choice, non-binding).' },
  '186131': { plan: 'REA', earlyRate: 13, regularRate: 4,  cycle: '2023–2024', notes: 'Princeton SCEA (reinstated).' },
  '243744': { plan: 'REA', earlyRate: 8,  regularRate: 3,  cycle: '2023–2024', notes: 'Stanford REA (restrictive, non-binding).' },
  '166683': { plan: 'EA',  earlyRate: 5,  regularRate: 4,  cycle: '2023–2024', notes: 'MIT EA (non-restrictive).' },
  '198419': { plan: 'ED',  earlyRate: 13, regularRate: 4,  cycle: '2023–2024' },
  '182670': { plan: 'ED',  earlyRate: 17, regularRate: 5,  cycle: '2023–2024' },
  '217156': { plan: 'ED',  earlyRate: 13, regularRate: 4,  cycle: '2023–2024' },
  '190150': { plan: 'ED',  earlyRate: 12, regularRate: 3,  cycle: '2023–2024' },
  '190415': { plan: 'ED',  earlyRate: 17, regularRate: 7,  cycle: '2023–2024' },
  '215062': { plan: 'ED',  earlyRate: 13, regularRate: 5,  cycle: '2023–2024', notes: 'UPenn ED.' },

  // Top privates
  '147767': { plan: 'ED',  earlyRate: 20, regularRate: 6,  cycle: '2023–2024', notes: 'Northwestern ED.' },
  '144050': { plan: 'ED',  earlyRate: 12, regularRate: 5,  cycle: '2023–2024', notes: 'UChicago ED I+II blended; also offers EA.' },
  '221999': { plan: 'ED',  earlyRate: 16, regularRate: 5,  cycle: '2023–2024', notes: 'Vanderbilt ED I+II blended.' },
  '227757': { plan: 'ED',  earlyRate: 15, regularRate: 8,  cycle: '2023–2024' },
  '139658': { plan: 'ED',  earlyRate: 30, regularRate: 11, cycle: '2023–2024', notes: 'Emory ED I+II blended.' },
  '152080': { plan: 'REA', earlyRate: 20, regularRate: 11, cycle: '2023–2024', notes: 'Notre Dame REA (non-binding).' },
  '179867': { plan: 'ED',  earlyRate: 27, regularRate: 10, cycle: '2023–2024', notes: 'WashU ED I+II blended.' },
  '162928': { plan: 'ED',  earlyRate: 24, regularRate: 6,  cycle: '2023–2024', notes: 'Johns Hopkins ED I+II blended.' },
  '168148': { plan: 'ED',  earlyRate: 35, regularRate: 8,  cycle: '2023–2024', notes: 'Tufts ED I+II blended.' },
  '164924': { plan: 'ED',  earlyRate: 22, regularRate: 14, cycle: '2023–2024', notes: 'Boston College ED I+II blended; also offers EA.' },
  '131496': { plan: 'REA', earlyRate: 11, regularRate: 12, cycle: '2023–2024', notes: 'Georgetown REA (non-binding); rare case where REA rate is near RD.' },
  '193900': { plan: 'ED',  earlyRate: 20, regularRate: 7,  cycle: '2023–2024', notes: 'NYU ED I+II blended.' },

  // Top LACs
  '212911': { plan: 'ED',  earlyRate: 28, regularRate: 7,  cycle: '2023–2024', notes: 'Swarthmore ED.' },
  '164465': { plan: 'ED',  earlyRate: 28, regularRate: 7,  cycle: '2023–2024', notes: 'Amherst ED.' },
  '229115': { plan: 'ED',  earlyRate: 26, regularRate: 7,  cycle: '2023–2024', notes: 'Williams ED.' },
  '212160': { plan: 'ED',  earlyRate: 23, regularRate: 13, cycle: '2023–2024', notes: 'Pomona ED.' },
  '168342': { plan: 'ED',  earlyRate: 35, regularRate: 17, cycle: '2023–2024', notes: 'Wellesley ED I+II blended.' },
  '171100': { plan: 'ED',  earlyRate: 32, regularRate: 8,  cycle: '2023–2024', notes: 'Middlebury ED I+II blended.' },
}

export function getEarlyAdmitData(ipedsId: string | number | null | undefined): EarlyAdmitData | null {
  if (ipedsId == null) return null
  const key = String(ipedsId)
  return EARLY_ADMIT_RATES[key] ?? null
}

export const EARLY_PLAN_LABELS: Record<EarlyPlan, { short: string; long: string; blurb: string }> = {
  ED: {
    short: 'Early Decision',
    long: 'Early Decision (ED)',
    blurb: 'Binding. If admitted, you must enroll and withdraw other applications.',
  },
  EA: {
    short: 'Early Action',
    long: 'Early Action (EA)',
    blurb: 'Non-binding. Apply early, decide by May 1. Usually compatible with other EA applications.',
  },
  REA: {
    short: 'Restrictive EA',
    long: 'Restrictive Early Action (REA)',
    blurb: 'Non-binding, but you cannot apply ED or EA to most other private schools.',
  },
  SCEA: {
    short: 'Single-Choice EA',
    long: 'Single-Choice Early Action (SCEA)',
    blurb: 'Non-binding, but you cannot apply early to other private schools.',
  },
}
