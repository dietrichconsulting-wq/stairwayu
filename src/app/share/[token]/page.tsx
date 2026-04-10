import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { fmtMoney, fmtPct } from '@/lib/colleges'

export const revalidate = 0 // always fresh — view_count matters

const SITE = 'https://stairwayu.com'

interface ShareLink {
  id: string
  user_id: string
  token: string
  label: string | null
  show_schools: boolean
  show_odds: boolean
  show_costs: boolean
  show_progress: boolean
  view_count: number
  gift_clicks: number
  active: boolean
}

interface UserCollege {
  college_name: string
  college_id: string | null
  sort_order: number
}

interface CollegeRow {
  ipeds_id: string
  slug: string
  name: string
  admission_rate: number | null
  avg_sat: number | null
  avg_net_price: number | null
  tuition_in_state: number | null
  tuition_out_of_state: number | null
  grad_rate_4yr: number | null
  median_earnings_10yr: number | null
}

interface PageProps {
  params: Promise<{ token: string }>
}

async function getShareData(token: string) {
  const sb = await createServiceClient()

  // 1. Get the share link
  const { data: link } = await sb
    .from('share_links')
    .select('*')
    .eq('token', token)
    .eq('active', true)
    .single()
  if (!link) return null

  // 2. Increment view count (fire-and-forget)
  sb.from('share_links')
    .update({ view_count: (link as ShareLink).view_count + 1 })
    .eq('id', link.id)
    .then()

  // 3. Get profile
  const { data: profile } = await sb
    .from('profiles')
    .select('display_name, gpa, sat, act_score, proposed_major, grad_year, home_state')
    .eq('id', link.user_id)
    .single()

  // 4. Get schools
  const { data: userSchools } = await sb
    .from('user_colleges')
    .select('college_name, college_id, sort_order')
    .eq('user_id', link.user_id)
    .order('sort_order', { ascending: true })

  // 5. Enrich with college data
  const collegeIds = ((userSchools || []) as UserCollege[])
    .map((s) => s.college_id)
    .filter(Boolean) as string[]

  let colleges: CollegeRow[] = []
  if (collegeIds.length > 0) {
    const { data } = await sb
      .from('colleges')
      .select('ipeds_id, slug, name, admission_rate, avg_sat, avg_net_price, tuition_in_state, tuition_out_of_state, grad_rate_4yr, median_earnings_10yr')
      .in('ipeds_id', collegeIds)
    colleges = (data || []) as CollegeRow[]
  }

  return {
    link: link as ShareLink,
    profile: profile as { display_name: string | null; gpa: number | null; sat: number | null; act_score: number | null; proposed_major: string | null; grad_year: number | null; home_state: string | null } | null,
    userSchools: (userSchools || []) as UserCollege[],
    colleges,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const data = await getShareData(token)
  if (!data) return { title: 'Share link not found' }
  const name = data.profile?.display_name || 'A Student'
  return {
    title: `${name}'s College Plan — Stairway U`,
    description: `See ${name}'s college list, admission odds, and estimated costs. Help fund their future.`,
    robots: { index: false, follow: false }, // private share links shouldn't be indexed
  }
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params
  const data = await getShareData(token)
  if (!data) notFound()

  const { link, profile, userSchools, colleges } = data
  const name = profile?.display_name?.split(' ')[0] || 'This student'
  const fullName = profile?.display_name || 'This student'
  const collegeMap = new Map(colleges.map((c) => [c.ipeds_id, c]))

  // Estimated total cost (avg net price × 4 across all schools, averaged)
  const costs = colleges.map((c) => c.avg_net_price).filter(Boolean) as number[]
  const avgCost4yr = costs.length > 0
    ? Math.round((costs.reduce((a, b) => a + b, 0) / costs.length) * 4)
    : null

  return (
    <main className="min-h-screen bg-[#0c0e14] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0c0e14]/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-8 w-auto" />
          </Link>
          <Link
            href="/signup?ref=share"
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-white/90"
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Profile card */}
      <section className="mx-auto max-w-3xl px-6 pt-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          {/* Avatar circle with initials */}
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-bold text-white">
            {(profile?.display_name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold">{fullName}</h1>
          <p className="mt-1 text-white/50">
            {[
              profile?.grad_year ? `Class of ${profile.grad_year}` : null,
              profile?.home_state,
              profile?.proposed_major,
            ].filter(Boolean).join(' · ')}
          </p>
        </div>
      </section>

      {/* School list */}
      {link.show_schools && userSchools.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {name}&apos;s college list
          </h2>
          <div className="space-y-3">
            {userSchools.map((us, i) => {
              const c = us.college_id ? collegeMap.get(us.college_id) : null
              return (
                <div
                  key={us.college_name}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/30">#{i + 1}</span>
                        {c ? (
                          <Link href={`/colleges/${c.slug}`} className="font-semibold text-white hover:text-blue-400">
                            {us.college_name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-white">{us.college_name}</span>
                        )}
                      </div>
                      {c && (
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/50">
                          {link.show_odds && c.admission_rate != null && (
                            <span>{fmtPct(c.admission_rate)} acceptance</span>
                          )}
                          {link.show_costs && c.avg_net_price != null && (
                            <span>{fmtMoney(c.avg_net_price)}/yr avg net</span>
                          )}
                          {c.grad_rate_4yr != null && (
                            <span>{fmtPct(c.grad_rate_4yr)} grad rate</span>
                          )}
                          {c.median_earnings_10yr != null && (
                            <span>{fmtMoney(c.median_earnings_10yr)} median earnings</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Cost summary */}
      {link.show_costs && avgCost4yr && (
        <section className="mx-auto max-w-3xl px-6 mt-8">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300/80 mb-2">
              Estimated 4-year cost
            </div>
            <div className="text-4xl font-black text-white">
              {fmtMoney(avgCost4yr)}
            </div>
            <p className="mt-2 text-sm text-white/50">
              Average net price across {name}&apos;s {colleges.length} schools × 4 years.
              Net price = tuition minus grants and scholarships (U.S. Dept of Education data).
            </p>
          </div>
        </section>
      )}

      {/* Gift CTA */}
      <section className="mx-auto max-w-3xl px-6 mt-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-teal-400/10 p-8 text-center">
          <div className="text-3xl mb-3">🎓</div>
          <h2 className="text-2xl font-bold">
            Help fund {name}&apos;s future
          </h2>
          <p className="mt-2 text-white/60 max-w-md mx-auto">
            Instead of a gift card, contribute to {name}&apos;s college fund.
            Every dollar in a 529 plan grows tax-free and goes directly toward tuition, room &amp; board, and books.
          </p>
          <Link
            href="/gift"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-bold text-slate-900 hover:bg-white/90"
          >
            Learn How to Contribute →
          </Link>
          <p className="mt-3 text-xs text-white/30">
            529 contributions are tax-advantaged in most states
          </p>
        </div>
      </section>

      {/* What is Stairway U */}
      <section className="mx-auto max-w-3xl px-6 mt-8 mb-16">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h3 className="text-sm font-bold text-white/80 mb-2">What is Stairway U?</h3>
          <p className="text-sm text-white/50 leading-relaxed">
            Stairway U is a college planning dashboard that shows students their real admission odds,
            finds scholarships, coaches essays, and tracks every deadline — all powered by
            U.S. Department of Education data. Families use it to plan together.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              Learn more →
            </Link>
            <Link href="/parents" className="text-sm font-semibold text-blue-400 hover:text-blue-300">
              For parents →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
