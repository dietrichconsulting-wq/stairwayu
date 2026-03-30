// @ts-nocheck
import { getCollege, lookupByName } from './collegeScorecard';
/**
 * Estimate admission probability using a logistic model based on:
 * 1. SAT score relative to school's 25th-75th percentile range
 * 2. Unweighted GPA (4.0 scale) — if only weighted GPA (5.0 scale) is
 *    provided, it is normalized to the 4.0 scale: (weighted / 5) * 4
 * 3. School's overall admission rate as a baseline
 *
 * This is an ESTIMATE for guidance — not a guarantee.
 *
 * Each factor also produces human-readable "insights" explaining
 * what helped or hurt the student's chances.
 */

export interface Insight {
  factor: 'sat' | 'act' | 'gpa' | 'ec' | 'selectivity' | 'test_optional';
  sentiment: 'positive' | 'neutral' | 'negative';
  message: string;
  /** How many percentage points this factor contributed (signed) */
  impact: number;
}

export interface ChanceResult {
  chance: number;
  insights: Insight[];
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Official ACT-to-SAT concordance (College Board/ACT)
const ACT_TO_SAT = {
  36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370,
  29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140,
  22: 1110, 21: 1080, 20: 1050,
};

function actToSAT(act) {
  if (!act || act < 20 || act > 36) return null;
  return ACT_TO_SAT[act] || null;
}

/**
 * Describe where a score falls relative to a percentile range.
 */
function satPositionLabel(score: number, low: number, high: number): string {
  if (score >= high + 40) return 'well above their 75th percentile';
  if (score >= high) return 'above their 75th percentile';
  if (score >= (low + high) / 2) return 'in the upper half of their range';
  if (score >= low) return 'in the lower half of their range';
  if (score >= low - 40) return 'just below their 25th percentile';
  return 'below their 25th percentile';
}

function gpaLabel(gpa: number): string {
  if (gpa >= 3.9) return 'near-perfect';
  if (gpa >= 3.7) return 'very strong';
  if (gpa >= 3.5) return 'strong';
  if (gpa >= 3.2) return 'solid';
  if (gpa >= 3.0) return 'average';
  if (gpa >= 2.7) return 'below average';
  return 'low';
}

function sentimentFromImpact(impact: number): 'positive' | 'neutral' | 'negative' {
  if (impact >= 3) return 'positive';
  if (impact <= -3) return 'negative';
  return 'neutral';
}

// ── Extracurricular tier scoring ──────────────────────────────────────
// Points per tier (research-backed: mirrors how selective admissions
// weight national > state > school > participation activities).
export const EC_TIER_POINTS: Record<number, number> = { 1: 8, 2: 5, 3: 3, 4: 1 };

/** Max activities scored (diminishing returns after 5) */
const EC_MAX_SCORED = 5;
/** Hard cap on total EC factor points */
const EC_CAP = 15;

export const EC_TIER_LABELS: Record<number, { label: string; description: string; examples: string; question: string }> = {
  1: { label: 'National / Rare', description: 'National or international recognition', examples: 'National award winner, published researcher, recruited D1 athlete, professional-level achievement', question: 'Were you recognized at the national or international level?' },
  2: { label: 'Leadership / State', description: 'Led an org or earned state-level recognition', examples: 'Club president/founder, state competition winner, Eagle Scout, significant community impact', question: 'Did you lead the org or win at the state/regional level?' },
  3: { label: 'Active Role', description: 'Held a title or committed 2+ years', examples: 'Team captain, newspaper editor, varsity athlete, multi-year officer, Key Club board member', question: 'Did you hold a title (captain, officer, editor) or commit 2+ years?' },
  4: { label: 'Member', description: 'Participated without a leadership role', examples: 'Club member, casual volunteering, part-time job, intramural sports', question: 'Did you participate without a specific leadership role?' },
};

/**
 * Score extracurricular entries. Returns 0–EC_CAP points.
 * Only the top EC_MAX_SCORED activities by tier are counted.
 */
export function scoreECs(entries: { name: string; tier: number }[] | null | undefined): number {
  if (!entries || entries.length === 0) return 0;
  // Sort by tier ascending (tier 1 = best) and take top entries
  const sorted = [...entries].sort((a, b) => a.tier - b.tier).slice(0, EC_MAX_SCORED);
  const raw = sorted.reduce((sum, e) => sum + (EC_TIER_POINTS[e.tier] || 0), 0);
  return Math.min(raw, EC_CAP);
}

/**
 * Core probability calculation for a single school.
 * Returns { chance: 0-100, insights: Insight[] }.
 */
export function calculateChance(studentSAT, studentGPA, school, studentACT, studentGPAWeighted?, ecEntries?): ChanceResult | null {
  const { admissionRate, avgSAT, sat25, sat75, actMidpoint } = school;

  // If no admission data at all, return null
  if (admissionRate == null) return null;

  const baseRate = admissionRate; // Already a percentage (0–100) from collegeScorecard
  const insights: Insight[] = [];

  // ── Effective GPA: prefer unweighted (4.0 scale), normalize weighted as fallback ──
  const effectiveGPA = studentGPA != null
    ? studentGPA
    : studentGPAWeighted != null
      ? Math.round(((studentGPAWeighted / 5) * 4) * 100) / 100
      : null;
  const gpaIsNormalized = studentGPA == null && studentGPAWeighted != null;

  // ── Effective SAT (best of SAT or converted ACT) ──
  const convertedACT = actToSAT(studentACT);
  const effectiveSAT = (studentSAT && convertedACT)
    ? Math.max(studentSAT, convertedACT)
    : studentSAT || convertedACT;

  // ── SAT Factor ──
  let satFactor = 0;
  if (effectiveSAT && (sat25 || avgSAT)) {
    const low = sat25 || (avgSAT - 80);
    const high = sat75 || (avgSAT + 80);
    const mid = (low + high) / 2;
    const range = (high - low) || 1;

    const z = (effectiveSAT - mid) / (range / 2);
    satFactor = clamp(z * 18, -30, 25);

    // Build SAT insight
    const position = satPositionLabel(effectiveSAT, low, high);
    const satLabel = (studentSAT && convertedACT && convertedACT > studentSAT)
      ? `Your ACT (${studentACT}) converts to ${convertedACT} SAT`
      : `Your SAT (${effectiveSAT})`;

    if (sat25 && sat75) {
      insights.push({
        factor: 'sat',
        sentiment: sentimentFromImpact(satFactor),
        message: `${satLabel} is ${position} (${sat25}–${sat75})`,
        impact: Math.round(satFactor),
      });
    } else {
      insights.push({
        factor: 'sat',
        sentiment: sentimentFromImpact(satFactor),
        message: `${satLabel} is ${effectiveSAT > mid ? 'above' : 'below'} their average of ${avgSAT}`,
        impact: Math.round(satFactor),
      });
    }
  } else if (!effectiveSAT && (sat25 || avgSAT)) {
    insights.push({
      factor: 'test_optional',
      sentiment: 'neutral',
      message: 'No test scores provided — consider adding SAT/ACT for a more accurate estimate',
      impact: 0,
    });
  }

  // ── ACT Factor ──
  let actFactor = null;
  if (studentACT && actMidpoint) {
    const actZ = (studentACT - actMidpoint) / 3;
    actFactor = clamp(actZ * 18, -30, 25);

    // Only add a separate ACT insight if different from SAT story
    if (!effectiveSAT) {
      const diff = studentACT - actMidpoint;
      insights.push({
        factor: 'act',
        sentiment: sentimentFromImpact(actFactor),
        message: `Your ACT (${studentACT}) is ${diff > 0 ? '+' : ''}${diff} from their midpoint of ${actMidpoint}`,
        impact: Math.round(actFactor),
      });
    }
  }

  // Average SAT and ACT factors if both available
  if (actFactor != null && effectiveSAT && (sat25 || avgSAT)) {
    satFactor = (satFactor + actFactor) / 2;
  } else if (actFactor != null && !effectiveSAT) {
    satFactor = actFactor;
  }

  // ── GPA Factor ──
  let gpaFactor = 0;
  if (effectiveGPA) {
    if (effectiveGPA >= 3.9) gpaFactor = 12;
    else if (effectiveGPA >= 3.7) gpaFactor = 8;
    else if (effectiveGPA >= 3.5) gpaFactor = 4;
    else if (effectiveGPA >= 3.2) gpaFactor = 0;
    else if (effectiveGPA >= 3.0) gpaFactor = -5;
    else if (effectiveGPA >= 2.7) gpaFactor = -12;
    else gpaFactor = -20;

    const label = gpaLabel(effectiveGPA);
    const verb = gpaFactor > 0 ? 'boosts' : gpaFactor < 0 ? 'lowers' : 'has a neutral effect on';
    const gpaDisplay = gpaIsNormalized
      ? `${studentGPAWeighted} weighted, ~${effectiveGPA} unweighted`
      : `${effectiveGPA}`;
    insights.push({
      factor: 'gpa',
      sentiment: sentimentFromImpact(gpaFactor),
      message: `Your ${label} GPA (${gpaDisplay}) ${verb} your chances`,
      impact: Math.round(gpaFactor),
    });
  }

  // ── Extracurricular Factor ──
  let ecFactor = 0;
  const ecPoints = scoreECs(ecEntries);
  if (ecEntries && ecEntries.length > 0) {
    ecFactor = ecPoints;
    const bestTier = Math.min(...ecEntries.map(e => e.tier));
    const count = Math.min(ecEntries.length, EC_MAX_SCORED);
    const tierWord = bestTier === 1 ? 'national-level' : bestTier === 2 ? 'state-level' : bestTier === 3 ? 'school-level' : 'participation-level';
    insights.push({
      factor: 'ec',
      sentiment: sentimentFromImpact(ecFactor),
      message: `${count} activit${count === 1 ? 'y' : 'ies'} scored (strongest: ${tierWord})`,
      impact: Math.round(ecFactor),
    });
  }

  // ── Selectivity adjustment ──
  let selectivityScale = 1.0;
  if (baseRate < 10) selectivityScale = 0.5;
  else if (baseRate < 20) selectivityScale = 0.65;
  else if (baseRate < 35) selectivityScale = 0.8;
  else if (baseRate > 70) selectivityScale = 1.3;

  // ECs matter MORE at selective schools — invert the scale
  let ecSelectivityScale = 1.0;
  if (baseRate < 10) ecSelectivityScale = 1.4;
  else if (baseRate < 20) ecSelectivityScale = 1.2;
  else if (baseRate < 35) ecSelectivityScale = 1.0;
  else if (baseRate > 70) ecSelectivityScale = 0.6;

  const adjustedSAT = satFactor * selectivityScale;
  const adjustedGPA = gpaFactor * selectivityScale;
  const adjustedEC = ecFactor * ecSelectivityScale;

  // Scale the insight impacts to match the selectivity adjustment
  for (const insight of insights) {
    if (insight.factor === 'sat' || insight.factor === 'act') {
      insight.impact = Math.round(insight.impact * selectivityScale);
    } else if (insight.factor === 'gpa') {
      insight.impact = Math.round(insight.impact * selectivityScale);
    } else if (insight.factor === 'ec') {
      insight.impact = Math.round(insight.impact * ecSelectivityScale);
    }
  }

  // Add selectivity insight for highly selective schools
  if (baseRate < 20) {
    insights.push({
      factor: 'selectivity',
      sentiment: 'negative',
      message: `Highly selective (${baseRate}% admit rate) — stats alone don't guarantee admission`,
      impact: 0,
    });
  } else if (baseRate > 70) {
    insights.push({
      factor: 'selectivity',
      sentiment: 'positive',
      message: `Open admissions (${baseRate}% admit rate) — most qualified applicants are accepted`,
      impact: 0,
    });
  }

  // Round to nearest 5% to signal this is an estimate
  const raw = clamp(baseRate + adjustedSAT + adjustedGPA + adjustedEC, 5, 95);
  const chance = Math.round(raw / 5) * 5;

  return { chance, insights };
}

/**
 * Main entry: compute chances for all of a student's target schools.
 */
export async function computeChances(profile) {
  const schools = (profile.schools || []).filter(s => s?.name && s.name.trim() !== '');

  const results = await Promise.all(
    schools.map(async (s) => {
      try {
        let college;
        if (s.id && s.id.trim() !== '') {
          college = await getCollege(s.id);
        } else {
          college = await lookupByName(s.name);
        }
        if (!college) return null;

        const result = calculateChance(profile.sat, profile.gpa, college, profile.act, profile.gpa_weighted, profile.ecEntries);
        if (result == null) return null;

        return {
          schoolName: s.name,
          schoolId: college.id,
          chance: result.chance,
          insights: result.insights,
          admissionRate: college.admissionRate,
          avgSAT: college.avgSAT,
          sat25: college.sat25,
          sat75: college.sat75,
          actMidpoint: college.actMidpoint || null,
          avgNetPrice: college.avgNetPrice || null,
          tuitionInState: college.tuitionInState || null,
          tuitionOutOfState: college.tuitionOutOfState || null,
          schoolState: college.state || null,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean);
}
