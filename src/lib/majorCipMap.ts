/**
 * Maps StairwayU major names → College Scorecard CIP 4-digit codes.
 *
 * CIP (Classification of Instructional Programs) codes are the federal
 * taxonomy for academic fields.  The Scorecard API nests program-level
 * data under `latest.programs.cip_4_digit` using these codes.
 *
 * Each major maps to one or more 4-digit CIP codes (zero-padded strings).
 * Multiple codes let us catch related programs — e.g. "Computer Science"
 * matches both 1101 (CS general) and 1107 (CS specific).
 *
 * Source: https://nces.ed.gov/ipeds/cipcode/
 */

export const MAJOR_TO_CIP: Record<string, string[]> = {
  'Accounting':               ['5203'],
  'Aerospace Engineering':    ['1402'],
  'African American Studies':  ['0502'],
  'Agriculture':              ['0101', '0102'],
  'Animal Science':           ['0109'],
  'Anthropology':             ['4502'],
  'Architecture':             ['0402'],
  'Art & Design':             ['5004', '5006'],
  'Biochemistry':             ['2602'],
  'Biology':                  ['2601'],
  'Biomedical Engineering':   ['1405'],
  'Business Administration':  ['5201', '5202'],
  'Chemical Engineering':     ['1407'],
  'Chemistry':                ['4005'],
  'Civil Engineering':        ['1408'],
  'Communications':           ['0901', '0909'],
  'Computer Engineering':     ['1409'],
  'Computer Science':         ['1101', '1107'],
  'Criminal Justice':         ['4301', '4304'],
  'Data Science':             ['1101', '2706', '3070'],
  'Dental Hygiene':           ['5106'],
  'Economics':                ['4506'],
  'Education':                ['1301', '1312', '1313'],
  'Electrical Engineering':   ['1410'],
  'English':                  ['2301'],
  'Environmental Design':     ['0403'],
  'Environmental Science':    ['0301', '0302'],
  'Exercise Science':         ['3105'],
  'Film & Media Studies':     ['0907', '5006'],
  'Finance':                  ['5208'],
  'Foreign Languages':        ['1601', '1609'],
  'Graphic Design':           ['5004'],
  'Health Sciences':          ['5102'],
  'History':                  ['5401'],
  'Hospitality Management':   ['5209'],
  'Human Resources':          ['5210'],
  'Industrial Engineering':   ['1435'],
  'Information Systems':      ['1104', '5212'],
  'Information Technology':   ['1104'],
  'International Relations':  ['4509'],
  'Journalism':               ['0904'],
  'Kinesiology':              ['3105'],
  'Law / Pre-Law':            ['2201', '4509', '5401'],
  'Liberal Arts':             ['2401'],
  'Linguistics':              ['1601'],
  'Management':               ['5201'],
  'Marketing':                ['5214'],
  'Mathematics':              ['2701'],
  'Mechanical Engineering':   ['1419'],
  'Medicine / Pre-Med':       ['2601', '2602', '5102'],
  'Music':                    ['5009'],
  'Nursing':                  ['5138'],
  'Nutrition':                ['5131'],
  'Performing Arts':          ['5005', '5009'],
  'Pharmacy / Pre-Pharmacy':  ['5120'],
  'Philosophy':               ['3801'],
  'Physics':                  ['4008'],
  'Political Science':        ['4510'],
  'Psychology':               ['4201'],
  'Public Health':            ['5122'],
  'Public Policy':            ['4404'],
  'Real Estate':              ['5215'],
  'Religious Studies':        ['3804'],
  'Social Work':              ['4407'],
  'Sociology':                ['4511'],
  'Software Engineering':     ['1101', '1107'],
  'Spanish':                  ['1609'],
  'Sports Management':        ['3105', '5209'],
  'Statistics':               ['2705'],
  'Supply Chain Management':  ['5202'],
  'Theater':                  ['5005'],
  'Urban Planning':           ['0403', '4404'],
  'Veterinary / Pre-Vet':    ['0118', '5109'],
  'Undecided':                [],
}

/**
 * Given a major name (from MajorSelect), return matching CIP 4-digit codes.
 * Falls back to fuzzy prefix match if not found in the map.
 */
export function getCipCodes(major: string): string[] {
  if (!major || major === 'Undecided') return []

  // Direct map lookup
  const codes = MAJOR_TO_CIP[major]
  if (codes?.length) return codes

  // Fuzzy: check if any key starts with or contains the input
  const lower = major.toLowerCase()
  for (const [key, vals] of Object.entries(MAJOR_TO_CIP)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return vals
    }
  }

  return []
}
