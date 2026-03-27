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
    
    const body = await req.json()
    const { action, school, essayType, major, gpa, sat, answers } = body

    if (action === 'questions') {
      // Step 1: return tailored questions for the student to answer
      const prompt = `You are an expert college essay coach. A student is preparing a ${essayType} essay for ${school}.

Student profile:
- Intended major: ${major || 'Undecided'}
- GPA: ${gpa || 'Not provided'}
- SAT: ${sat || 'Not provided'}

Generate exactly 4 short, conversational questions to understand this student's unique story before suggesting essay prompts. The questions should:
1. Be specific to ${school} and ${essayType} (not generic)
2. Draw out experiences, values, and personality
3. Be easy to answer in 2–4 sentences each
4. Help surface compelling story angles

Return ONLY a JSON array of 4 question strings. No markdown, no explanation.
["question1", "question2", "question3", "question4"]`

      const result = await model.generateContent(prompt)
      let text = result.response.text().trim()
      if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      const questions = JSON.parse(text)
      return NextResponse.json({ questions })
    }

    if (action === 'prompts') {
      // Step 2: generate essay prompt ideas from answers
      const answersText = Object.entries(answers as Record<string, string>)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join('\n\n')

      const prompt = `You are an expert college essay coach. Generate specific essay prompt ideas for this student.

Essay details:
- School: ${school}
- Essay type: ${essayType}
- Intended major: ${major || 'Undecided'}

Student's answers to discovery questions:
${answersText}

Create exactly 4 distinct essay prompt ideas tailored to this student's specific experiences and ${school}'s culture/values. Each idea should:
- Have a punchy title (4–7 words)
- Reference something specific the student mentioned
- Explain the angle and why it works for ${school}
- Note the core theme to explore

Return ONLY a JSON array. No markdown, no explanation.
[
  {
    "title": "string",
    "hook": "string (one compelling opening sentence to start with)",
    "angle": "string (2–3 sentences explaining the essay approach)",
    "whyItWorks": "string (1 sentence on why this resonates with this specific school)"
  }
]`

      const result = await model.generateContent(prompt)
      let text = result.response.text().trim()
      if (text.startsWith('```')) text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      const prompts = JSON.parse(text)
      return NextResponse.json({ prompts })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Essay brainstorm error:', err)
    return NextResponse.json({ error: 'Failed to generate. Try again.' }, { status: 500 })
  }
}
