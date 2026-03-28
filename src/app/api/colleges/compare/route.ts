import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareColleges } from '@/lib/services/collegeComparison'
import { compareSchema, parseBody } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const raw = await req.json()
    const parsed = parseBody(compareSchema, raw)
    if ('error' in parsed) return parsed.error
    const { schools, major, gpa, gpa_weighted, sat, homeState } = parsed.data

    const data = await compareColleges(schools, { major, gpa, gpa_weighted, sat, homeState })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
