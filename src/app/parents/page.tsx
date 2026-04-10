import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { HeroCalculator } from '@/components/HeroCalculator'

const SITE = 'https://stairwayu.com'
const SIGNUP = '/signup?ref=parents'

export const metadata: Metadata = {
  title: 'College Planning for Parents — Real Odds, Real Costs',
  description:
    'See your child\'s real admission chances at every college, understand what it will actually cost, and track every deadline — one dashboard powered by federal data. Free to start.',
  alternates: { canonical: `${SITE}/parents` },
  keywords: [
    'college planning for parents',
    'college cost calculator parents',
    'will my kid get into college',
    'college admission chances for parents',
    'college financial planning family',
    'how much will college cost',
    'FAFSA parent guide',
    'college acceptance rate calculator',
  ],
  openGraph: {
    type: 'website',
    url: `${SITE}/parents`,
    title: 'College Planning for Parents — Real Odds, Real Costs',
    description: 'See your child\'s real chances and what college will actually cost. Free dashboard powered by federal data.',
    siteName: 'Stairway U',
  },
}

const PAIN_POINTS = [
  {
    icon: '🎯',
    title: 'Will they get in?',
    desc: 'Real admission odds for every school on their list — based on your child\'s GPA and test scores vs. the school\'s published 25th–75th percentile range. Federal data, not guesses.',
  },
  {
    icon: '💰',
    title: 'What will it actually cost us?',
    desc: 'Net price by income bracket, 529 growth projections, tuition inflation estimates, and loan scenarios. Side-by-side for every school, so you can compare apples to apples.',
  },
  {
    icon: '📋',
    title: 'Are we on track?',
    desc: 'A visual journey from sophomore year to Decision Day. Every milestone, every deadline, every task — checked off as your student completes them. You see the progress without hovering.',
  },
  {
    icon: '✍️',
    title: 'Are the essays done?',
    desc: 'AI-powered essay coaching helps your student find their angle, refine their drafts, and hit every prompt. You can see which essays are in progress and which are submitted.',
  },
  {
    icon: '🎓',
    title: 'What about scholarships?',
    desc: 'AI-matched scholarship finder surfaces 10 personalized opportunities with direct links. Half don\'t even require an essay. Track applications in one place.',
  },
  {
    icon: '📊',
    title: 'How do the schools compare?',
    desc: 'Side-by-side comparison of acceptance rate, cost, graduation rate, and median earnings — all from the U.S. Dept of Education. No marketing spin.',
  },
]

const TESTIMONIALS = [
  {
    text: 'The Financial Planner finally helped me understand what college will actually cost us. I stopped dreading the conversation and started making a real plan.',
    name: 'Linda C.',
    detail: 'Parent of 2026 applicant',
  },
  {
    text: 'I had no idea my daughter had a 68% chance at her dream school. We almost didn\'t even apply because we assumed it was a reach.',
    name: 'Maria R.',
    detail: 'Parent of 2026 applicant',
  },
  {
    text: 'We were juggling spreadsheets, Niche, and CollegeVine. Now everything is in one place and I actually understand the numbers.',
    name: 'David K.',
    detail: 'Parent of 2027 applicant',
  },
]

