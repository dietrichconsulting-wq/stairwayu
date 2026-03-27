import { createClient } from '@/lib/supabase/server'
  import { requirePro } from '@/lib/subscription'
    import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

export async function POST(req: Request) {
  try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Subscription gate
        const { allowed, subscription } = await requirePro(user.id)
        if (!allowed) {
                return NextResponse.json({
                          error: 'Subscription required',
                          subscription,
                          upgrade_url: '/upgrade',
                }, { status: 403 })
        }
    
    const { school, essayType, major, gpa, gpa_weighted, sat, draft } = await req.json()

    if (!draft || draft.trim().length < 50) {
      return NextResponse.json({ error: 'Draft is too short to critique.' }, { status: 400 })
    }

    const wordCount = draft.trim().split(/\s+/).length

    const prompt = `You are a professional college admissions essay coach who has helped hundreds of students get into top universities. Provide a detailed, honest critique of this student's essay.

Essay context:
- School: ${school}
- Essay type: ${essayType}
- Student's intended major: ${major || 'Undecided'}
- Unweighted GPA: ${gpa || 'Not provided'} | Weighted GPA: ${gpa_weighted || 'Not provided'} | SAT: ${sat || 'Not provided'}
- Word count: ${wordCount}

ESSAY DRAFT:
"""
${draft}
"""

Provide a thorough critique. Be specific — reference actual lines or phrases from the essay.

Return ONLY a JSON object. No markdown, no explanation.
{
  "score": integer 1–10,
  "scoreLabel": "string (e.g. 'Strong Draft', 'Needs Work', 'Ready to Submit')",
  "summary": "string (2–3 sentence overall assessment)",
  "strengths": ["string", "string", "string"] (2–4 specific strengths with quotes from the essay),
  "improvements": [
    {
      "issue": "string (brief label)",
      "detail": "string (specific explanation referencing the essay)",
      "suggestion": "string (concrete rewrite or action to take)"
    }
  ],
  "openingFeedback": "string (specific feedback on the first sentence/paragraph)",
  "closingFeedback": "string (specific feedback on the final sentence/paragraph)",
  "voiceFeedback": "string (1–2 sentences on authenticity and voice)",
  "schoolFit": "string (1–2 sentences on how well it fits ${school}'s culture and values)"
}`

    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    const critique = JSON.parse(text)
    return NextResponse.json({ critique, wordCount })
  } catch (err) {
    console.error('Essay critique error:', err)
    return NextResponse.json({ error: 'Failed to critique. Try again.' }, { status: 500 })
  }
}
