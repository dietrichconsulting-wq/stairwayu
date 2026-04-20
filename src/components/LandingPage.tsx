'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { HeroCalculator } from '@/components/HeroCalculator'
import { ShieldCheck, Database, Sparkles, Lock } from 'lucide-react'

/**
 * Maps the current month to a phase-aware urgency message.
 * Aligned with the app's Prep → Research → Apply → Final milestone phases.
 */
function getSeasonalHook(): { emoji: string; message: string; phase: string } {
  const month = new Date().getMonth()
  if (month <= 1)
    return { emoji: '📬', message: 'Decisions are coming. Make sure your list is airtight.', phase: 'Final' }
  if (month <= 3)
    return { emoji: '🎓', message: 'Decision Day is approaching. Do you know your top choice?', phase: 'Final' }
  if (month <= 5)
    return { emoji: '🔬', message: 'Summer is the best time to get ahead. Start your college research now.', phase: 'Prep' }
  if (month === 6)
    return { emoji: '✍️', message: 'Essay season starts next month. Get your brainstorm done now.', phase: 'Research' }
  if (month <= 8)
    return { emoji: '🔥', message: 'Application season is here. Is your list ready?', phase: 'Apply' }
  if (month <= 10)
    return { emoji: '⏰', message: 'Early deadlines are weeks away. Most students start too late — don\u2019t be most students.', phase: 'Apply' }
  return { emoji: '🚀', message: 'Early decisions are out. Regular deadline is next — finish strong.', phase: 'Apply' }
}

