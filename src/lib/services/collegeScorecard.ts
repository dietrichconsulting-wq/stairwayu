// @ts-nocheck
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools.json';
const API_KEY = process.env.COLLEGE_SCORECARD_API_KEY;

// All fields we care about — pulled in one request per school
const RICH_FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.type',           // 1=public, 2=private nonprofit, 3=private for-profit
  'school.locale',         // 11=city large ... 43=rural remote
  'school.region_id',
  // Admissions
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.act_scores.midpoint.cumulative',
  // Cost
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
  'latest.cost.avg_net_price.public',
  'latest.cost.avg_net_price.private',
  // Net price by income (public schools)
  'latest.cost.net_price.public.by_income_level.0-30000',
  'latest.cost.net_price.public.by_income_level.30001-48000',
  'latest.cost.net_price.public.by_income_level.48001-75000',
  'latest.cost.net_price.public.by_income_level.75001-110000',
  'latest.cost.net_price.public.by_income_level.110001-plus',
  // Net price by income (private schools)
  'latest.cost.net_price.private.by_income_level.0-30000',
  'latest.cost.net_price.private.by_income_level.30001-48000',
  'latest.cost.net_price.private.by_income_level.48001-75000',
  'latest.cost.net_price.private.by_income_level.75001-110000',
  'latest.cost.net_price.private.by_income_level.110001-plus',
  // Total cost of attendance (tuition + fees + room & board + books — sticker price)
  'latest.cost.attendance.academic_year',
  // Students
  'latest.student.size',
  'latest.student.retention_rate.four_year.full_time',
  // Completion
  'latest.completion.rate_suppressed.4yr',
  'latest.completion.rate_suppressed.overall',
  // Outcomes
  'latest.earnings.10_yrs_after_entry.median',
  'latest.earnings.6_yrs_after_entry.median',
].join(',');

const SEARCH_FIELDS = [
  'id', 'school.name', 'school.city', 'school.state',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.average.overall',
  'latest.cost.tuition.in_state',
  'latest.cost.tuition.out_of_state',
].join(',');

export { RICH_FIELDS }

export function mapRichResult(r) {
  if (!r) return null;

  const isPublic = r['school.type'] === 1;

  // SAT composite 25th/75th
  const cr25 = r['latest.admissions.sat_scores.25th_percentile.critical_reading'];
  const cr75 = r['latest.admissions.sat_scores.75th_percentile.critical_reading'];
  const m25 = r['latest.admissions.sat_scores.25th_percentile.math'];
  const m75 = r['latest.admissions.sat_scores.75th_percentile.math'];

  // Net price by income bracket
  const prefix = isPublic ? 'public' : 'private';
  const np = (bracket) => r[`latest.cost.net_price.${prefix}.by_income_level.${bracket}`] || null;

  const avgNetPrice = isPublic
    ? r['latest.cost.avg_net_price.public']
    : r['latest.cost.avg_net_price.private'];

  const gradRate = r['latest.completion.rate_suppressed.4yr'] ?? r['latest.completion.rate_suppressed.overall'];
  const retentionRate = r['latest.student.retention_rate.four_year.full_time'];

  return {
    id: String(r.id),
    name: r['school.name'],
    city: r['school.city'],
    state: r['school.state'],
    url: r['school.school_url'] || null,
    control: isPublic ? 'Public' : (r['school.type'] === 2 ? 'Private Nonprofit' : 'Private For-Profit'),
    isPublic,
    localeCode: r['school.locale'] || null,
    regionId: r['school.region_id'] || null,
    // Admissions
    admissionRate: r['latest.admissions.admission_rate.overall'] != null
      ? Math.round(r['latest.admissions.admission_rate.overall'] * 100)
      : null,
    avgSAT: r['latest.admissions.sat_scores.average.overall']
      ? Math.round(r['latest.admissions.sat_scores.average.overall'])
      : null,
    sat25: (cr25 && m25) ? cr25 + m25 : null,
    sat75: (cr75 && m75) ? cr75 + m75 : null,
    actMidpoint: r['latest.admissions.act_scores.midpoint.cumulative'] || null,
    // Cost
    tuitionInState: r['latest.cost.tuition.in_state'] || null,
    tuitionOutOfState: r['latest.cost.tuition.out_of_state'] || null,
    avgNetPrice: avgNetPrice || null,
    netPriceByIncome: {
      '0-30k':    np('0-30000'),
      '30-48k':   np('30001-48000'),
      '48-75k':   np('48001-75000'),
      '75-110k':  np('75001-110000'),
      '110k+':    np('110001-plus'),
    },
    // Total sticker cost (tuition + fees + room & board + books, before aid)
    costOfAttendance: r['latest.cost.attendance.academic_year'] || null,
    // Students & outcomes
    enrollment: r['latest.student.size'] || null,
    retentionRate: retentionRate != null ? Math.round(retentionRate * 100) : null,
    gradRate4yr: gradRate != null ? Math.round(gradRate * 100) : null,
    medianEarnings6yr: r['latest.earnings.6_yrs_after_entry.median'] || null,
    medianEarnings10yr: r['latest.earnings.10_yrs_after_entry.median'] || null,
    _dataSource: 'scorecard',
  };
}

