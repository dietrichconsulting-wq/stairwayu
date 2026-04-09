import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStrategy } from '@/lib/services/collegeStrategy'
import { getSubscription } from '@/lib/subscription'
import { checkAiRateLimit } from '@/lib/rateLimit'
import { recordAiUsage, FREE_DAILY_AI_LIMIT } from '@/lib/usage'
import { strategySchema, parseBody } from '@/lib/validations'

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
        error: 'You\u2019ve used all 3 free AI calls today. Upgrade to Pro for unlimited.',
        limit: FREE_DAILY_AI_LIMIT,
        upgrade_url: '/upgrade',
      }, { status: 429 })
    }

    const raw = await req.json()
    const parsed = parseBody(strategySchema, raw)
    if ('error' in parsed) return parsed.error

    // Look up the user's home state so the aggregator can use in-state tuition.
    const { data: profile } = await supabase
      .from('profiles')
      .select('home_state')
      .eq('id', user.id)
      .single()

    const result = await generateStrategy({
      ...(parsed.data as Parameters<typeof generateStrategy>[0]),
      homeState: profile?.home_state ?? null,
    })

    // Persist so it survives logout/login
    await supabase.from('profiles').update({
      strategy_result: result,
      strategy_generated_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('[strategy/generate]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