export default function ParentsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Stairway U', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'For Parents', item: `${SITE}/parents` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: PAIN_POINTS.map((p) => ({
          '@type': 'Question',
          name: p.title,
          acceptedAnswer: { '@type': 'Answer', text: p.desc },
        })),
      },
    ],
  }

  return (
    <main className="overflow-x-hidden bg-white font-[Inter,-apple-system,sans-serif] text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── NAV ── */}
      <nav className="fixed inset-x-0 top-0 z-[100] flex h-[60px] items-center justify-between bg-slate-900/95 px-[clamp(16px,4vw,40px)] backdrop-blur-xl">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-4 py-2 text-[13px] font-semibold text-white/80 no-underline">
            Sign In
          </Link>
          <Link href={SIGNUP} className="rounded-md bg-white px-5 py-2.5 text-[13px] font-bold text-slate-900 no-underline">
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1920&q=85"
          alt="Family on college campus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/50" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-10 px-[6%] pb-16 pt-[130px] md:flex-row md:items-center md:justify-between md:pt-[100px]">
          <div className="max-w-[520px] shrink-0">
            <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-teal-300">
              For Parents
            </div>
            <h1 className="mb-6 text-[clamp(36px,5.5vw,64px)] font-black leading-[1.05] tracking-tight text-white">
              Will they get in?<br />What will it cost&nbsp;us?
            </h1>
            <p className="mb-8 max-w-[440px] text-[clamp(15px,1.8vw,19px)] leading-relaxed text-white/75">
              Search any college, enter your child&apos;s GPA and scores, and see their real odds — instantly, free, powered by U.S. Department of Education&nbsp;data.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href={SIGNUP} className="rounded-md bg-white px-8 py-3.5 text-[14px] font-extrabold text-slate-900 no-underline">
                Start Free — No Credit Card
              </Link>
              <Link href="/colleges" className="text-[13px] font-semibold text-white/60 no-underline hover:text-white">
                Browse 1,500+ Colleges
              </Link>
            </div>
          </div>
          <div className="w-full max-w-[540px] shrink-0">
            <HeroCalculator parentMode />
          </div>
        </div>
      </section>

      {/* ── THE 3 QUESTIONS ── */}
      <section className="bg-slate-50 px-[6%] py-24">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
            Everything you need to know
          </div>
          <h2 className="mb-6 text-center text-[clamp(28px,4vw,48px)] font-black leading-[1.05] tracking-tight text-slate-900">
            The six questions every parent&nbsp;asks.
          </h2>
          <p className="mx-auto mb-14 max-w-[560px] text-center text-base leading-relaxed text-slate-500">
            Stairway U answers them with real federal data — not rankings, not marketing quizzes, and not a $200/hr college counselor.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white px-7 py-8">
                <div className="mb-3 text-2xl">{p.icon}</div>
                <div className="mb-2 text-[15px] font-bold text-slate-900">{p.title}</div>
                <div className="text-sm leading-relaxed text-slate-500">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARENT DASHBOARD PITCH ── */}
      <section className="bg-white px-[6%] py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2">
            <div>
              <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
                Your own login
              </div>
              <h2 className="mb-5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-tight text-slate-900">
                See everything.<br />Without hovering.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Your student does the work — you get visibility. Your parent account shows the school list, costs, odds, essay progress, and deadlines in a read-only dashboard built for peace of&nbsp;mind.
              </p>
              <ul className="m-0 list-none space-y-4 p-0">
                {[
                  'See which schools made the list and why',
                  'Compare costs side-by-side (net price, not sticker price)',
                  'Track essay and application progress',
                  'Weekly email digest so you stay in the loop',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={SIGNUP} className="mt-10 inline-block rounded-md bg-slate-900 px-8 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.05em] text-white no-underline">
                Create Your Parent Account →
              </Link>
              <div className="mt-3 text-xs text-slate-400">
                Free with your student&apos;s $9.99/mo subscription. No extra&nbsp;cost.
              </div>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-400">How it works</div>
                <div className="space-y-5">
                  {[
                    { step: '1', text: 'Your student signs up and builds their college list.' },
                    { step: '2', text: 'They share a 6-character code with you.' },
                    { step: '3', text: 'You link your parent account — done in 30 seconds.' },
                    { step: '4', text: 'You see everything: schools, costs, odds, progress.' },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-4">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                        {s.step}
                      </div>
                      <div className="text-sm leading-relaxed text-slate-600">{s.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-slate-50 px-[6%] py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
              From real families
            </div>
            <h2 className="text-[clamp(28px,4vw,48px)] font-black leading-[1.05] tracking-tight text-slate-900">
              What parents say after<br />their first&nbsp;week.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white px-7 py-8">
                <div className="mb-5 h-8 w-1 rounded-sm bg-cyan-600" />
                <p className="mb-6 text-[15px] italic leading-[1.75] text-slate-700">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="text-[13px] font-extrabold text-slate-900">{t.name}</div>
                <div className="mt-0.5 text-xs font-semibold text-cyan-600">{t.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COST ANCHOR ── */}
      <section className="bg-white px-[6%] py-24">
        <div className="mx-auto max-w-[700px] text-center">
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
            Pricing
          </div>
          <h2 className="mb-5 text-[clamp(28px,4vw,48px)] font-black leading-[1.05] tracking-tight text-slate-900">
            $9.99/mo vs. $200/hr.
          </h2>
          <p className="mb-8 text-lg leading-relaxed text-slate-500">
            A private college counselor costs $200+/hour and still uses the same federal data we do.
            Stairway U gives your family the same odds, same cost breakdowns, same deadline tracking
            — for the price of a&nbsp;lunch.
          </p>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { label: 'Private counselor', price: '$2,000–$6,000', note: 'per application season' },
              { label: 'Stairway U Pro', price: '$9.99/mo', note: '7-day free trial · cancel anytime' },
              { label: 'Stairway U Free', price: '$0', note: 'Chancing + milestones forever' },
            ].map((c) => (
              <div key={c.label} className={`rounded-xl border px-6 py-6 ${c.label === 'Stairway U Pro' ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
                <div className="text-3xl font-black text-slate-900">{c.price}</div>
                <div className="mt-1 text-xs text-slate-500">{c.note}</div>
              </div>
            ))}
          </div>
          <Link href={SIGNUP} className="inline-block rounded-md bg-slate-900 px-12 py-4 text-[15px] font-extrabold uppercase tracking-[0.03em] text-white no-underline">
            Start 7-Day Pro Trial →
          </Link>
          <div className="mt-4 text-xs text-slate-400">
            No credit card required to start. Parent account included free.
          </div>
        </div>
      </section>

      {/* ── DATA TRUST ── */}
      <section className="bg-slate-800 px-[6%] py-5">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Data from</span>
          <span className="text-[13px] font-bold text-white/60">🏛 U.S. Dept of Education</span>
          <span className="text-[13px] font-bold text-white/60">📊 College Scorecard API</span>
          <span className="text-[13px] font-bold text-white/60">🎓 IPEDS</span>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative h-[50vh] min-h-[360px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1920&q=85"
          alt="College campus"
          fill
          sizes="100vw"
          className="object-cover object-[center_60%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-4 max-w-[600px] text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-white">
            Stop wondering.<br />Start planning.
          </h2>
          <p className="mb-8 max-w-[400px] text-base text-white/60">
            Your child&apos;s college list deserves real data, not guesswork.
          </p>
          <Link href={SIGNUP} className="rounded-md bg-white px-13 py-4.5 text-[15px] font-black uppercase tracking-[0.03em] text-slate-900 no-underline">
            Start Free — For Parents
          </Link>
          <div className="mt-4 text-xs tracking-[0.05em] text-white/40">
            No credit card required
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 px-[6%] py-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-9 w-auto" />
          <div className="flex gap-7">
            {[
              { label: 'Browse Colleges', href: '/colleges' },
              { label: 'For Parents', href: '/parents' },
              { label: 'Sign In', href: '/login' },
              { label: 'Sign Up', href: SIGNUP },
              { label: 'Pricing', href: '/#pricing' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-[13px] font-medium tracking-[0.03em] text-white/35 no-underline">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-white/20">© 2026 Stairway U</div>
        </div>
      </footer>
    </main>
  )
}
