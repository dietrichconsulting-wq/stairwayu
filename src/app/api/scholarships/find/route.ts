import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/subscription'
import { findScholarships } from '@/lib/services/scholarshipFinder'
import { checkAiRateLimit } from '@/lib/rateLimit'
import { recordAiUsage, FREE_DAILY_AI_LIMIT } from '@/lib/usage'
import { scholarshipsSchema, parseBody } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit
    const rateLimited = await checkAiRateLimit(user.id)
    if (rateLimited) return rateLimited

    // Usage limit (free tier: 3/day, pro: unlimited)
    const subscription = await getSubscription(user.id)
    const allowed = await recordAiUsage(user.id, subscription.isPro)
    if (!allowed) {
      return NextResponse.json({
        error: 'Daily AI limit reached',
        limit: FREE_DAILY_AI_LIMIT,
        upgrade_url: '/upgrade',
      }, { status: 429 })
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
