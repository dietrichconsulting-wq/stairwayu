import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'
import { SCHOLARSHIPS, type CuratedScholarship, type ScholarshipTag } from '@/lib/data/scholarships'

let model: GenerativeModel | null = null
function getModel(): GenerativeModel | null {
  if (!model && process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }
  return model
}

export interface ScholarshipSuggestion {
  name: string
  org: string
  amount: number | null
  amountLabel: string
  deadline: string | null
  deadlineLabel: string
  url: string
  eligibility: string
  whyMatch: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  essayRequired: boolean
  verified: true  // always true now — data comes from curated DB
}

export interface FinderInput {
  gpa?: number | null
  gpa_weighted?: number | null
  sat?: number | null
  act?: number | null
  major?: string | null
  homeState?: string | null
  gradYear?: number | null
  extracurriculars?: string | null
  careerInterests?: string | null
  background?: string | null
  circumstances?: string | null
}

// ── Profile → tag relevance mapping ──────────────────────────────────

function inferTags(input: FinderInput): ScholarshipTag[] {
  const tags: ScholarshipTag[] = ['national']

  const major = (input.major ?? '').toLowerCase()
  const career = (input.careerInterests ?? '').toLowerCase()
  const extras = (input.extracurriculars ?? '').toLowerCase()
  const bg = (input.background ?? '').toLowerCase()
  const circ = (input.circumstances ?? '').toLowerCase()

  // Academics
  if ((input.gpa ?? 0) >= 3.7 || (input.gpa_weighted ?? 0) >= 4.2) tags.push('high-gpa')
  if ((input.sat ?? 0) >= 1400 || (input.act ?? 0) >= 32) tags.push('high-test-scores')

  // Major / career interest → field tags
  const stemWords = ['computer', 'engineering', 'math', 'physics', 'chemistry', 'biology', 'data', 'science', 'technology', 'software', 'ai ', 'machine learning', 'robotics', 'biomedical', 'electrical', 'mechanical', 'aerospace', 'cyber']
  const artsWords = ['art', 'music', 'theater', 'theatre', 'film', 'design', 'creative', 'photography', 'dance', 'animation', 'graphic']
  const humanitiesWords = ['english', 'history', 'philosophy', 'political', 'sociology', 'psychology', 'literature', 'writing', 'journalism', 'communications', 'languages', 'anthropology']
  const businessWords = ['business', 'economics', 'finance', 'marketing', 'management', 'entrepreneurship', 'accounting', 'mba']
  const healthWords = ['medicine', 'nursing', 'pre-med', 'premed', 'pharmacy', 'health', 'public health', 'dental', 'veterinary', 'physician', 'clinical']
  const educationWords = ['education', 'teaching', 'teacher', 'pedagogy']
  const envWords = ['environment', 'ecology', 'sustainability', 'conservation', 'climate', 'marine biology', 'forestry']
  const engWords = ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'aerospace', 'industrial']

  const combined = `${major} ${career}`
  if (stemWords.some(w => combined.includes(w))) tags.push('stem')
  if (artsWords.some(w => combined.includes(w))) tags.push('arts')
  if (humanitiesWords.some(w => combined.includes(w))) tags.push('humanities')
  if (businessWords.some(w => combined.includes(w))) tags.push('business')
  if (healthWords.some(w => combined.includes(w))) tags.push('health-sciences')
  if (educationWords.some(w => combined.includes(w))) tags.push('education')
  if (envWords.some(w => combined.includes(w))) tags.push('environmental')
  if (engWords.some(w => combined.includes(w))) tags.push('engineering')

  // Extracurriculars
  if (['volunteer', 'community', 'service', 'nonprofit', 'charity'].some(w => extras.includes(w))) tags.push('community-service')
  if (['president', 'captain', 'leader', 'founder', 'student government', 'student council', 'editor-in-chief'].some(w => extras.includes(w))) tags.push('leadership')
  if (['writing', 'poet', 'author', 'blog', 'journal', 'newspaper'].some(w => extras.includes(w))) tags.push('creative-writing')

  // Background
  if (['hispanic', 'latino', 'latina', 'latinx', 'black', 'african american', 'native', 'indigenous', 'asian', 'pacific islander', 'minority', 'underrepresented'].some(w => bg.includes(w))) tags.push('minority')
  if (['woman', 'women', 'female'].some(w => bg.includes(w))) tags.push('women')
  if (['lgbtq', 'gay', 'lesbian', 'transgender', 'nonbinary', 'queer', 'bisexual'].some(w => bg.includes(w))) tags.push('lgbtq')
  if (['first-gen', 'first gen', 'first generation', 'first in family'].some(w => bg.includes(w) || circ.includes(w))) tags.push('first-gen')

  // Circumstances
  if (['military', 'veteran', 'army', 'navy', 'air force', 'marine', 'coast guard', 'armed forces'].some(w => circ.includes(w) || bg.includes(w))) tags.push('military')
  if (['disability', 'disabled', 'blind', 'deaf', 'wheelchair', 'adhd', 'autism', 'chronic'].some(w => circ.includes(w) || bg.includes(w))) tags.push('disability')
  if (['low-income', 'low income', 'financial need', 'pell', 'free lunch', 'hardship', 'poverty'].some(w => circ.includes(w) || bg.includes(w))) tags.push('low-income')

  return [...new Set(tags)]
}

