// @ts-nocheck
/**
 * College Strategy Generator
 *
 * Flow:
 *   1. Gemini AI recommends reach/target/safety schools based on student profile
 *   2. Real data (College Scorecard + IPEDS + US News) enriches each suggestion
 *   3. Merge: real admission rate, SAT, tuition, net cost override AI estimates
 *      AI fields kept: yourChance, programStrength, whyFit, rationale
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { batchCollegeProfiles } from './collegeDataAggregator';
import { computeChances } from './admissionChance';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let model: any = null;
function getModel() {
  if (!model && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
}

/**
 * Generate a tiered college strategy list.
 * Returns { reach: [], target: [], safety: [], rationale: string }
 */
export async function generateStrategy({ gpa, sat, major, budget, climate, schools: userSchools }) {
  const gemini = getModel();
  if (!gemini) throw new Error('Gemini API key not configured');

  const budgetNote = budget
    ? `Annual budget cap of $${Number(budget).toLocaleString()} (maximum out-of-pocket after aid — factor in net price, not sticker price).`
    : 'No specific budget constraint.';

  const climateNote = climate
    ? `Preferred campus climate/region: ${climate}. Prioritize schools in that environment but include strong options elsewhere.`
    : 'No climate preference.';

  const userSchoolsList = (userSchools || []).filter(Boolean);
  const minPerTier = 3;

  // ── Step 0: Pre-compute tiers for user's schools using the same logistic ─
  //    model the dashboard uses. This guarantees alignment.
  let preAssigned = []; // { name, tier, yourChance, admitRate }
  if (userSchoolsList.length && (sat || gpa)) {
    const chanceResults = await computeChances({
      gpa: parseFloat(gpa) || null,
      sat: parseInt(sat) || null,
      act: null,
      schools: userSchoolsList.map(name => ({ name, id: '' })),
    });
    preAssigned = chanceResults.map(r => ({
      name: r.schoolName,
      tier: r.chance >= 65 ? 'safety' : r.chance >= 35 ? 'target' : 'reach',
      yourChance: r.chance,
      admitRate: r.admissionRate,
    }));
  }

  // Count how many MORE schools each tier needs from AI
  const preReach = preAssigned.filter(s => s.tier === 'reach').length;
  const preTarget = preAssigned.filter(s => s.tier === 'target').length;
  const preSafety = preAssigned.filter(s => s.tier === 'safety').length;
  const needReach = Math.max(0, minPerTier - preReach);
  const needTarget = Math.max(0, minPerTier - preTarget);
  const needSafety = Math.max(0, minPerTier - preSafety);
  const totalNeed = needReach + needTarget + needSafety;

  // Build the prompt telling Gemini which schools are already placed
  const preAssignedNote = preAssigned.length
    ? `\nThe student already has these schools assigned to tiers (DO NOT include them in your response — they are handled separately):\n${preAssigned.map(s => `- ${s.name} → ${s.tier} (${s.yourChance}% chance)`).join('\n')}\n`
    : '';

  const totalMin = Math.max(totalNeed, 3); // at least 3 new recommendations

  // ── Step 1: Get school recommendations from Gemini ─────────────────────
  const recommendPrompt = `You are a college admissions strategist. Recommend ADDITIONAL schools for this US high school student.

STUDENT PROFILE:
- GPA: ${gpa}
- SAT: ${sat}
- Intended Major: ${major}
- ${budgetNote}
- ${climateNote}
${preAssignedNote}
Return at least ${totalMin} NEW schools (not listed above) with these HARD RULES:
- Include at least ${needReach} REACH schools (<30% admission chance for this student)
- Include at least ${needTarget} TARGET schools (40-65% admission chance)
- Include at least ${needSafety} SAFETY schools (high confidence admission)
- Diversify by geography, school size, and ranking within each tier
- Prefer well-known programs for the student's intended major
- DO NOT repeat any school already listed above

For each school provide ONLY:
- name: full official school name
- tier: "reach" | "target" | "safety"
- yourChance: estimated admission probability 0-100 integer for THIS student specifically
- admitRate: the school's real overall admission rate 0-100 integer (must be internally consistent with yourChance — an above-average student like this one should have yourChance >= admitRate for target/safety schools)
- programStrength: 1-2 words for the ${major} program (e.g. "Top 10", "Strong", "Solid", "Emerging")
- whyFit: one sentence ≤15 words explaining fit

Also include top-level "rationale": 2-3 sentences on the overall strategy (covering both the student's existing schools and your new recommendations).

Respond ONLY with valid JSON, no markdown:
{
  "rationale": "...",
  "schools": [{ "name": "...", "tier": "reach|target|safety", "yourChance": 0, "admitRate": 0, "programStrength": "...", "whyFit": "..." }]
}`;

  const result = await gemini.generateContent(recommendPrompt);
  let text = result.response.text().trim();
  // Strip markdown code fences (various formats Gemini might use)
  text = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
  // Find the JSON object boundaries in case there's extra text
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('AI did not return valid JSON. Please try again.');
  }
  text = text.slice(jsonStart, jsonEnd + 1);
  let aiResult;
  try {
    aiResult = JSON.parse(text);
  } catch (parseErr) {
    throw new Error('AI returned malformed JSON. Please try again.');
  }

  const { rationale } = aiResult;
  let { schools: aiNewSchools = [] } = aiResult;

  // Remove any duplicates of user's schools that AI included anyway
  const preNames = new Set(preAssigned.map(s => s.name.toLowerCase()));
  aiNewSchools = aiNewSchools.filter(s => !preNames.has(s.name.toLowerCase()));

  // ── Validate tier counts (pre-assigned + AI combined), retry if short ──
  const countByTier = (arr, t) => arr.filter(s => s.tier === t).length;
  const allSchools = [...preAssigned, ...aiNewSchools];
  let reachCount = countByTier(allSchools, 'reach');
  let targetCount = countByTier(allSchools, 'target');
  let safetyCount = countByTier(allSchools, 'safety');

  if (reachCount < 3 || targetCount < 3 || safetyCount < 3) {
    const fixPrompt = `The current college list has ${reachCount} reach, ${targetCount} target, ${safetyCount} safety schools. Each tier MUST have at least 3. Suggest MORE new schools for any tier below 3. Do not include these schools (already in list): ${allSchools.map(s => s.name).join(', ')}. Return ONLY the new additions in the same JSON format.\n\nRespond ONLY with valid JSON, no markdown:\n{"schools": [{ "name": "...", "tier": "reach|target|safety", "yourChance": 0, "admitRate": 0, "programStrength": "...", "whyFit": "..." }]}`;
    const fixResult = await gemini.generateContent(fixPrompt);
    let fixText = fixResult.response.text().trim();
    fixText = fixText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '');
    const fStart = fixText.indexOf('{');
    const fEnd = fixText.lastIndexOf('}');
    if (fStart !== -1 && fEnd !== -1) {
      try {
        const fixParsed = JSON.parse(fixText.slice(fStart, fEnd + 1));
        if (fixParsed.schools?.length) {
          aiNewSchools = [...aiNewSchools, ...fixParsed.schools];
        }
      } catch { /* use original if retry fails */ }
    }
  }

  // Combine: user's pre-assigned schools first, then AI recommendations
  const aiSchools = [...preAssigned.map(s => ({
    ...s,
    programStrength: null,
    whyFit: 'On your dashboard',
  })), ...aiNewSchools];

  if (!aiSchools.length) return { rationale, reach: [], target: [], safety: [] };

  // ── Step 2: Fetch real data for all recommended schools ─────────────────
  const schoolNames = aiSchools.map(s => s.name);
  const realProfiles = await batchCollegeProfiles(schoolNames);

  // ── Step 3: Merge AI recommendations with real data ─────────────────────
  const enriched = aiSchools.map((ai, i) => {
    const real = realProfiles[i] || {};

    // Net cost: use real data, adjusted for budget context
    // If no real data available, leave null (AI didn't provide it — better than hallucinating)
    const netCost = real.netCostForResident ?? real.avgNetPrice ?? null;

    return {
      name: ai.name,
      city: real.city ?? null,
      state: real.state ?? null,
      // ── Admissions data ──
      // Prefer AI admit rate: Scorecard name matching can find wrong campuses,
      // producing rates inconsistent with yourChance. AI uses known school selectivity.
      admitRate: ai.admitRate ?? real.admitRate ?? null,
      yourChance: ai.yourChance ?? null,          // [AI] personalized
      avgSAT: real.avgSAT ?? null,               // [REAL]
      sat25: real.sat25 ?? null,                 // [REAL]
      sat75: real.sat75 ?? null,                 // [REAL]
      actMidpoint: real.actMidpoint ?? null,     // [REAL]
      // ── Real cost data ──
      netCost,                                   // [REAL]
      tuitionOutOfState: real.tuitionOutOfState ?? null, // [REAL]
      tuitionInState: real.tuitionInState ?? null,       // [REAL]
      netPriceByIncome: real.netPriceByIncome ?? null,   // [REAL]
      // ── Real outcomes ──
      gradRate: real.gradRate ?? null,           // [REAL]
      enrollment: real.enrollment ?? null,       // [REAL]
      medianEarnings10yr: real.medianEarnings10yr ?? null, // [REAL]
      // ── Rankings ──
      usNewsRank: real.usNewsRank ?? null,       // [STATIC]
      usNewsRankDisplay: real.usNewsRankDisplay ?? null,
      // ── Institution info ──
      control: real.control ?? null,
      locale: real.locale ?? null,
      isHBCU: real.isHBCU ?? false,
      // ── AI-only fields ──
      programStrength: ai.programStrength ?? null,
      whyFit: ai.whyFit ?? null,
      // ── Metadata ──
      _dataSources: real._dataSources ?? { scorecard: false, ipeds: false, usNews: false },
    };
  });

  // Split back into tiers (preserve tier from AI)
  const byTier = (tier) => enriched.filter((_, i) => aiSchools[i]?.tier === tier);

  return {
    rationale,
    reach: byTier('reach'),
    target: byTier('target'),
    safety: byTier('safety'),
  };
}
