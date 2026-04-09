'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Maps the current month to a phase-aware urgency message.
 * Aligned with the app's Prep → Research → Apply → Final milestone phases.
 */
function getSeasonalHook(): { emoji: string; message: string; phase: string } {
  const month = new Date().getMonth() // 0-indexed
  // Jan–Feb: Decision season
  if (month <= 1)
    return { emoji: '📬', message: 'Decisions are coming. Make sure your list is airtight.', phase: 'Final' }
  // Mar–Apr: Commitment season
  if (month <= 3)
    return { emoji: '🎓', message: 'Decision Day is approaching. Do you know your top choice?', phase: 'Final' }
  // May–Jun: Sophomore/Junior prep
  if (month <= 5)
    return { emoji: '🔬', message: 'Summer is the best time to get ahead. Start your college research now.', phase: 'Prep' }
  // Jul: Pre-app season
  if (month === 6)
    return { emoji: '✍️', message: 'Essay season starts next month. Get your brainstorm done now.', phase: 'Research' }
  // Aug–Sep: Application season kicks off
  if (month <= 8)
    return { emoji: '🔥', message: 'Application season is here. Is your list ready?', phase: 'Apply' }
  // Oct–Nov: Peak application crunch
  if (month <= 10)
    return { emoji: '⏰', message: 'Early deadlines are weeks away. Most students start too late — don\u2019t be most students.', phase: 'Apply' }
  // Dec: Early results + RD push
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

const FEATURES = [
  {
    label: 'Admission Snapshot',
    desc: 'Know your real odds — and what it takes to improve them.',
    img: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80',
    light: false,
  },
  {
    label: 'AI Scholarship Finder',
    desc: '10 personalized matches. Direct links. No essay required on half of them.',
    img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    light: true,
  },
  {
    label: 'Financial Planner',
    desc: '529 projections, tuition inflation, loan estimates — all in one dashboard.',
    img: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
    light: false,
  },
  {
    label: 'Essay Studio',
    desc: 'You write the essay — AI coaches you to find your best story angle and polish every draft.',
    img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    light: true,
  },
]

const STATS = [
  { value: '3,000+', label: 'Colleges from the College Scorecard' },
  { value: '74%', label: 'Discover schools they hadn\u2019t considered' },
  { value: '100%', label: 'Federal data — nothing scraped or guessed' },
  { value: '$0', label: 'To start — free forever tier' },
]

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
          { label: 'Up to 4 colleges', included: true },
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
              {hook.emoji} {hook.message}
            </span>
            <Link href="/signup" className="ml-3 inline-block rounded bg-white/20 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.05em] text-white no-underline backdrop-blur-sm">
              Start Free →
            </Link>
          </div>
        )
      })()}

      {/* ── HERO ── */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1920&q=85"
          alt="High school seniors at college campus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
        <div className="landing-hero-overlay absolute inset-0" />

        <div className="absolute bottom-[12%] left-[6%] max-w-[680px]">
          <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-white/60">
            Your Stairway to College
          </div>
          <h1 className="mb-6 text-[clamp(48px,7vw,88px)] font-black leading-none tracking-tight text-white">
            Your real odds.<br />Your best schools.
          </h1>
          <p className="mb-9 max-w-[480px] text-[clamp(16px,2vw,20px)] leading-relaxed text-white/75">
            Admission odds · scholarships · essays · finances · deadlines&nbsp;&mdash;<br />
            one dashboard, zero guesswork.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-md bg-white px-10 py-4 text-[15px] font-extrabold text-slate-900 no-underline">
              Start for Free
            </Link>
            <GoogleSignInButton />
            <Link href="/login" className="rounded-md border-2 border-white/50 bg-transparent px-10 py-4 text-[15px] font-bold text-white no-underline">
              Sign In
            </Link>
          </div>
        </div>

        <div className="absolute right-12 bottom-8 text-xs uppercase tracking-[0.1em] text-white/40">
          Scroll ↓
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
                  { tool: 'CollegeVine', task: 'for admission odds' },
                  { tool: 'Niche', task: 'for college reviews' },
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
                  'Admission odds powered by the U.S. Dept of Education College Scorecard',
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

      {/* ── STATS BAR ── */}
      <section className="bg-slate-900 px-[6%] py-7">
        <div className="mx-auto mb-6 text-center text-sm font-semibold tracking-wide text-white/50">
          Join 1,200 students already planning their path
        </div>
        <div className="mx-auto grid max-w-[1000px] auto-cols-fr grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-[28px] font-black tracking-tight text-white">{s.value}</div>
              <div className="mt-1 text-xs tracking-[0.05em] text-white/45">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DATA TRUST STRIP ── */}
      <section className="bg-slate-800 px-[6%] py-5">
        <div className="mx-auto flex max-w-[900px] flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/30">Data from</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/60">🏛 U.S. Dept of Education</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/60">📊 College Scorecard API</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-white/60">🎓 IPEDS</span>
          </div>
        </div>
      </section>

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

      {/* ── FULL-BLEED SECOND HERO — Journey Tracker ── */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=85"
          alt="Graduation ceremony"
          fill
          sizes="100vw"
          className="object-cover object-[center_40%]"
        />
        <div className="landing-journey-overlay absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/50">
            Journey Tracker
          </div>
          <h2 className="mb-5 max-w-[700px] text-[clamp(32px,5vw,64px)] font-black leading-[1.05] tracking-tight text-white">
            From sophomore year<br />to decision day.
          </h2>
          <p className="mb-9 max-w-[440px] text-base leading-relaxed text-white/65">
            A visual roadmap of every milestone — with a progress ring that shows exactly where you stand.
          </p>
          <Link href="/signup" className="rounded-md bg-teal-300 px-11 py-4 text-sm font-extrabold uppercase tracking-[0.05em] text-slate-900 no-underline">
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* ── CONNECTED DATA ── */}
      <section className="bg-slate-900 px-[6%] py-24">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-300">
            The Connected Advantage
          </div>
          <h2 className="mb-5 text-[clamp(28px,4vw,48px)] font-black leading-[1.05] tracking-tight text-white">
            Your profile powers everything.
          </h2>
          <p className="mx-auto mb-14 max-w-[500px] text-base leading-relaxed text-white/50">
            Separate tools can&apos;t share context. Stairway U connects your GPA, scores, budget, and school list across every feature — all grounded in real federal data from the College Scorecard.
          </p>
          <div className="grid grid-cols-1 gap-6 text-left md:grid-cols-3">
            {[
              { highlight: 'Scholarship matches', rest: 'already know your GPA and major.' },
              { highlight: 'Financial estimates', rest: 'already know the schools on your list.' },
              { highlight: 'Essay brainstorming', rest: 'already knows which prompts you need.' },
            ].map(c => (
              <div key={c.highlight} className="rounded-xl border border-white/10 bg-white/5 px-7 py-8">
                <div className="mb-2 text-sm font-bold text-teal-300">{c.highlight}</div>
                <div className="text-sm leading-relaxed text-white/60">{c.rest}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FIRST-WEEK REACTIONS ── */}
      <section className="bg-white px-[6%] py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
              Unfiltered
            </div>
            <h2 className="text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-slate-900">
              What students say after<br />their first&nbsp;week.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { text: 'Wait, is this real? It says I have a 74% chance at UT Austin', who: 'Junior, TX · first session', time: '3 days ago' },
              { text: "I didn\u2019t know I could get into Berkeley with my GPA. I literally never would have looked at it.", who: 'Senior, CA · exploring matches', time: '5 days ago' },
              { text: 'There were a lot of schools I didn\u2019t even know about. Found 4 new ones with >60% odds in like 10 min', who: 'Junior, OH · after Admission Snapshot', time: '1 week ago' },
            ].map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-400" />
                  <span className="text-[11px] font-semibold text-slate-400">{t.time}</span>
                </div>
                <p className="mb-5 text-[15px] leading-[1.7] text-slate-700">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="text-[12px] text-slate-400">{t.who}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARENTS ── */}
      <section className="bg-slate-50 px-[6%] py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="grid grid-cols-1 items-center gap-14 md:grid-cols-2">
            <div>
              <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-600">
                For Parents
              </div>
              <h2 className="mb-5 text-[clamp(28px,4vw,44px)] font-black leading-[1.05] tracking-tight text-slate-900">
                Finally understand what college will actually&nbsp;cost.
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Your student gets the tools — you get the clarity. One dashboard with the financial answers you can&apos;t find anywhere&nbsp;else.
              </p>
              <ul className="m-0 list-none space-y-4 p-0">
                {[
                  'Real net cost estimates for every school on the list',
                  '529 projections & tuition-inflation forecasts',
                  'Side-by-side cost comparison across schools',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-10 inline-block rounded-md bg-slate-900 px-8 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.05em] text-white no-underline">
                See What College Will Cost →
              </Link>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 px-8 py-10">
              <div className="mb-5 h-8 w-1 rounded-sm bg-cyan-600" />
              <p className="mb-6 text-[15px] italic leading-[1.75] text-slate-700">
                &ldquo;The Financial Planner finally helped me understand what college will actually cost us. I stopped dreading the conversation and started making a real plan.&rdquo;
              </p>
              <div className="text-[13px] font-extrabold text-slate-900">Linda C.</div>
              <div className="mt-0.5 text-xs font-semibold text-cyan-600">Parent of 2026 applicant</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="bg-slate-900 px-[6%] py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/40">
              Pricing
            </div>
            <h2 className="text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-white">
              Everything for sophomore &amp; junior&nbsp;year&nbsp;&mdash;&nbsp;free&nbsp;forever.<br />Ready to apply? Pro gives you the full&nbsp;toolkit.
            </h2>
          </div>
          <div className="mx-auto max-w-[820px]">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* ── COUNSELORS & TEST PREP ── */}
      <section className="bg-white px-[6%] py-16">
        <div className="mx-auto max-w-[900px] rounded-2xl border border-slate-200 bg-slate-50 px-8 py-10 md:flex md:items-center md:justify-between md:gap-10 md:px-12">
          <div className="mb-6 md:mb-0">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
              For Counselors &amp; Test Prep
            </div>
            <h3 className="mb-2 text-[clamp(20px,3vw,28px)] font-black leading-tight tracking-tight text-slate-900">
              One recommendation. 300&nbsp;students&nbsp;helped.
            </h3>
            <p className="max-w-[420px] text-sm leading-relaxed text-slate-500">
              Show students how score improvements translate into better school matches — and give every family a financial plan in&nbsp;minutes.
            </p>
          </div>
          <div className="shrink-0">
            <a href="mailto:hello@stairwayu.com?subject=Counselor%20%2F%20Test%20Prep%20Partnership" className="inline-block rounded-md bg-slate-900 px-8 py-3.5 text-[13px] font-extrabold uppercase tracking-[0.05em] text-white no-underline">
              Partner With Us →
            </a>
          </div>
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
        <div className="landing-cta-overlay absolute inset-0" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="mb-8 max-w-[600px] text-[clamp(28px,4vw,56px)] font-black leading-[1.05] tracking-tight text-white">
            Your dream school is waiting.
          </h2>
          <Link href="/signup" className="rounded-md bg-white px-13 py-4.5 text-[15px] font-black uppercase tracking-[0.03em] text-slate-900 no-underline">
            Get Started Free
          </Link>
          <div className="mt-4 text-xs tracking-[0.05em] text-white/40">
            No credit card required
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 px-[6%] py-10">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-9 w-auto" />
          <div className="flex gap-7">
            {[{ label: 'Browse Colleges', href: '/colleges' }, { label: 'Sign In', href: '/login' }, { label: 'Sign Up', href: '/signup' }, { label: 'Pricing', href: '/#pricing' }, { label: 'For Counselors', href: 'mailto:hello@stairwayu.com?subject=Counselor%20%2F%20Test%20Prep%20Partnership' }, { label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }].map(l => (
              <Link key={l.href} href={l.href} className="text-[13px] font-medium tracking-[0.03em] text-white/35 no-underline">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="text-xs text-white/20">© 2026 Stairway U</div>
        </div>
      </footer>

    </div>
  )
}
