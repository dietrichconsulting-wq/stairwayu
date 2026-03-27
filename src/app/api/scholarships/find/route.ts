import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePro } from '@/lib/subscription'
import { findScholarships } from '@/lib/services/scholarshipFinder'

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
    const results = await findScholarships(body)
    return NextResponse.json(results)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