// ── Scoring ──────────────────────────────────────────────────────────

function scoreScholarship(s: CuratedScholarship, profileTags: ScholarshipTag[]): number {
  let score = 0

  // Tag overlap (main signal)
  const overlap = s.tags.filter(t => profileTags.includes(t))
  score += overlap.length * 10

  // Bonus for specific (non-national) tag matches — these are more targeted
  const specificMatches = overlap.filter(t => t !== 'national')
  score += specificMatches.length * 5

  // Small bonus for no-essay (low barrier)
  if (s.tags.includes('no-essay')) score += 3

  // Renewable bonus
  if (s.renewable) score += 2

  return score
}

function matchAndRank(input: FinderInput, maxResults = 15): CuratedScholarship[] {
  const profileTags = inferTags(input)

  const scored = SCHOLARSHIPS.map(s => ({
    scholarship: s,
    score: scoreScholarship(s, profileTags),
  }))

  // Filter out zero-score (completely irrelevant)
  const relevant = scored.filter(x => x.score > 0)

  // Sort by score desc, then by difficulty asc (Easy first within same score)
  const diffOrder = { Easy: 0, Medium: 1, Hard: 2 }
  relevant.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return diffOrder[a.scholarship.difficulty] - diffOrder[b.scholarship.difficulty]
  })

  // Ensure mix: at least 3 Easy if available
  const easy = relevant.filter(x => x.scholarship.difficulty === 'Easy')
  const nonEasy = relevant.filter(x => x.scholarship.difficulty !== 'Easy')

  const easySlots = Math.min(easy.length, Math.max(3, Math.ceil(maxResults * 0.25)))
  const result: CuratedScholarship[] = [
    ...easy.slice(0, easySlots).map(x => x.scholarship),
    ...nonEasy.slice(0, maxResults - easySlots).map(x => x.scholarship),
  ]

  // Re-sort final list: Hard → Medium → Easy (most prestigious first, easy at bottom)
  const finalOrder = { Hard: 0, Medium: 1, Easy: 2 }
  result.sort((a, b) => finalOrder[a.difficulty] - finalOrder[b.difficulty])

  return result.slice(0, maxResults)
}

// ── AI "why you match" generation ────────────────────────────────────

