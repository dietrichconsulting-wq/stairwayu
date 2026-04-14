import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const { user, profile } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (profile?.user_type !== 'counselor') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const sb = await createClient()

  // Fetch linked students
  const { data: links } = await sb
    .from('counselor_students')
    .select('student_id')
    .eq('counselor_id', user.id)

  if (!links?.length) {
    return new Response('No students linked yet.\n', {
      status: 200,
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="students-export.csv"' },
    })
  }

  const studentIds = links.map((l: { student_id: string }) => l.student_id)

  // Fetch profiles
  const { data: profiles } = await sb
    .from('profiles')
    .select('id, display_name, gpa, sat, act_score, proposed_major, grad_year, home_state')
    .in('id', studentIds)

  // Fetch colleges for all students
  const { data: colleges } = await sb
    .from('user_colleges')
    .select('user_id, college_name, sort_order')
    .in('user_id', studentIds)
    .order('sort_order', { ascending: true })

  // Build CSV
  type Prof = { id: string; display_name: string | null; gpa: number | null; sat: number | null; act_score: number | null; proposed_major: string | null; grad_year: number | null; home_state: string | null }
  type Col = { user_id: string; college_name: string; sort_order: number }
  const header = 'Student Name,Grad Year,State,GPA,SAT,ACT,Major,Colleges'
  const rows = ((profiles ?? []) as Prof[]).map((p: Prof) => {
    const studentColleges = ((colleges ?? []) as Col[])
      .filter((c: Col) => c.user_id === p.id)
      .map((c: Col) => c.college_name)
      .join('; ')
    return [
      `"${(p.display_name ?? '').replace(/"/g, '""')}"`,
      p.grad_year ?? '',
      p.home_state ?? '',
      p.gpa ?? '',
      p.sat ?? '',
      p.act_score ?? '',
      `"${(p.proposed_major ?? '').replace(/"/g, '""')}"`,
      `"${studentColleges.replace(/"/g, '""')}"`,
    ].join(',')
  })

  const csv = [header, ...rows].join('\n')
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="stairwayu-students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