/**
 * Extract program-level stats from Scorecard data for a specific major.
 * Looks at bachelor's-level programs matching the given CIP codes.
 *
 * @param schoolId - Scorecard UNITID
 * @param cipCodes - 4-digit CIP codes (e.g. ['5203'] for Accounting)
 * @returns { completions, earnings1yr, earnings4yr, cipTitle } or null
 */
export async function getProgramStats(schoolId: string, cipCodes: string[]) {
  if (!API_KEY || !schoolId || !cipCodes?.length) return null;

  const params = new URLSearchParams({
    api_key: API_KEY,
    id: schoolId,
    fields: 'id,latest.programs.cip_4_digit',
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const programs = data.results?.[0]?.['latest.programs.cip_4_digit'] || [];

    // Filter to bachelor's-level (credential.level === 3) matching our CIP codes
    const matching = programs.filter(
      (p) => cipCodes.includes(p.code) && p.credential?.level === 3
    );

    if (!matching.length) return null;

    // If multiple CIP codes match (e.g. CS = 1101 + 1107), pick the one
    // with the most completions — that's the main program.
    const best = matching.reduce((a, b) =>
      ((b.counts?.ipeds_awards1 || 0) > (a.counts?.ipeds_awards1 || 0)) ? b : a
    );

    const completions = best.counts?.ipeds_awards1 || 0;
    const earnings1yr = best.earnings?.['1_yr']?.overall_median_earnings || null;
    const earnings4yr = best.earnings?.['4_yr']?.overall_median_earnings || null;

    return {
      cipCode: best.code,
      cipTitle: best.title || null,
      completions,
      earnings1yr,
      earnings4yr,
    };
  } catch {
    return null;
  }
}

/** Search colleges by query string (lightweight) */
export async function searchColleges(query) {
  if (!API_KEY) return [];

  const params = new URLSearchParams({
    api_key: API_KEY,
    'school.name': query,
    fields: SEARCH_FIELDS,
    per_page: '10',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).map(r => ({
    id: String(r.id),
    name: r['school.name'],
    city: r['school.city'],
    state: r['school.state'],
    admissionRate: r['latest.admissions.admission_rate.overall'] != null
      ? Math.round(r['latest.admissions.admission_rate.overall'] * 100) : null,
    avgSAT: r['latest.admissions.sat_scores.average.overall']
      ? Math.round(r['latest.admissions.sat_scores.average.overall']) : null,
    tuitionInState: r['latest.cost.tuition.in_state'] || null,
    tuitionOutOfState: r['latest.cost.tuition.out_of_state'] || null,
  }));
}

/** Get full rich profile by Scorecard UNITID */
export async function getCollege(id) {
  if (!API_KEY) return null;

  const params = new URLSearchParams({
    api_key: API_KEY,
    id,
    fields: RICH_FIELDS,
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;

  const data = await res.json();
  return mapRichResult(data.results?.[0]);
}

/**
 * Look up a school by name — returns best match with full rich profile.
 * Returns null if not found or no API key.
 */
// Common short names / nicknames → canonical full names used by College Scorecard
const NAME_EXPANSIONS: Record<string, string> = {
  'texas':            'University of Texas at Austin',
  'ut austin':        'University of Texas at Austin',
  'ut':               'University of Texas at Austin',
  'a&m':              'Texas A&M University',
  'texas a&m':        'Texas A&M University',
  'tamu':             'Texas A&M University',
  'oregon':           'University of Oregon',
  'u of o':           'University of Oregon',
  'washington':       'University of Washington-Seattle Campus',
  'uw':               'University of Washington-Seattle Campus',
  'u of washington':  'University of Washington-Seattle Campus',
  'michigan':         'University of Michigan-Ann Arbor',
  'u of m':           'University of Michigan-Ann Arbor',
  'florida':          'University of Florida',
  'uf':               'University of Florida',
  'georgia':          'University of Georgia',
  'uga':              'University of Georgia',
  'virginia':         'University of Virginia-Main Campus',
  'uva':              'University of Virginia-Main Campus',
  'north carolina':   'University of North Carolina at Chapel Hill',
  'unc':              'University of North Carolina at Chapel Hill',
  'ohio state':       'Ohio State University-Main Campus',
  'osu':              'Ohio State University-Main Campus',
  'penn state':       'Pennsylvania State University-Main Campus',
  'psu':              'Pennsylvania State University-Main Campus',
  'colorado':         'University of Colorado Boulder',
  'cu boulder':       'University of Colorado Boulder',
  'boulder':          'University of Colorado Boulder',
  'arizona':          'University of Arizona',
  'u of a':           'University of Arizona',
  'arizona state':    'Arizona State University-Tempe',
  'asu':              'Arizona State University-Tempe',
  'purdue':           'Purdue University-Main Campus',
  'indiana':          'Indiana University-Bloomington',
  'iu':               'Indiana University-Bloomington',
  'alabama':          'University of Alabama',
  'bama':             'University of Alabama',
  'notre dame':       'University of Notre Dame',
  'vanderbilt':       'Vanderbilt University',
  'emory':            'Emory University',
  'tulane':           'Tulane University of Louisiana',
  'penn':             'University of Pennsylvania',
  'upenn':            'University of Pennsylvania',
  'ucla':             'University of California-Los Angeles',
  'usc':              'University of Southern California',
  'uci':              'University of California-Irvine',
  'uc irvine':        'University of California-Irvine',
  'ucsd':             'University of California-San Diego',
  'uc san diego':     'University of California-San Diego',
  'ucd':              'University of California-Davis',
  'uc davis':         'University of California-Davis',
  'uc berkeley':      'University of California-Berkeley',
  'berkeley':         'University of California-Berkeley',
  'cal':              'University of California-Berkeley',
  'ucsb':             'University of California-Santa Barbara',
  'uc santa barbara': 'University of California-Santa Barbara',
  'miami':            'University of Miami',
  'bu':               'Boston University',
  'bc':               'Boston College',
  'northeastern':     'Northeastern University',
  'drexel':           'Drexel University',
  'georgetown':       'Georgetown University',
  'american':         'American University',
  'gw':               'George Washington University',
  'george washington':'George Washington University',
  'rice':             'Rice University',
  'tcu':              'Texas Christian University',
  'smu':              'Southern Methodist University',
  'baylor':           'Baylor University',
  'tech':             'Texas Tech University',
  'texas tech':       'Texas Tech University',
  'ttu':              'Texas Tech University',
};

export async function lookupByName(schoolName) {
  if (!API_KEY || !schoolName) return null;

  // Expand common short names to full Scorecard names before querying.
  // Also normalize "University of X, Y" → "University of X-Y" since Scorecard
  // uses hyphens for branch campuses (e.g. "University of California-Berkeley").
  const trimmed = schoolName.trim();
  const expanded =
    NAME_EXPANSIONS[trimmed.toLowerCase()] ||
    trimmed.replace(/^(University of [A-Za-z]+),\s+/i, '$1-');


  const params = new URLSearchParams({
    api_key: API_KEY,
    'school.name': expanded,
    fields: RICH_FIELDS,
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    return mapRichResult(data.results?.[0]);
  } catch {
    return null;
  }
}

export async function batchLookup(names: string[]) {
  return Promise.all(names.map(name => lookupByName(name)));
}
