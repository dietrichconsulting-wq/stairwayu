// @ts-nocheck
import { getCollege, lookupByName } from './collegeScorecard';
/**
 * Estimate admission probability using a logistic model based on:
 * 1. SAT score relative to school's 25th-75th percentile range
 * 2. GPA relative to a 4.0 scale (bonus for higher)
 * 3. School's overall admission rate as a baseline
 *
 * This is an ESTIMATE for guidance — not a guarantee.
 */

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
 * Core probability calculation for a single school.
 * Returns 0-100 integer.
 */
function calculateChance(studentSAT, studentGPA, school, studentACT) {
  const { admissionRate, avgSAT, sat25, sat75, actMidpoint } = school;

  // If no admission data at all, return null
  if (admissionRate == null) return null;

  const baseRate = admissionRate; // Already a percentage (0–100) from collegeScorecard

  // ── Effective SAT (best of SAT or converted ACT) ──
  const convertedACT = actToSAT(studentACT);
  const effectiveSAT = (studentSAT && convertedACT)
    ? Math.max(studentSAT, convertedACT)
    : studentSAT || convertedACT;

  // ── SAT Factor ──
  // Position student within 25th-75th range
  // Below 25th → penalty, above 75th → bonus
  let satFactor = 0;
  if (effectiveSAT && (sat25 || avgSAT)) {
    const low = sat25 || (avgSAT - 80);   // Estimate 25th if missing
    const high = sat75 || (avgSAT + 80);   // Estimate 75th if missing
    const mid = (low + high) / 2;
    const range = (high - low) || 1;

    // z-score style: how many half-ranges above/below midpoint
    const z = (effectiveSAT - mid) / (range / 2);

    // Map to factor: -30 to +25 percentage points
    satFactor = clamp(z * 18, -30, 25);
  }

  // ── ACT Factor ──
  // If school has actMidpoint and student has ACT, compute additional factor
  let actFactor = null;
  if (studentACT && actMidpoint) {
    // ACT midpoint typically ±3 covers 25th-75th
    const actZ = (studentACT - actMidpoint) / 3;
    actFactor = clamp(actZ * 18, -30, 25);
  }

  // Average SAT and ACT factors if both available
  if (actFactor != null && effectiveSAT && (sat25 || avgSAT)) {
    satFactor = (satFactor + actFactor) / 2;
  } else if (actFactor != null && !effectiveSAT) {
    satFactor = actFactor;
  }

  // ── GPA Factor ──
  // Above 3.7 = bonus, below 3.0 = penalty
  let gpaFactor = 0;
  if (studentGPA) {
    if (studentGPA >= 3.9) gpaFactor = 12;
    else if (studentGPA >= 3.7) gpaFactor = 8;
    else if (studentGPA >= 3.5) gpaFactor = 4;
    else if (studentGPA >= 3.2) gpaFactor = 0;
    else if (studentGPA >= 3.0) gpaFactor = -5;
    else if (studentGPA >= 2.7) gpaFactor = -12;
    else gpaFactor = -20;
  }

  // ── Selectivity adjustment ──
  // Very selective schools (<20% admission) have compressed ranges
  // Less selective schools (>60%) have wider ranges
  let selectivityScale = 1.0;
  if (baseRate < 10) selectivityScale = 0.5;        // Ivy-tier: small adjustments
  else if (baseRate < 20) selectivityScale = 0.65;   // Very selective
  else if (baseRate < 35) selectivityScale = 0.8;    // Selective
  else if (baseRate > 70) selectivityScale = 1.3;    // Less selective: wider swings

  const adjustedSAT = satFactor * selectivityScale;
  const adjustedGPA = gpaFactor * selectivityScale;

  // Round to nearest 5% to signal this is an estimate, not a precise prediction
  const raw = clamp(baseRate + adjustedSAT + adjustedGPA, 5, 95);
  return Math.round(raw / 5) * 5;
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
          // Use lookupByName which handles name expansions (e.g. "Texas" → "University of Texas at Austin")
          college = await lookupByName(s.name);
        }
        if (!college) return null;

        const chance = calculateChance(profile.sat, profile.gpa, college, profile.act);
        if (chance == null) return null;

        return {
          schoolName: s.name,
          schoolId: college.id,
          chance,
          admissionRate: college.admissionRate,
          avgSAT: college.avgSAT,
          sat25: college.sat25,
          sat75: college.sat75,
          actMidpoint: college.actMidpoint || null,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter(Boolean);
}