async function generateWhyMatch(
  scholarships: CuratedScholarship[],
  input: FinderInput,
): Promise<Map<string, string>> {
  const m = getModel()
  const fallbackMap = new Map<string, string>()

  // Build fallback reasons from tag matching
  const profileTags = inferTags(input)
  for (const s of scholarships) {
    const matches = s.tags.filter(t => profileTags.includes(t) && t !== 'national')
    const parts: string[] = []
    if (matches.includes('high-gpa')) parts.push(`your strong GPA (${input.gpa ?? input.gpa_weighted})`)
    if (matches.includes('high-test-scores')) parts.push(`your test scores`)
    if (matches.includes('stem')) parts.push('your interest in STEM')
    if (matches.includes('engineering')) parts.push('your engineering focus')
    if (matches.includes('arts')) parts.push('your interest in the arts')
    if (matches.includes('humanities')) parts.push('your humanities focus')
    if (matches.includes('business')) parts.push('your interest in business')
    if (matches.includes('health-sciences')) parts.push('your healthcare career path')
    if (matches.includes('education')) parts.push('your interest in education')
    if (matches.includes('environmental')) parts.push('your environmental interests')
    if (matches.includes('community-service')) parts.push('your community service involvement')
    if (matches.includes('leadership')) parts.push('your leadership experience')
    if (matches.includes('first-gen')) parts.push('your first-generation status')
    if (matches.includes('low-income')) parts.push('your financial circumstances')
    if (matches.includes('minority')) parts.push('your background')
    if (matches.includes('women')) parts.push('supporting women in your field')
    if (matches.includes('lgbtq')) parts.push('your LGBTQ+ identity')
    if (matches.includes('military')) parts.push('your military connection')
    if (matches.includes('disability')) parts.push('supporting students with disabilities')
    if (matches.includes('no-essay')) parts.push("no essay required — it's a quick apply")
    if (matches.includes('creative-writing')) parts.push('your writing skills')

    fallbackMap.set(
      s.id,
      parts.length > 0
        ? `Matches ${parts.join(', ')}.`
        : 'This is a broadly available scholarship worth applying to.',
    )
  }

  if (!m) return fallbackMap

  // Use AI to make the "why" more personalized, but ONLY the text — not URLs/names/amounts
  try {
    const scholarshipList = scholarships.map(s => `- ${s.name} (${s.org}): ${s.eligibility}`).join('\n')

    const prompt = `You are a college advisor writing short "why you match" blurbs for a student's scholarship results. Each blurb should be 1-2 sentences, specific to THIS student's profile, and explain why they're a good fit.

Student Profile:
- GPA: ${input.gpa ?? 'N/A'} (weighted: ${input.gpa_weighted ?? 'N/A'})
- SAT: ${input.sat ?? 'N/A'} / ACT: ${input.act ?? 'N/A'}
- Major: ${input.major || 'undecided'}
- State: ${input.homeState || 'N/A'}
- Activities: ${input.extracurriculars || 'N/A'}
- Career interests: ${input.careerInterests || 'N/A'}
- Background: ${input.background || 'N/A'}
- Circumstances: ${input.circumstances || 'N/A'}

Scholarships to write blurbs for:
${scholarshipList}

Return ONLY a valid JSON object mapping scholarship name to blurb string. No markdown fences:
{"Scholarship Name": "Your blurb here...", ...}`

    const result = await m.generateContent(prompt)
    const text = result.response.text()
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, string>

    for (const s of scholarships) {
      if (parsed[s.name]) {
        fallbackMap.set(s.id, parsed[s.name])
      }
    }
  } catch {
    // AI failed — fallback blurbs are already in the map
  }

  return fallbackMap
}

// ── Public API ───────────────────────────────────────────────────────

export async function findScholarships(input: FinderInput): Promise<ScholarshipSuggestion[]> {
  // 1. Match & rank from curated database
  const matched = matchAndRank(input, 12)

  // 2. Generate personalized "why you match" (AI-assisted, with fallback)
  const whyMap = await generateWhyMatch(matched, input)

  // 3. Map to suggestion format
  return matched.map(s => ({
    name: s.name,
    org: s.org,
    amount: s.amount,
    amountLabel: s.amountLabel,
    deadline: s.deadline,
    deadlineLabel: s.deadlineLabel,
    url: s.url,
    eligibility: s.eligibility,
    whyMatch: whyMap.get(s.id) ?? 'This scholarship matches your profile.',
    difficulty: s.difficulty,
    essayRequired: s.essayRequired,
    verified: true as const,
  }))
}
