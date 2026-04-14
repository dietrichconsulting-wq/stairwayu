export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAuthUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { calculateChance } from '@/lib/services/admissionChance'
import { getCollege } from '@/lib/services/collegeScorecard'
import type { UserCollege } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ studentId: string }>
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { studentId } = await params
  const { user, profile: counselorProfile } = await getAuthUser()
  if (!user) redirect('/login')
  if (counselorProfile?.user_type !== 'counselor') redirect('/dashboard')

  const sb = await createClient()

  // Verify this student is linked to this counselor (RLS handles this — empty result if not)
  const { data: link } = await sb
    .from('counselor_students')
    .select('id')
    .eq('counselor_id', user.id)
    .eq('student_id', studentId)
    .single()

  if (!link) redirect('/students')

  // Fetch student profile
  const { data: student } = await sb
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!student) redirect('/students')

  // Fetch student's saved colleges
  const { data: savedColleges } = await sb
    .from('user_colleges')
    .select('*')
    .eq('user_id', studentId)
    .order('sort_order', { ascending: true })

  // Enrich each college with scorecard data + admission chance
  const enriched = await Promise.all(
    (savedColleges ?? []).map(async (sc: UserCollege) => {
      if (!sc.college_id) return { ...sc, college: null, chance: null }
      const college = await getCollege(sc.college_id)
      if (!college) return { ...sc, college: null, chance: null }

      const result = calculateChance(
        student.sat,
        student.gpa,
        college,
        student.act_score,
        student.gpa_weighted,
        student.ec_entries,
      )

      return { ...sc, college, chance: result?.chance ?? null }
    })
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
      <Link href="/students" style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 20, display: 'inline-block' }}>
        ← Back to Students
      </Link>

      {/* Student header */}
      <div className="card-elevated" style={{ padding: '24px 28px', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{student.display_name ?? 'Unnamed Student'}</h1>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
          {student.grad_year && <span><strong>Class:</strong> {student.grad_year}</span>}
          {student.home_state && <span><strong>State:</strong> {student.home_state}</span>}
          {student.gpa != null && <span><strong>GPA:</strong> {student.gpa}{student.gpa_weighted ? ` (${student.gpa_weighted}W)` : ''}</span>}
          {student.sat != null && <span><strong>SAT:</strong> {student.sat}</span>}
          {student.act_score != null && <span><strong>ACT:</strong> {student.act_score}</span>}
          {student.proposed_major && <span><strong>Major:</strong> {student.proposed_major}</span>}
        </div>
      </div>

      {/* College list */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
        College List ({enriched.length} school{enriched.length !== 1 ? 's' : ''})
      </h2>

      {enriched.length === 0 ? (
        <div className="card-elevated" style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          This student hasn&apos;t added any colleges yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {enriched.map((item, i) => {
            const label = item.chance != null
              ? item.chance >= 65 ? 'Safety' : item.chance >= 35 ? 'Target' : 'Reach'
              : null
            const color = label === 'Safety' ? '#22c55e' : label === 'Target' ? '#f59e0b' : label === 'Reach' ? '#ef4444' : '#888'

            return (
              <div
                key={item.id}
                className="card-elevated"
                style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16, padding: '14px 20px' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', width: 24 }}>{i + 1}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{item.college_name}</div>
                  {item.college && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {item.college.admission_rate != null && `${item.college.admission_rate}% admit rate`}
                      {item.college.avg_net_price != null && ` · $${item.college.avg_net_price.toLocaleString()} avg net price`}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {item.chance != null && (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 800, color }}>~{item.chance}%</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>{label}</div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 16 }}>
        Profile comparison based on published GPA &amp; test-score ranges from the U.S. Dept of Education. Does not factor in essays, recommendations, or other holistic review criteria.
      </p>
    </div>
  )
}
