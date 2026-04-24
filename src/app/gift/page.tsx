import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL as SITE } from '@/lib/siteConfig'

export const metadata: Metadata = {
  title: 'Gift College Savings — How to Contribute to a 529 Plan',
  description:
    'Learn how to contribute to a student\'s 529 college savings plan. Tax-advantaged, easy to set up, and the best gift you can give for their future.',
  alternates: { canonical: `${SITE}/gift` },
}

const STEPS = [
  {
    num: '1',
    title: 'Ask for the 529 account details',
    desc: 'The student\'s family can share their 529 plan name, account number, and beneficiary name. Most major 529 plans allow third-party contributions.',
  },
  {
    num: '2',
    title: 'Contribute directly through the plan',
    desc: 'Most 529 providers (Fidelity, Vanguard, TIAA, state plans) let you contribute online as a gift-giver. You\'ll need the account number and beneficiary name.',
  },
  {
    num: '3',
    title: 'Or write a check',
    desc: 'Make the check payable to the 529 plan (not the beneficiary), include the account number in the memo line, and mail it to the plan\'s address. The family can also deposit your check on your behalf.',
  },
]

const PLANS = [
  { name: 'Texas College Savings Plan', url: 'https://www.texascollegesavings.com', note: 'Managed by Orion' },
  { name: 'my529 (Utah)', url: 'https://my529.org', note: 'Top-rated, open to all states' },
  { name: 'NY 529 Direct Plan', url: 'https://www.nysaves.org', note: 'Managed by Vanguard' },
  { name: 'ScholarShare 529 (CA)', url: 'https://www.scholarshare529.com', note: 'California\'s plan' },
  { name: 'Fidelity-managed plans', url: 'https://www.fidelity.com/529-plans/overview', note: 'Multiple state plans' },
]

const FAQS = [
  {
    q: 'How much can I contribute?',
    a: 'There\'s no annual contribution limit for 529 plans (unlike IRAs). However, contributions above $18,000 per year ($36,000 for married couples) may trigger gift tax reporting. Most family gifts are well under this threshold.',
  },
  {
    q: 'Do I get a tax deduction?',
    a: 'It depends on your state. Over 30 states offer a state income tax deduction or credit for 529 contributions — but usually only for contributions to your own state\'s plan. Check your state\'s rules.',
  },
  {
    q: 'What if the student doesn\'t go to college?',
    a: 'The beneficiary can be changed to another family member at any time. Since 2024, unused 529 funds can also be rolled into a Roth IRA (up to $35,000 lifetime) for the beneficiary.',
  },
  {
    q: 'Can I contribute if I don\'t know the account number?',
    a: 'Ask the family. They can usually find the account number on their 529 provider\'s website or app. Some plans also have a "gift contribution" page with a unique URL the family can share.',
  },
  {
    q: 'Is a 529 contribution better than writing a check directly?',
    a: 'Yes, for two reasons: (1) money in a 529 grows tax-free, and (2) 529 assets have a minimal impact on financial aid eligibility (counted as parental assets at ~5.6%, vs. student assets at 20%).',
  },
]

export default function GiftPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <main className="min-h-screen bg-[#0c0e14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="border-b border-white/5 bg-[#0c0e14]/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-8 w-auto" />
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-white/90"
          >
            Start Free
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-12 pb-6">
        <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-teal-300">
          College Gifting
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          The best gift for their future
        </h1>
        <p className="mt-4 text-lg text-white/60 max-w-xl">
          Instead of another gift card, contribute to a student&apos;s 529 college savings plan.
          Every dollar grows tax-free and goes directly toward tuition, books, and room &amp;&nbsp;board.
        </p>
      </section>

      {/* How to contribute */}
      <section className="mx-auto max-w-3xl px-6 mt-8">
        <h2 className="text-2xl font-semibold mb-6">How to contribute to a 529 plan</h2>
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.num} className="flex gap-5 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-lg font-bold text-white">
                {s.num}
              </div>
              <div>
                <div className="font-semibold text-white">{s.title}</div>
                <div className="mt-1 text-sm text-white/60 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular plans */}
      <section className="mx-auto max-w-3xl px-6 mt-12">
        <h2 className="text-2xl font-semibold mb-4">Popular 529 plans</h2>
        <p className="text-sm text-white/50 mb-5">
          These are some of the largest and highest-rated 529 plans. Most accept contributions from anyone, regardless of your state.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANS.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.05] no-underline"
            >
              <div className="font-semibold text-white">{p.name}</div>
              <div className="text-xs text-white/40 mt-1">{p.note}</div>
            </a>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-6 mt-12">
        <h2 className="text-2xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <summary className="cursor-pointer font-semibold text-white/90">{f.q}</summary>
              <p className="mt-3 text-white/70 text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 mt-12 mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-teal-400/10 border border-white/10 p-8 text-center">
          <h2 className="text-2xl font-bold">Planning for college yourself?</h2>
          <p className="mt-2 text-white/60">
            See your estimated chances, find scholarships, and build a financial plan — free.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-lg bg-white px-6 py-3 font-bold text-slate-900 hover:bg-white/90"
          >
            Start for Free →
          </Link>
        </div>
      </section>
    </main>
  )
}
