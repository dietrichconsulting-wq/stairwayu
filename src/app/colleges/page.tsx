import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { fmtPct } from '@/lib/colleges'

export const revalidate = 3600

const SITE = 'https://stairwayu.com'

export const metadata: Metadata = {
  title: 'Browse Colleges — Acceptance Rates, SAT Scores & Cost',
  description:
    'Browse 1,500+ U.S. colleges with admission rates, SAT/ACT scores, tuition, and net price from the U.S. Department of Education. Calculate your real chances on Stairway U.',
  alternates: { canonical: `${SITE}/colleges` },
}

export default async function CollegesIndex() {
  const sb = await createClient()
  const { data } = await sb
    .from('colleges')
    .select('slug, name, city, state, admission_rate, popularity')
    .order('popularity', { ascending: false })
    .limit(200)

  const colleges = (data || []) as Array<{
    slug: string
    name: string
    city: string | null
    state: string | null
    admission_rate: number | null
  }>

  return (
    <main className="min-h-screen bg-[#0c0e14] text-white">
      <header className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Browse Colleges</h1>
        <p className="mt-3 text-lg text-white/60">
          Acceptance rates, SAT scores, and cost data for 1,500+ U.S. colleges. Pulled from the U.S. Department of Education's College Scorecard.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colleges.map((c) => (
            <Link
              key={c.slug}
              href={`/colleges/${c.slug}`}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05]"
            >
              <div className="font-semibold text-white">{c.name}</div>
              <div className="text-sm text-white/50 mt-1">
                {[c.city, c.state].filter(Boolean).join(', ')}
              </div>
              <div className="text-sm text-white/60 mt-2">
                {fmtPct(c.admission_rate)} acceptance rate
              </div>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-white/40 mt-10 mb-12">
          Showing top 200 by enrollment. Data: U.S. Department of Education, College Scorecard.
        </p>
      </section>
    </main>
  )
}
