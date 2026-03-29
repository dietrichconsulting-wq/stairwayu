'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

function GoogleSignInButton({ className }: { className?: string }) {
  const handleGoogleLogin = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  return (
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
  )
}

const FEATURES = [
  {
    label: 'Admission Snapshot',
    desc: 'Know your real odds — and what it takes to improve them.',
    img: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80',
    cta: 'See Your Chances',
    href: '/signup',
    light: false,
  },
  {
    label: 'AI Scholarship Finder',
    desc: '10 personalized matches. Direct links. No essay required on half of them.',
    img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80',
    cta: 'Find Scholarships',
    href: '/signup',
    light: true,
  },
  {
    label: 'Financial Planner',
    desc: '529 projections, tuition inflation, loan estimates — all in one dashboard.',
    img: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
    cta: 'Plan the Cost',
    href: '/signup',
    light: false,
  },
  {
    label: 'Essay Studio',
    desc: 'You write the essay — AI coaches you to find your best story angle and polish every draft.',
    img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    cta: 'Find Your Story',
    href: '/signup',
    light: true,
  },
]

const STATS = [
  { value: '3,000+', label: 'Colleges in our database' },
  { value: '$50k+', label: 'Avg scholarships surfaced' },
  { value: '12+', label: 'AI-powered tools' },
  { value: '100%', label: 'Personalized to you' },
]

function PricingCard() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  return (
    <div className="landing-pro-bg relative px-10 py-12">
      <div className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/60">Full Access</div>

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
          <span className="rounded-sm bg-amber-400 px-1 py-px text-[9px] font-extrabold text-amber-900">✦</span>
        </button>
      </div>

      {plan === 'monthly' ? (
        <>
          <div className="mb-1 text-[52px] font-black tracking-tight text-white">$9.99</div>
          <div className="mb-9 text-[13px] text-white/50">per month</div>
        </>
      ) : (
        <>
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className="text-[52px] font-black tracking-tight text-white">$79</span>
            <span className="text-[13px] text-white/50 line-through">$119.88</span>
          </div>
          <div className="mb-9 text-[13px] font-bold text-green-300">$6.58/mo · Save 34%</div>
        </>
      )}

      {['AI Admission Snapshot', 'Scholarship Finder', 'College Comparison', 'Financial Planner', 'Essay Studio', 'Unlimited everything'].map(f => (
        <div key={f} className="mb-3.5 flex items-center gap-3">
          <div className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">✓</div>
          <span className="text-sm text-white/85">{f}</span>
        </div>
      ))}
      <Link href="/signup" className="mt-9 block rounded bg-white px-3.5 py-3.5 text-center text-[13px] font-extrabold uppercase tracking-[0.05em] text-slate-900 no-underline">
        Start Free Trial →
      </Link>
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
        <div className="text-lg font-black tracking-tight text-white">
          Stairway U
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
            AI-Powered College Planning
          </div>
          <h1 className="mb-6 text-[clamp(48px,7vw,88px)] font-black leading-none tracking-tight text-white">
            Your Stairway<br />to College.
          </h1>
          <p className="mb-9 max-w-[480px] text-[clamp(16px,2vw,20px)] leading-relaxed text-white/75">
            Know your real odds. Find your scholarships.<br />Get in.
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

      {/* ── STATS BAR ── */}
      <section className="bg-slate-900 px-[6%] py-7">
        <div className="mx-auto grid max-w-[1000px] auto-cols-fr grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6 text-center">
          {STATS.map(s => (
            <div key={s.label}>
              <div className="text-[28px] font-black tracking-tight text-white">{s.value}</div>
              <div className="mt-1 text-xs tracking-[0.05em] text-white/45">{s.label}</div>
            </div>
          ))}
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
                <Link href={f.href} className="inline-block rounded bg-white px-5.5 py-2.5 text-xs font-extrabold uppercase tracking-[0.03em] text-slate-900 no-underline">
                  {f.cta}
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

      {/* ── TESTIMONIALS ── */}
      <section className="bg-white px-[6%] py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-teal-300">
              Student Stories
            </div>
            <h2 className="text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-slate-900">
              Real students.<br />Real results.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-0.5 md:grid-cols-3">
            {[
              { name: 'Sophia R.', school: 'Admitted to UT Austin', quote: "Stairway U showed me I had a 74% chance at UT Austin. That gave me the confidence to apply early. I got in.", color: 'bg-teal-300', textColor: 'text-teal-300' },
              { name: 'Marcus T.', school: '$28,000 in scholarships', quote: "The scholarship finder surfaced 3 I never would have found on my own. Two were easy-apply — no essay required.", color: 'bg-amber-300', textColor: 'text-amber-300' },
              { name: 'Linda C.', school: 'Parent of 2026 applicant', quote: "The Financial Planner finally helped me understand what college will actually cost us. Eye-opening.", color: 'bg-cyan-600', textColor: 'text-cyan-600' },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 px-8 py-10">
                <div className={`mb-6 h-8 w-1 rounded-sm ${t.color}`} />
                <p className="mb-7 text-[15px] italic leading-[1.75] text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="text-[13px] font-extrabold text-slate-900">{t.name}</div>
                <div className={`mt-0.5 text-xs font-semibold ${t.textColor}`}>{t.school}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="bg-slate-900 px-[6%] py-24">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-14">
            <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/40">
              Pricing
            </div>
            <h2 className="text-[clamp(28px,4vw,52px)] font-black leading-[1.05] tracking-tight text-white">
              Simple pricing.<br />No surprises.
            </h2>
          </div>
          <div className="mx-auto max-w-[460px]">
            <PricingCard />
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
          <div className="text-base font-black tracking-tight text-white">Stairway U</div>
          <div className="flex gap-7">
            {[{ label: 'Sign In', href: '/login' }, { label: 'Sign Up', href: '/signup' }, { label: 'Pricing', href: '/upgrade' }, { label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }].map(l => (
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
