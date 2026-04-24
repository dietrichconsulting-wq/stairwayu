import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCollegeBySlug, getTopCollegeSlugs, fmtNum, fmtPct } from '@/lib/colleges'
import { ChancesCalculator } from '@/components/colleges/ChancesCalculator'
import { CollegeHeader } from '@/components/colleges/CollegeHeader'
import { ProUpsell } from '@/components/colleges/ProUpsell'

export const revalidate = 86400
export const dynamicParams = true

import { SITE_URL as SITE } from '@/lib/siteConfig'

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

  const admit = c.admission_rate != null ? `${c.admission_rate}%` : 'unknown'
  const sat = c.avg_sat ? `${c.avg_sat}` : 'N/A'

  return {
    title: `${c.name} Admission Chances Calculator`,
    description: `Estimate your admission chances at ${c.name}. Acceptance rate ${admit}, average SAT ${sat}. Free chancing tool powered by U.S. Dept of Education data.`,
    alternates: { canonical: `${SITE}/colleges/${c.slug}/chances` },
    openGraph: {
      type: 'article',
      url: `${SITE}/colleges/${c.slug}/chances`,
      title: `${c.name} Admission Chances Calculator`,
      description: `Acceptance rate ${admit}, average SAT ${sat}. Estimate your admission chances.`,
      siteName: 'Stairway U',
    },
  }
}

export default async function ChancesPage({ params }: PageProps) {
  const { slug } = await params
  const c = await getCollegeBySlug(slug)
  if (!c) notFound()

  const faqs = [
    {
      q: `How are my chances at ${c.name} calculated?`,
      a: `Stairway U compares your GPA, SAT, and ACT scores to the published 25th–75th percentile ranges from the U.S. Department of Education's College Scorecard, then adjusts for the school's overall acceptance rate of ${c.admission_rate ?? '—'}%.`,
    },
    {
      q: `What GPA do I need for ${c.name}?`,
      a: `${c.name} does not publish a hard GPA cutoff. Strong applicants typically present a GPA in line with the school's selectivity (acceptance rate ${c.admission_rate ?? '—'}%) and SAT scores in the ${c.sat_25 ?? '—'}–${c.sat_75 ?? '—'} range.`,
    },
    {
      q: `Can I improve my chances at ${c.name}?`,
      a: `Yes. Score-band analysis on Stairway U shows exactly how many points on the SAT or ACT translate into a meaningfully higher chance of admission, based on ${c.name}'s published score distribution.`,
    },
    {
      q: `Is the chancing data accurate?`,
      a: `All admission rates, SAT, and ACT figures come directly from the U.S. Department of Education's College Scorecard, which sources data from IPEDS. Stairway U does not invent or scrape data. This tool compares your academic profile to the published statistics of admitted students. It is not a prediction engine — admission decisions depend on many factors beyond test scores and GPA, including essays, recommendations, extracurriculars, and institutional priorities that are not captured in public data.`,
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Stairway U', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Colleges', item: `${SITE}/colleges` },
          { '@type': 'ListItem', position: 3, name: c.name, item: `${SITE}/colleges/${c.slug}` },
          { '@type': 'ListItem', position: 4, name: 'Chances', item: `${SITE}/colleges/${c.slug}/chances` },
        ],
      },
      {
        '@type': 'WebApplication',
        name: `${c.name} Admission Chances Calculator`,
        url: `${SITE}/colleges/${c.slug}/chances`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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

      <CollegeHeader />

      <nav className="mx-auto max-w-5xl px-6 pt-8 text-sm text-white/50">
        <Link href="/" className="hover:text-white">Stairway U</Link>
        <span className="mx-2">/</span>
        <Link href="/colleges" className="hover:text-white">Colleges</Link>
        <span className="mx-2">/</span>
        <Link href={`/colleges/${c.slug}`} className="hover:text-white">{c.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-white/80">Chances</span>
      </nav>

      <header className="mx-auto max-w-5xl px-6 pt-6 pb-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {c.name} Admission Chances
        </h1>
        <p className="mt-3 text-lg text-white/60">
          Estimate based on official U.S. Department of Education data.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Acceptance rate" value={fmtPct(c.admission_rate)} />
          <Stat label="SAT 25th" value={fmtNum(c.sat_25)} />
          <Stat label="SAT 75th" value={fmtNum(c.sat_75)} />
          <Stat label="ACT midpoint" value={fmtNum(c.act_midpoint)} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 mt-10">
        <ChancesCalculator
          schoolName={c.name}
          schoolSlug={c.slug}
          admissionRate={c.admission_rate}
          sat25={c.sat_25}
          sat75={c.sat_75}
          actMidpoint={c.act_midpoint}
          ipedsId={c.ipeds_id}
        />
      </section>

      <section className="mx-auto max-w-5xl px-6 mt-12">
        <h2 className="text-2xl font-semibold mb-4">About {c.name} admissions</h2>
        <p className="text-white/75 leading-relaxed">
          {c.name} {c.admission_rate != null && <>admits about <b>{c.admission_rate}%</b> of applicants. </>}
          {c.sat_25 && c.sat_75 && (
            <>The middle 50% of admitted students score between <b>{c.sat_25}</b> and <b>{c.sat_75}</b> on the SAT. </>
          )}
          {c.act_midpoint && <>The ACT midpoint is <b>{c.act_midpoint}</b>. </>}
          These figures come directly from the U.S. Department of Education's College Scorecard and reflect the most recently reported cohort.
        </p>
      </section>

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

      <ProUpsell schoolName={c.name} />

      <section className="mx-auto max-w-5xl px-6 my-12 text-center">
        <Link href={`/colleges/${c.slug}`} className="text-blue-400 hover:text-blue-300">
          ← Back to {c.name} overview
        </Link>
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
