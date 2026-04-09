import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCollegeBySlug,
  getSimilarColleges,
  getTopCollegeSlugs,
  fmtMoney,
  fmtNum,
  fmtPct,
} from '@/lib/colleges'

export const revalidate = 86400 // 1 day ISR
export const dynamicParams = true

const SITE = 'https://stairwayu.com'

export async function generateStaticParams() {
  const slugs = await getTopCollegeSlugs(500)
  return slugs.map((slug) => ({ slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const c = await getCollegeBySlug(slug)
  if (!c) return { title: 'College not found' }

  const admit = c.admission_rate != null ? `${c.admission_rate}%` : 'unavailable'
  const sat = c.avg_sat ? `${c.avg_sat}` : 'N/A'
  const net = c.avg_net_price ? `$${c.avg_net_price.toLocaleString()}` : 'N/A'

  return {
    title: `${c.name} — Acceptance Rate, SAT/ACT & Cost`,
    description: `${c.name} acceptance rate is ${admit}. Average SAT ${sat}. Average net price ${net}. Calculate your real chances on Stairway U — powered by U.S. Dept of Education data.`,
    alternates: { canonical: `${SITE}/colleges/${c.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE}/colleges/${c.slug}`,
      title: `${c.name} — Acceptance Rate, SAT/ACT & Cost`,
      description: `${c.name} acceptance rate is ${admit}. Average SAT ${sat}. Average net price ${net}.`,
      siteName: 'Stairway U',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${c.name} — Acceptance Rate, SAT/ACT & Cost`,
      description: `${c.name}: ${admit} acceptance rate, avg SAT ${sat}, net price ${net}.`,
    },
  }
}

export default async function CollegePage({ params }: PageProps) {
  const { slug } = await params
  const c = await getCollegeBySlug(slug)
  if (!c) notFound()

  const similar = await getSimilarColleges(c)

  const faqs = [
    {
      q: `What is the acceptance rate at ${c.name}?`,
      a: c.admission_rate != null
        ? `${c.name} has an acceptance rate of ${c.admission_rate}% according to the most recent U.S. Department of Education data.`
        : `Acceptance rate data for ${c.name} is not currently published by the U.S. Department of Education.`,
    },
    {
      q: `What SAT score do I need for ${c.name}?`,
      a: c.sat_25 && c.sat_75
        ? `Admitted students at ${c.name} typically score between ${c.sat_25} and ${c.sat_75} on the SAT (25th–75th percentile).`
        : c.avg_sat
          ? `The average SAT score at ${c.name} is approximately ${c.avg_sat}.`
          : `SAT score data for ${c.name} is not currently published.`,
    },
    {
      q: `How much does ${c.name} cost?`,
      a: c.avg_net_price
        ? `The average net price (after grants and scholarships) at ${c.name} is approximately $${c.avg_net_price.toLocaleString()} per year.`
        : `Net price data for ${c.name} is not currently published.`,
    },
    {
      q: `What is the graduation rate at ${c.name}?`,
      a: c.grad_rate_4yr != null
        ? `${c.grad_rate_4yr}% of students graduate from ${c.name} within four years.`
        : `4-year graduation rate data for ${c.name} is not currently published.`,
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${SITE}/colleges/${c.slug}#org`,
        name: c.name,
        url: `${SITE}/colleges/${c.slug}`,
        sameAs: c.url ? [c.url.startsWith('http') ? c.url : `https://${c.url}`] : undefined,
        address: c.city || c.state ? {
          '@type': 'PostalAddress',
          addressLocality: c.city || undefined,
          addressRegion: c.state || undefined,
          addressCountry: 'US',
        } : undefined,
        numberOfStudents: c.enrollment || undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Stairway U', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Colleges', item: `${SITE}/colleges` },
          { '@type': 'ListItem', position: 3, name: c.name, item: `${SITE}/colleges/${c.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#0c0e14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-5xl px-6 pt-8 text-sm text-white/50">
        <Link href="/" className="hover:text-white">Stairway U</Link>
        <span className="mx-2">/</span>
        <Link href="/colleges" className="hover:text-white">Colleges</Link>
        <span className="mx-2">/</span>
        <span className="text-white/80">{c.name}</span>
      </nav>

      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 pt-6 pb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{c.name}</h1>
        {(c.city || c.state) && (
          <p className="mt-3 text-lg text-white/60">
            {[c.city, c.state].filter(Boolean).join(', ')} · {c.control}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Link
            href={`/colleges/${c.slug}/chances`}
            className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-400"
          >
            Calculate Your Chances →
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            Add to My List
          </Link>
        </div>
      </header>

      {/* Stats grid */}
      <section className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Acceptance rate" value={fmtPct(c.admission_rate)} />
          <Stat label="Average SAT" value={fmtNum(c.avg_sat)} />
          <Stat label="ACT midpoint" value={fmtNum(c.act_midpoint)} />
          <Stat label="Enrollment" value={fmtNum(c.enrollment)} />
          <Stat label="In-state tuition" value={fmtMoney(c.tuition_in_state)} />
          <Stat label="Out-of-state tuition" value={fmtMoney(c.tuition_out_of_state)} />
          <Stat label="Avg net price" value={fmtMoney(c.avg_net_price)} />
          <Stat label="4-yr grad rate" value={fmtPct(c.grad_rate_4yr)} />
        </div>
      </section>

      {/* Summary */}
      {c.summary && (
        <section className="mx-auto max-w-5xl px-6 mt-12">
          <h2 className="text-2xl font-semibold mb-4">About {c.name}</h2>
          <div className="prose prose-invert max-w-none whitespace-pre-line text-white/75">
            {c.summary}
          </div>
        </section>
      )}

      {/* SAT/ACT detail */}
      {(c.sat_25 || c.sat_75 || c.act_midpoint) && (
        <section className="mx-auto max-w-5xl px-6 mt-12">
          <h2 className="text-2xl font-semibold mb-4">Test scores</h2>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
            {c.sat_25 && c.sat_75 && (
              <p className="text-white/80">
                Admitted students score between <b>{c.sat_25}</b> and <b>{c.sat_75}</b> on the SAT (25th–75th percentile).
              </p>
            )}
            {c.act_midpoint && (
              <p className="text-white/80 mt-2">
                ACT midpoint: <b>{c.act_midpoint}</b>
              </p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 mt-12">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <summary className="cursor-pointer font-semibold text-white/90">{f.q}</summary>
              <p className="mt-3 text-white/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Similar colleges */}
      {similar.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 mt-12">
          <h2 className="text-2xl font-semibold mb-4">Similar colleges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {similar.map((s) => (
              <Link
                key={s.ipeds_id}
                href={`/colleges/${s.slug}`}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05]"
              >
                <div className="font-semibold text-white">{s.name}</div>
                <div className="text-sm text-white/50 mt-1">
                  {[s.city, s.state].filter(Boolean).join(', ')}
                </div>
                <div className="text-sm text-white/60 mt-2">
                  {fmtPct(s.admission_rate)} acceptance · SAT {fmtNum(s.avg_sat)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="mx-auto max-w-5xl px-6 my-16">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Get your real odds at {c.name}</h2>
          <p className="mt-2 text-white/70">
            Connect your GPA and test scores to see exactly how you stack up.
          </p>
          <Link
            href={`/colleges/${c.slug}/chances`}
            className="mt-5 inline-block rounded-lg bg-blue-500 px-6 py-3 font-semibold hover:bg-blue-400"
          >
            Calculate My Chances →
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-white/40">
          Data: U.S. Department of Education, College Scorecard. Last updated {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : 'recently'}.
        </p>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
