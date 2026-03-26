import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStrategy } from '@/lib/services/collegeStrategy'
import { requirePro } from '@/lib/subscription'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pro feature gate
    const { allowed, subscription } = await requirePro(user.id)
    if (!allowed) {
      return NextResponse.json({
        error: 'Pro subscription required',
        subscription,
        upgrade_url: '/upgrade',
      }, { status: 403 })
    }

    const body = await req.json()
    const result = await generateStrategy(body)

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
