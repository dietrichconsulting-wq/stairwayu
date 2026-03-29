import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePro } from '@/lib/subscription'
import { findScholarships } from '@/lib/services/scholarshipFinder'
import { checkAiRateLimit } from '@/lib/rateLimit'
import { deductCredits, getCredits, CREDITS_PER_AI_CALL } from '@/lib/credits'
import { scholarshipsSchema, parseBody } from '@/lib/validations'

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

        // Rate limit
        const rateLimited = await checkAiRateLimit(user.id)
        if (rateLimited) return rateLimited

    // Credit check & deduction
    const credits = await getCredits(user.id)
    if (credits.balance < CREDITS_PER_AI_CALL) {
      return NextResponse.json({
        error: 'Insufficient credits',
        balance: credits.balance,
        required: CREDITS_PER_AI_CALL,
        purchase_url: '/api/credits/purchase',
      }, { status: 402 })
    }
    const deducted = await deductCredits(user.id)
    if (!deducted) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    const raw = await req.json()
    const parsed = parseBody(scholarshipsSchema, raw)
    if ('error' in parsed) return parsed.error
    const results = await findScholarships(parsed.data)
    return NextResponse.json(results)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
