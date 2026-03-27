import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { compareColleges } from '@/lib/services/collegeComparison'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { schools, major, gpa, gpa_weighted, sat, homeState } = await req.json()
    if (!schools?.length) return NextResponse.json([])

    const data = await compareColleges(schools, { major, gpa, gpa_weighted, sat, homeState })
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
