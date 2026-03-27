import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

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

export async function findScholarships(input: FinderInput): Promise<ScholarshipSuggestion[]> {
  const m = getModel()
  if (!m) throw new Error('AI not available — check GEMINI_API_KEY')

  const prompt = `You are a college scholarship advisor. Based on the student profile below, suggest exactly 10 real, currently-active scholarships they should apply for. Only include scholarships that genuinely exist and where you are highly confident in the application URL.

Student Profile:
- Unweighted GPA: ${input.gpa ?? 'not provided'} | Weighted GPA: ${input.gpa_weighted ?? 'not provided'}
- SAT: ${input.sat ?? 'not provided'} / ACT: ${input.act ?? 'not provided'}
- Intended Major: ${input.major || 'undecided'}
- Home State: ${input.homeState || 'not provided'}
- Graduation Year: ${input.gradYear || 'not provided'}
- Extracurriculars: ${input.extracurriculars || 'not specified'}
- Career Interests: ${input.careerInterests || 'not specified'}
- Background / Identity: ${input.background || 'not specified'}
- Special Circumstances: ${input.circumstances || 'not specified'}

Rules:
- Mix national and state-specific scholarships
- Include at least 3 Easy (no-essay or very short) scholarships
- Include major national scholarships (Gates, Coca-Cola, Dell Scholars, etc.) if the student seems competitive
- Include STEM, arts, or community scholarships if relevant to major/interests
- For amount: use 0 if it varies/unknown, otherwise an integer USD amount per year
- For deadline: ISO date (YYYY-MM-DD) if known, null if rolling
- For url: direct application page, not a search page
- Make whyMatch specific to this student's profile, not generic

Return ONLY a valid JSON array — no markdown fences, no explanation before or after:
[
  {
    "name": "Scholarship Name",
    "org": "Organization",
    "amount": 5000,
    "amountLabel": "$5,000",
    "deadline": "2025-11-15",
    "deadlineLabel": "November 15, 2025",
    "url": "https://...",
    "eligibility": "One sentence describing who qualifies.",
    "whyMatch": "Specific reason this student is a match.",
    "difficulty": "Easy",
    "essayRequired": false
  }
]`

  const result = await m.generateContent(prompt)
  const text = result.response.text()

  // Strip markdown fences if present
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(cleaned)
  return Array.isArray(parsed) ? parsed.slice(0, 12) : []
}
