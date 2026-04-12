// @ts-nocheck
/**
 * College Data Aggregator
 *
 * Combines three data sources for a unified, authoritative college profile:
 *   1. College Scorecard API (real admit rate, SAT, tuition, net price, grad rate)
 *   2. IPEDS via Urban Institute (locale, Carnegie class, control type)
 *   3. US News static rankings (approximate 2024 national rank)
 *
 * Fields marked [REAL] are from live APIs and should be trusted over AI output.
 * Fields marked [STATIC] are from our curated static dataset.
 */

import { lookupByName, batchLookup, getProgramStats } from './collegeScorecard';
import { getIpedsData } from './iped';
import { findRanking, formatRank } from '../../data/usNewsRankings';
import { getCipCodes } from '../majorCipMap';

/**
 * Get an enriched profile for a single school.
 * @param {string} name - School name
 * @param {string} [homeState] - 2-letter state code for resident cost calc
 * @param {string} [major] - Student's intended major (for program-level data)
 * @returns {object} Enriched profile with dataSources metadata
 */
export async function getCollegeProfile(name, homeState, major) {
  // Run Scorecard and US News in parallel
  const [scorecard, ranking] = await Promise.all([
    lookupByName(name),
    Promise.resolve(findRanking(name)),
  ]);

  // If we have a Scorecard UNITID, fetch IPEDS + program data in parallel
  const cipCodes = major ? getCipCodes(major) : [];
  const [ipeds, programStats] = scorecard?.id
    ? await Promise.all([
        getIpedsData(scorecard.id),
        cipCodes.length ? getProgramStats(scorecard.id, cipCodes) : Promise.resolve(null),
      ])
    : [null, null];

  // Compute net cost for this student's home state
  // If home state matches school state → in-state tuition base, else OOS
  const schoolState = scorecard?.state;
  const useInState = homeState && schoolState && homeState.toUpperCase() === schoolState.toUpperCase();
  const baseNetPrice = scorecard
    ? (useInState
        ? scorecard.tuitionInState ?? scorecard.avgNetPrice
        : scorecard.tuitionOutOfState ?? scorecard.avgNetPrice)
    : null;

  return {
    name,
    // ── Location ───────────────────────────────────────────────
    city: scorecard?.city || null,          // [REAL]
    state: scorecard?.state || null,        // [REAL]
    url: scorecard?.url || null,            // [REAL]
    // ── Admissions ─────────────────────────────────────────────
    admitRate: scorecard?.admissionRate ?? null,  // [REAL] integer %
    avgSAT: scorecard?.avgSAT ?? null,            // [REAL]
    sat25: scorecard?.sat25 ?? null,              // [REAL] composite 25th
    sat75: scorecard?.sat75 ?? null,              // [REAL] composite 75th
    actMidpoint: scorecard?.actMidpoint ?? null,  // [REAL]
    // ── Cost ────────────────────────────────────────────────────
    tuitionInState: scorecard?.tuitionInState ?? null,    // [REAL]
    tuitionOutOfState: scorecard?.tuitionOutOfState ?? null, // [REAL]
    avgNetPrice: scorecard?.avgNetPrice ?? null,          // [REAL]
    netCostForResident: baseNetPrice ?? null,             // [REAL] state-adjusted
    netPriceByIncome: scorecard?.netPriceByIncome ?? null, // [REAL] by bracket
    // ── Students & outcomes ──────────────────────────────────────
    enrollment: scorecard?.enrollment ?? null,      // [REAL]
    gradRate: scorecard?.gradRate4yr ?? null,        // [REAL] integer %
    retentionRate: scorecard?.retentionRate ?? null, // [REAL] integer %
    medianEarnings6yr: scorecard?.medianEarnings6yr ?? null,  // [REAL]
    medianEarnings10yr: scorecard?.medianEarnings10yr ?? null, // [REAL]
    // ── Institutional characteristics (IPEDS) ────────────────────
    control: ipeds?.control ?? scorecard?.control ?? null,     // [REAL]
    locale: ipeds?.locale ?? null,                             // [REAL]
    carnegieClass: ipeds?.carnegieClass ?? null,               // [REAL]
    isHBCU: ipeds?.isHBCU ?? false,                            // [REAL]
    coordinates: (ipeds?.latitude && ipeds?.longitude)
      ? { lat: ipeds.latitude, lng: ipeds.longitude }
      : null,
    // ── Rankings ─────────────────────────────────────────────────
    usNewsRank: ranking?.rank ?? null,         // [STATIC ~2024]
    usNewsRankDisplay: formatRank(ranking?.rank), // [STATIC] "#12" or null
    // ── Program-level data (for student's intended major) ────────
    programCompletions: programStats?.completions ?? null,   // [REAL] grads/yr in major
    programEarnings1yr: programStats?.earnings1yr ?? null,   // [REAL] median 1yr post-grad
    programEarnings4yr: programStats?.earnings4yr ?? null,   // [REAL] median 4yr post-grad
    programTitle: programStats?.cipTitle ?? null,            // [REAL] official program name
    // ── Metadata ──────────────────────────────────────────────────
    _dataSources: {
      scorecard: !!scorecard,
      ipeds: !!ipeds,
      usNews: !!ranking,
    },
  };
}

/**
 * Fetch enriched profiles for multiple schools in parallel.
 * @param {string[]} names - List of school names
 * @param {string} [homeState] - Home state for cost calculation
 * @param {string} [major] - Student's intended major
 * @returns {object[]} Array of enriched profiles
 */
export async function batchCollegeProfiles(names, homeState, major) {
  return Promise.all(names.map(name => getCollegeProfile(name, homeState, major)));
}
