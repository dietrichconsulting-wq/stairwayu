'use client'

import { useEffect, useState } from 'react'

interface Program {
  cipCode: string
  title: string
  completions: number
  earnings1yr: number | null
  earnings4yr: number | null
}

interface GradeInfo {
  score: number | null
  grade: string | null
}

const GRADE_ORDER: Record<string, number> = {
  'A+': 0, 'A': 1, 'A-': 2, 'B+': 3, 'B': 4, 'B-': 5, 'C': 6,
}

function gradeColor(grade: string | null): string {
  if (!grade) return ''
  if (grade.startsWith('A')) return 'text-emerald-300'
  if (grade.startsWith('B')) return 'text-yellow-300'
  return 'text-orange-300'
}

export function ProgramTable({
  programs,
  schoolName,
  ipedsId,
  totalPrograms,
}: {
  programs: Program[]
  schoolName: string
  ipedsId: string
  totalPrograms: number
}) {
  const [grades, setGrades] = useState<Record<string, GradeInfo>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (programs.length === 0) return
    const cipCodes = programs.map((p) => p.cipCode).join(',')

    fetch(`/api/colleges/grades?ipeds_id=${ipedsId}&cip_codes=${cipCodes}`)
      .then((r) => r.json())
      .then((data) => {
        setGrades(data.grades || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [programs, ipedsId])

  // Sort: graded programs first (by grade rank), then ungraded, then alphabetical tiebreak
  const sorted = [...programs].sort((a, b) => {
    const ga = grades[a.cipCode]?.grade
    const gb = grades[b.cipCode]?.grade
    const ra = ga ? GRADE_ORDER[ga] : 99
    const rb = gb ? GRADE_ORDER[gb] : 99
    if (ra !== rb) return ra - rb
    return a.title.localeCompare(b.title)
  })

  // If still loading, show programs in original order (by completions)
  const display = loading ? programs : sorted

  return (
    <section className="mx-auto max-w-5xl px-6 mt-12">
      <h2 className="text-2xl font-semibold mb-2">
        Popular programs at {schoolName}
      </h2>
      <p className="text-sm text-white/50 mb-5">
        Bachelor&rsquo;s degree programs ranked by Stairway Ranking — a composite
        letter grade comparing this school&rsquo;s program against every other
        school&rsquo;s in the same major nationally. Ties broken alphabetically.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">#</th>
              <th className="text-left py-3 px-4 font-medium">Program</th>
              <th className="text-center py-3 px-4 font-medium">
                Stairway Ranking
              </th>
              <th className="text-right py-3 px-4 font-medium">
                Graduates/yr
              </th>
              <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">
                Earnings (1yr)
              </th>
              <th className="text-right py-3 px-4 font-medium hidden md:table-cell">
                Earnings (4yr)
              </th>
            </tr>
          </thead>
          <tbody>
            {display.map((p, i) => {
              const g = grades[p.cipCode]
              return (
                <tr
                  key={p.cipCode}
                  className="border-b border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="py-3 px-4 text-white/40 font-mono text-xs">
                    {i + 1}
                  </td>
                  <td className="py-3 px-4 font-medium text-white/90">
                    {p.title}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">
                    {loading ? (
                      <span className="inline-block w-8 h-4 rounded bg-white/10 animate-pulse" />
                    ) : g?.grade ? (
                      <span className={gradeColor(g.grade)}>{g.grade}</span>
                    ) : (
                      <span className="text-white/30 font-normal">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-white/70">
                    {p.completions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-white/70 hidden sm:table-cell">
                    {p.earnings1yr ? (
                      `$${p.earnings1yr.toLocaleString()}`
                    ) : (
                      <span className="text-white/30">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right text-white/70 hidden md:table-cell">
                    {p.earnings4yr ? (
                      `$${p.earnings4yr.toLocaleString()}`
                    ) : (
                      <span className="text-white/30">N/A</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPrograms > 20 && (
        <p className="text-xs text-white/40 mt-3 text-center">
          Showing top 20 of {totalPrograms} programs
        </p>
      )}
    </section>
  )
}
