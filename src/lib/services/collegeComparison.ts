// @ts-nocheck
/**
 * College Comparison Service
 *
 * Real data only (College Scorecard + IPEDS) for all factual fields.
 * Admission chances from admissionChance.ts (same algorithm as Dashboard).
 * No AI-generated fields — constitution prohibits guessing factual data.
 */

import { batchCollegeProfiles } from './collegeDataAggregator';
import { computeChances } from './admissionChance';

/**
 * Fetch comparison data using authoritative API sources only.
 */
export async function compareColleges(schoolNames, { major, gpa, gpa_weighted, sat, homeState } = {}) {
  if (!schoolNames || schoolNames.length === 0) return [];

  const majorLabel = major || 'Undecided';

  // ── Step 1: Fetch real data first, then compute chances using resolved IDs ──
  const realData = await batchCollegeProfiles(schoolNames, homeState);

  // Use the Scorecard IDs already resolved in realData so chances match the Dashboard
  let chanceResults = [];
  if (gpa || gpa_weighted || sat) {
    chanceResults = await computeChances({
      gpa,
      gpa_weighted,
      sat,
      proposedMajor: majorLabel,
      schools: schoolNames.map((name, i) => ({
        name,
        id: realData[i]?._dataSources?.scorecardId || '',
      })),
    });
  }

  // Index chances by school name for fast lookup
  const chancesByName: Record<string, any> = {};
  for (const c of chanceResults) {
    if (c?.schoolName) chancesByName[c.schoolName.toLowerCase()] = c;
  }

  // ── Step 2: Merge real data ─────────────────────────────────────────
  return schoolNames.map((name, i) => {
    const real = realData[i] || {};
    const netCost = real.netCostForResident ?? real.avgNetPrice ?? null;

    return {
      name,
      // ── Real data (authoritative) ──
      admitRate: real.admitRate ?? null,
      avgSAT: real.avgSAT ?? null,
      sat25: real.sat25 ?? null,
      sat75: real.sat75 ?? null,
      tuitionOutOfState: real.tuitionOutOfState ?? null,
      tuitionInState: real.tuitionInState ?? null,
      netCost,
      netPriceByIncome: real.netPriceByIncome ?? null,
      enrollment: real.enrollment ?? null,
      gradRate: real.gradRate ?? null,
      retentionRate: real.retentionRate ?? null,
      medianEarnings10yr: real.medianEarnings10yr ?? null,
      city: real.city ?? null,
      state: real.state ?? null,
      url: real.url ?? null,
      control: real.control ?? null,
      locale: real.locale ?? null,
      carnegieClass: real.carnegieClass ?? null,
      isHBCU: real.isHBCU ?? false,
      // ── Admission chance (from admissionChance.ts — same as Dashboard) ──
      yourChance: chancesByName[name.toLowerCase()]?.chance != null
        ? Math.round(chancesByName[name.toLowerCase()].chance / 5) * 5
        : null,
      // ── Metadata ──
      _dataSources: real._dataSources ?? { scorecard: false, ipeds: false, usNews: false },
    };
  });
}