function GoogleSignInButton({ className }: { className?: string }) {
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setError('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <>
    {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
    <button
      onClick={handleGoogleLogin}
      className={`flex items-center gap-2.5 rounded-md bg-white px-6 py-4 text-[15px] font-bold text-slate-700 no-underline border-none cursor-pointer ${className ?? ''}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Sign in with Google
    </button>
    </>
  )
}

// S2.T2 — feature tile artwork is now served from /public/screenshots/*.svg
// (branded placeholders; see public/screenshots/README.md for swap instructions).
const FEATURES = [
  {
    label: 'Admission Snapshot',
    desc: 'See where you stand — and what it takes to improve.',
    img: '/screenshots/admission-snapshot.svg',
    light: false,
  },
  {
    label: 'Scholarship Finder',
    desc: '10 personalized matches from a curated, verified database. Direct links. No essay required on half of them.',
    img: '/screenshots/scholarship-finder.svg',
    light: true,
  },
  {
    label: 'Financial Planner',
    desc: '529 projections, tuition inflation, loan estimates — all in one dashboard.',
    img: '/screenshots/financial-planner.svg',
    light: false,
  },
  {
    label: 'Essay Studio',
    desc: 'Two tools: Brainstorm generates essay topic ideas tailored to each school. Critique scores your draft and tells you exactly what to fix.',
    img: '/screenshots/essay-studio.svg',
    light: true,
  },
]

// Partner-logo + testimonial scaffolding was removed in Sprint 2 (S2.T1). Restore from git
// history when real logos / quotes are available; the markup lived inside the
// `{SHOW_PARTNER_LOGOS && …}` and `{SHOW_TESTIMONIALS && …}` gates.

function PricingCards() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Free tier */}
      <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-10">
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/40">Free Forever</div>
        <div className="mb-1 text-[44px] font-black tracking-tight text-white">$0</div>
        <div className="mb-8 text-[13px] text-white/40">No credit card required</div>

        {[
          { label: 'Up to 8 colleges', included: true },
          { label: '3 AI-powered insights daily', included: true },
          { label: 'Admission chancing', included: true },
          { label: 'Journey milestones', included: true },
          { label: 'Score Bands & Explore', included: true },
          { label: 'Strategy Generator', included: false },
          { label: 'Essay Coaching', included: false },
          { label: 'College Comparison', included: false },
        ].map(f => (
          <div key={f.label} className={`mb-3 flex items-center gap-3 ${f.included ? '' : 'opacity-30'}`}>
            <div className={`flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] ${
              f.included ? 'bg-teal-500/30 text-teal-300' : 'bg-white/10 text-white/40'
            }`}>
              {f.included ? '✓' : '—'}
            </div>
            <span className="text-sm text-white/75">{f.label}</span>
          </div>
        ))}

        <Link href="/signup" className="mt-8 block rounded-lg border-2 border-white/20 bg-transparent px-3.5 py-3.5 text-center text-[13px] font-extrabold uppercase tracking-[0.05em] text-white no-underline">
          Get Started Free
        </Link>
      </div>

      {/* Pro tier */}
      <div className="landing-pro-bg relative rounded-2xl px-8 py-10">
        <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/60">Full Access</div>

        {/* Billing toggle */}
        <div className="mb-4 inline-flex rounded-lg border border-white/15 bg-white/10 p-0.5">
          <button
            onClick={() => setPlan('monthly')}
            className={`cursor-pointer rounded-md border-none px-3.5 py-1.5 text-xs font-bold text-white transition-all duration-150 ${
              plan === 'monthly' ? 'bg-white/25' : 'bg-transparent'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPlan('annual')}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border-none px-3.5 py-1.5 text-xs font-bold text-white transition-all duration-150 ${
              plan === 'annual' ? 'bg-white/25' : 'bg-transparent'
            }`}
          >
            Annual
            <span className="rounded-sm bg-amber-400 px-1 py-px text-[9px] font-extrabold text-amber-900">SAVE 34%</span>
          </button>
        </div>

        {plan === 'monthly' ? (
          <>
            <div className="mb-1 text-[44px] font-black tracking-tight text-white">$9.99</div>
            <div className="mb-8 text-[13px] text-white/50">per month</div>
          </>
        ) : (
          <>
            <div className="mb-0.5 flex items-baseline gap-2">
              <span className="text-[44px] font-black tracking-tight text-white">$79</span>
              <span className="text-[13px] text-white/50 line-through">$119.88</span>
            </div>
            <div className="mb-8 text-[13px] font-bold text-green-300">$6.58/mo · Save 34%</div>
          </>
        )}

        {[
          'Unlimited colleges',
          'Unlimited AI calls',
          'AI Strategy Generator',
          'Full Essay Coaching',
          'College Comparison',
          'Unlimited scholarships',
          'Deadline Radar',
          'Everything in Free',
        ].map(f => (
          <div key={f} className="mb-3 flex items-center gap-3">
            <div className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">✓</div>
            <span className="text-sm text-white/85">{f}</span>
          </div>
        ))}
        <Link href="/signup" className="mt-8 block rounded-lg bg-white px-3.5 py-3.5 text-center text-[13px] font-extrabold uppercase tracking-[0.05em] text-slate-900 no-underline">
          Start 7-Day Pro Trial →
        </Link>
        <div className="mt-3 text-center text-[11px] text-white/35">Cancel anytime — no charge during your Pro trial</div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="overflow-x-hidden bg-white font-[Inter,-apple-system,sans-serif] text-slate-900">

      {/* ── NAV ── */}
      <nav
        className={`fixed inset-x-0 top-0 z-[100] flex h-[60px] items-center justify-between px-[clamp(16px,4vw,40px)] transition-[background] duration-300 ${
          scrolled ? 'bg-slate-900/95 backdrop-blur-xl' : 'bg-transparent backdrop-blur-none'
        }`}
      >
        <div className="flex items-center">
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-md px-4 py-2 text-[13px] font-semibold text-white/80 no-underline">
            Sign In
          </Link>
          <Link href="/signup" className="rounded-md bg-white px-5 py-2.5 text-[13px] font-bold text-slate-900 no-underline">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── SEASONAL URGENCY ── */}
      {(() => {
        const hook = getSeasonalHook()
        return (
          <div className="fixed inset-x-0 top-[60px] z-[90] bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-center">
            <span className="text-[13px] font-bold tracking-wide text-white">
              <span aria-hidden="true">{hook.emoji}</span> {hook.message}
            </span>
            <Link href="/signup" className="ml-3 inline-block rounded bg-white/20 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.05em] text-white no-underline backdrop-blur-sm">
              Start Free →
            </Link>
          </div>
        )
      })()}

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden">
        {/* S2.T2: CSS-only background (no external image) — see globals.css */}
        <div className="landing-hero-gradient absolute inset-0" aria-hidden="true" />
        <div className="landing-hero-overlay absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center gap-10 px-[6%] pb-16 pt-[130px] md:flex-row md:items-center md:justify-between md:pt-[100px]">
          {/* Left: copy */}
          <div className="max-w-[520px] shrink-0">
            <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">
              Your Stairway to College
            </div>
            <h1 className="mb-6 text-[clamp(40px,6vw,72px)] font-black leading-[1.02] tracking-tight text-white">
              Your profile.<br />Your best-fit schools.
            </h1>
            <p className="mb-3 max-w-[440px] text-[clamp(16px,1.9vw,20px)] font-semibold leading-snug text-white">
              The one dashboard for college applications &mdash; backed by federal data, not sponsored rankings.
            </p>
            <p className="mb-3 max-w-[440px] text-[clamp(14px,1.6vw,17px)] leading-relaxed text-white/70">
              Search any college, enter your GPA and scores, see how you compare to admitted students &mdash; instantly, free.
            </p>
            <p className="mb-8 text-[12px] font-semibold uppercase tracking-[0.12em] text-white/55">
              For students, parents &amp; counselors
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/signup" className="rounded-md bg-white px-8 py-3.5 text-[14px] font-extrabold text-slate-900 no-underline">
                Start for Free
              </Link>
              <GoogleSignInButton className="!py-3.5 !px-6 !text-[14px]" />
              <Link href="/login" className="text-[13px] font-semibold text-white/60 no-underline hover:text-white">
                Sign In
              </Link>
            </div>
          </div>

          {/* Right: live calculator */}
          <div className="w-full max-w-[540px] shrink-0">
            <HeroCalculator />
          </div>
        </div>

        <div className="absolute right-12 bottom-8 z-10 text-xs uppercase tracking-[0.1em] text-white/40">
          Scroll ↓
        </div>
      </section>


      {/* ── DATA SOURCES / TRUST STRIP ── */}
      <section
        aria-label="Data sources and privacy"
        className="border-y border-slate-200 bg-white px-[6%] py-6"
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
            Built on verified data
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                Icon: ShieldCheck,
                title: 'Official federal data',
                desc: 'Admissions, cost, and outcomes from the U.S. Dept of Education College Scorecard.',
              },
              {
                Icon: Database,
                title: '3,000+ U.S. colleges',
                desc: 'Refreshed each year when the Scorecard publishes new data.',
              },
              {
                Icon: Sparkles,
                title: 'AI essay coaching',
                desc: 'Brainstorm and critique powered by Google Gemini — your drafts stay yours.',
              },
              {
                Icon: Lock,
                title: 'Private by default',
                desc: 'No ads, no selling your data. Cancel or delete your account any time.',
              },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-900">{title}</div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-center text-[11px] text-slate-400">
            Admission chances are estimates based on published school stats &mdash;
            {' '}
            <Link href="/methodology" className="font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700">
              read the methodology
            </Link>
            .
          </div>
          <div className="mt-2 text-center text-[11px] text-slate-400">
            Funded by student subscriptions. Colleges don&apos;t pay for placement, and we don&apos;t sell your data.
          </div>
        </div>
      </section>


      {/* ── REPLACE 5 TABS ── */}
      <section className="bg-white px-[6%] py-24">
        <div className="mx-auto max-w-[1000px]">
          <div className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
            Before &amp; After
          </div>
          <h2 className="mb-14 text-center text-[clamp(28px,4vw,48px)] font-black leading-[1.05] tracking-tight text-slate-900">
            Replace 5 tabs with 1&nbsp;dashboard.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* BEFORE */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-10">
              <div className="mb-5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Before Stairway U</div>
              <ul className="m-0 list-none space-y-4 p-0">
                {[
                  { tool: 'Niche', task: 'for college reviews' },
                  { tool: 'Appily', task: 'for admission odds' },
                  { tool: 'Scholarply', task: 'for scholarships' },
                  { tool: 'ChatGPT', task: 'for essay help' },
                  { tool: 'Google Sheets', task: 'for deadlines & costs' },
                ].map(r => (
                  <li key={r.tool} className="flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-400">✕</span>
                    <span><span className="font-bold text-slate-700">{r.tool}</span> {r.task}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-xs leading-relaxed text-slate-400">
                5 logins. No shared context. You copy-paste everything.
              </div>
            </div>
            {/* AFTER */}
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-8 py-10">
              <div className="mb-5 text-xs font-extrabold uppercase tracking-[0.12em] text-teal-600">With Stairway U</div>
              <ul className="m-0 list-none space-y-4 p-0">
                {[
                  'Academic profile comparison powered by the U.S. Dept of Education College Scorecard',
                  'Personalized scholarship matches',
                  'Essay brainstorming & critique',
                  'Financial planner with 529 & loan estimates',
                  'Deadline tracking & journey milestones',
                ].map(r => (
                  <li key={r} className="flex items-center gap-3 text-sm text-slate-700">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
              <div className="mt-6 text-xs font-semibold leading-relaxed text-teal-700">
                1 dashboard. Your profile powers every tool automatically.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar removed in Sprint 2 — values now live in the Data Sources strip above. */}

      {/* Partner logo bar removed in Sprint 2 — restore from git (pre-S2.T1 commit) when real partner logos are available. */}

      {/* ── FEATURE GRID — Nike product tiles ── */}
      <section className="bg-slate-100 p-1">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-1">
          {FEATURES.map(f => (
            <div key={f.label} className="group relative aspect-[4/3] cursor-pointer overflow-hidden bg-slate-900">
              <Image
                src={f.img}
                alt={f.label}
                fill
                sizes="(min-width: 600px) 50vw, 100vw"
                className="object-cover opacity-75 transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
              <div className={`absolute inset-0 ${f.light ? 'landing-feature-gradient-light' : 'landing-feature-gradient-dark'}`} />
              <div className="absolute inset-x-0 bottom-0 p-[clamp(16px,3vw,32px)] px-[clamp(16px,3vw,36px)]">
                <div className="mb-2 text-[clamp(20px,2.5vw,28px)] font-black leading-tight tracking-tight text-white">
                  {f.label}
                </div>
                <div className="mb-5 text-[13px] leading-relaxed text-white/70">
                  {f.desc}
                </div>
                <Link href="/signup" className="inline-block rounded bg-white px-5.5 py-2.5 text-xs font-extrabold uppercase tracking-[0.03em] text-slate-900 no-underline">
                  Start Free →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Device messaging absorbed into the Data Sources strip (hero micro-line covers it). */}

      {/* For Parents + For Counselors sections removed in Sprint 2.
          Parent / counselor messaging is absorbed into the hero micro-line
          ("For students, parents & counselors") and the footer retains dedicated links. */}

      {/* Testimonials section removed in Sprint 2 — restore from git when real quotes are collected. */}

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-slate-900 px-[6%] py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/40">
              Pricing
            </div>
            <h2 className="text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-white">
              Free for research.<br />Pro for application&nbsp;season.
            </h2>
          </div>
          <div className="mx-auto max-w-[820px]">
            <PricingCards />
          </div>
        </div>
      </section>


      {/* ── FINAL CTA BANNER ── */}
      <section className="bg-gradient-to-r from-teal-600 to-cyan-600 px-[6%] py-12">
        <div className="mx-auto max-w-[1000px] text-center">
          <h2 className="mb-6 text-[clamp(24px,3vw,40px)] font-black leading-tight tracking-tight text-white">
            Ready to start?
          </h2>
          <Link href="/signup" className="inline-block rounded-md bg-white px-10 py-3.5 text-[14px] font-extrabold uppercase tracking-[0.05em] text-slate-900 no-underline">
            Get Started Free
          </Link>
          <div className="mt-3 text-sm text-white/80">
            No credit card required
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 px-[6%] py-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-9 w-auto" />
          <div className="flex gap-7">
            {[{ label: 'About', href: '/about' }, { label: 'Browse Colleges', href: '/colleges' }, { label: 'Ranking', href: '/methodology' }, { label: 'For Parents', href: '/parents' }, { label: 'For Counselors', href: '/counselors' }, { label: 'Sign In', href: '/login' }, { label: 'Sign Up', href: '/signup' }, { label: 'Pricing', href: '/#pricing' }, { label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }].map(l => (
              <Link key={l.href} href={l.href} className="text-[13px] font-medium tracking-[0.03em] text-white/35 no-underline">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-white/20">© 2026 Stairway U</div>
        </div>
        <div className="mx-auto mt-6 max-w-[1100px] border-t border-white/5 pt-5 text-[11px] leading-relaxed text-white/30">
          Admissions, cost, and outcomes data from the{' '}
          <a
            href="https://collegescorecard.ed.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            U.S. Department of Education College Scorecard
          </a>
          . Stairway U is not affiliated with or endorsed by the U.S. Department of Education.
          Admission-chance estimates are statistical projections, not predictions or guarantees.{' '}
          <Link href="/methodology" className="underline hover:text-white/60">
            See our methodology
          </Link>
          .
        </div>
      </footer>

    </div>
  )
}
