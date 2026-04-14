export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export default async function StudentsPage() {
  const { user, profile } = await getAuthUser()
  if (!user) redirect('/login')
  if (profile?.user_type !== 'counselor') redirect('/dashboard')

  const sb = await createClient()

  // Fetch linked students with profiles
  const { data: links } = await sb
    .from('counselor_students')
    .select('student_id, linked_at')
    .eq('counselor_id', user.id)
    .order('linked_at', { ascending: false })

  const studentIds = links?.map((l: { student_id: string }) => l.student_id) ?? []

  const { data: profiles } = studentIds.length
    ? await sb
        .from('profiles')
        .select('id, display_name, gpa, sat, act_score, proposed_major, grad_year, home_state')
        .in('id', studentIds)
    : { data: [] }

  // Fetch college counts per student
  const { data: colleges } = studentIds.length
    ? await sb
        .from('user_colleges')
        .select('user_id, college_name')
        .in('user_id', studentIds)
    : { data: [] }

  type CollegeRow = { user_id: string; college_name: string }
  const collegeCounts: Record<string, number> = {}
  for (const c of (colleges ?? []) as CollegeRow[]) {
    collegeCounts[c.user_id] = (collegeCounts[c.user_id] ?? 0) + 1
  }

  type StudentProfile = { id: string; display_name: string | null; gpa: number | null; sat: number | null; act_score: number | null; proposed_major: string | null; grad_year: number | null; home_state: string | null }
  type LinkRow = { student_id: string; linked_at: string }
  const students = ((profiles ?? []) as StudentProfile[]).map(p => ({
    ...p,
    linked_at: (links as LinkRow[] | null)?.find(l => l.student_id === p.id)?.linked_at ?? '',
    college_count: collegeCounts[p.id] ?? 0,
  }))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>Your Students</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {students.length} student{students.length !== 1 ? 's' : ''} linked
          </p>
        </div>
        <a
          href="/api/counselor/export"
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: 'var(--color-column)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', textDecoration: 'none',
          }}
        >
          Export CSV
        </a>
      </div>

      {students.length === 0 ? (
        <div className="card-elevated" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👩‍🏫</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No students linked yet</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
            Generate an invite code and share it with your students to get started.
          </p>
          <Link href="/invite" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>
            Generate Invite Code →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {students.map(s => (
            <Link
              key={s.id}
              href={`/students/${s.id}`}
              className="card-elevated"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 16,
                padding: '16px 20px',
                textDecoration: 'none',
                color: 'var(--color-text)',
                transition: 'border-color 0.15s',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.display_name ?? 'Unnamed Student'}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {s.grad_year && <span>Class of {s.grad_year}</span>}
                  {s.home_state && <span>{s.home_state}</span>}
                  {s.gpa != null && <span>GPA: {s.gpa}</span>}
                  {s.sat != null && <span>SAT: {s.sat}</span>}
                  {s.act_score != null && <span>ACT: {s.act_score}</span>}
                  {s.proposed_major && <span>{s.proposed_major}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>{s.college_count}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schools</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
