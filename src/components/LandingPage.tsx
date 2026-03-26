'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

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
    desc: 'AI brainstorming and critique for Common App and every supplement.',
    img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
    cta: 'Start Writing',
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

function ProCard() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  return (
    <div style={{ background: 'linear-gradient(135deg, #1C1D24, #252730)', padding: '48px 40px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 20, right: 20, background: '#fbbf24', color: '#78350f', fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 2, letterSpacing: '0.1em' }}>
        MOST POPULAR
      </div>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Pro</div>

      {/* Billing toggle */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 2, marginBottom: 16, border: '1px solid rgba(255,255,255,0.15)' }}>
        <button
          onClick={() => setPlan('monthly')}
          style={{
            padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: plan === 'monthly' ? 'rgba(255,255,255,0.25)' : 'transparent',
            color: '#fff', transition: 'all 0.15s',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setPlan('annual')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: plan === 'annual' ? 'rgba(255,255,255,0.25)' : 'transparent',
            color: '#fff', transition: 'all 0.15s',
          }}
        >
          Annual
          <span style={{ fontSize: 9, fontWeight: 800, background: '#fbbf24', color: '#78350f', borderRadius: 3, padding: '1px 4px' }}>✦</span>
        </button>
      </div>

      {plan === 'monthly' ? (
        <>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>$9.99</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 36 }}>per month</div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>$79</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>$119.88</span>
          </div>
          <div style={{ fontSize: 13, color: '#86efac', fontWeight: 700, marginBottom: 36 }}>$6.58/mo · Save 34%</div>
        </>
      )}

      {['AI Admission Snapshot', 'Scholarship Finder', 'College Comparison', 'Financial Planner', 'Essay Studio', 'Unlimited everything'].map(f => (
        <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>✓</div>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{f}</span>
        </div>
      ))}
      <Link href="/signup" style={{
        display: 'block', textAlign: 'center', marginTop: 36,
        background: '#fff', color: '#0f172a',
        textDecoration: 'none', borderRadius: 4, padding: '14px',
        fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        Start Pro Free →
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
    <div style={{ fontFamily: 'Inter, -apple-system, sans-serif', color: '#0f172a', background: '#fff', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60,
        background: scrolled ? 'rgba(15,23,42,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'background 0.3s',
      }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          Stairway U
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/login" style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            textDecoration: 'none', padding: '8px 16px', borderRadius: 6,
          }}>
            Sign In
          </Link>
          <Link href="/signup" style={{
            fontSize: 13, fontWeight: 700,
            background: '#fff', color: '#0f172a',
            textDecoration: 'none', padding: '9px 20px', borderRadius: 6,
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden' }}>
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1920&q=85"
          alt="High school seniors at college campus"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 30%',
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(18,19,24,0.92) 0%, rgba(28,29,36,0.8) 50%, rgba(37,39,48,0.6) 100%)',
        }} />

        {/* Hero content — bottom-left, Nike style */}
        <div style={{
          position: 'absolute', bottom: '12%', left: '6%', maxWidth: 680,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            AI-Powered College Planning
          </div>
          <h1 style={{
            fontSize: 'clamp(48px, 7vw, 88px)',
            fontWeight: 900, color: '#fff',
            lineHeight: 1.0, margin: '0 0 24px',
            letterSpacing: '-0.03em',
          }}>
            Your Stairway<br />to College.
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.5, maxWidth: 480 }}>
            Know your real odds. Find your scholarships.<br />Get in.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              background: '#fff', color: '#0f172a',
              textDecoration: 'none', borderRadius: 6, padding: '16px 40px',
              fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em',
            }}>
              Start for Free
            </Link>
            <Link href="/login" style={{
              background: 'transparent', color: '#fff',
              border: '2px solid rgba(255,255,255,0.5)',
              textDecoration: 'none', borderRadius: 6, padding: '16px 40px',
              fontWeight: 700, fontSize: 15,
            }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, right: 48, color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Scroll ↓
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ background: '#0f172a', padding: '28px 6%' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center' }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE GRID — Nike product tiles ── */}
      <section style={{ background: '#f1f5f9', padding: '4px 4px 4px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {FEATURES.map(f => (
            <div key={f.label} style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#0f172a', cursor: 'pointer' }}
              onMouseEnter={e => {
                const img = e.currentTarget.querySelector('img') as HTMLImageElement
                if (img) img.style.transform = 'scale(1.04)'
              }}
              onMouseLeave={e => {
                const img = e.currentTarget.querySelector('img') as HTMLImageElement
                if (img) img.style.transform = 'scale(1)'
              }}
            >
              <img
                src={f.img}
                alt={f.label}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.6s ease',
                  opacity: 0.75,
                }}
              />
              {/* gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: f.light
                  ? 'linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%)'
                  : 'linear-gradient(to top, rgba(18,19,24,0.9) 0%, transparent 60%)',
              }} />
              {/* Text content */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 36px' }}>
                <div style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 20, lineHeight: 1.5 }}>
                  {f.desc}
                </div>
                <Link href={f.href} style={{
                  display: 'inline-block',
                  background: '#fff', color: '#0f172a',
                  textDecoration: 'none', borderRadius: 4, padding: '10px 22px',
                  fontWeight: 800, fontSize: 12, letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}>
                  {f.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL-BLEED SECOND HERO — Journey Tracker ── */}
      <section style={{ position: 'relative', height: '70vh', minHeight: 480, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=85"
          alt="Graduation ceremony"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(18,19,24,0.88) 0%, rgba(37,39,48,0.7) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            Journey Tracker
          </div>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 20, maxWidth: 700 }}>
            From sophomore year<br />to decision day.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', maxWidth: 440, lineHeight: 1.6, marginBottom: 36 }}>
            A visual roadmap of every milestone — with a progress ring that shows exactly where you stand.
          </p>
          <Link href="/signup" style={{
            background: '#5EEAD4', color: '#0f172a',
            textDecoration: 'none', borderRadius: 6, padding: '16px 44px',
            fontWeight: 800, fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Start Your Journey
          </Link>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#fff', padding: '96px 6%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#5EEAD4', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Student Stories
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Real students.<br />Real results.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {[
              { name: 'Sophia R.', school: 'Admitted to UT Austin', quote: "Stairway U showed me I had a 74% chance at UT Austin. That gave me the confidence to apply early. I got in.", color: '#5EEAD4' },
              { name: 'Marcus T.', school: '$28,000 in scholarships', quote: "The scholarship finder surfaced 3 I never would have found on my own. Two were easy-apply — no essay required.", color: '#FCD34D' },
              { name: 'Linda C.', school: 'Parent of 2026 applicant', quote: "The Financial Planner finally helped me understand what college will actually cost us. Eye-opening.", color: '#0891b2' },
            ].map((t, i) => (
              <div key={i} style={{ background: '#f8fafc', padding: '40px 32px' }}>
                <div style={{ width: 4, height: 32, background: t.color, marginBottom: 24, borderRadius: 2 }} />
                <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.75, marginBottom: 28, fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: t.color, fontWeight: 600, marginTop: 2 }}>{t.school}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ background: '#0f172a', padding: '96px 6%' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
              Pricing
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Simple pricing.<br />No surprises.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Free */}
            <div style={{ background: '#1e293b', padding: '48px 40px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Free</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 4 }}>$0</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 36 }}>Forever</div>
              {['Journey roadmap', 'Task tracker', 'College search', 'Basic profile'].map(f => (
                <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>✓</div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                </div>
              ))}
              <Link href="/signup" style={{
                display: 'block', textAlign: 'center', marginTop: 36,
                background: 'transparent', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.2)',
                textDecoration: 'none', borderRadius: 4, padding: '14px',
                fontWeight: 700, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Get Started
              </Link>
            </div>
            {/* Pro */}
            <ProCard />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', height: '50vh', minHeight: 360, overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1920&q=85"
          alt="College campus"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(18,19,24,0.94) 0%, rgba(37,39,48,0.75) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 32, maxWidth: 600 }}>
            Your dream school is waiting.
          </h2>
          <Link href="/signup" style={{
            background: '#fff', color: '#0f172a',
            textDecoration: 'none', borderRadius: 6, padding: '18px 52px',
            fontWeight: 900, fontSize: 15, letterSpacing: '0.03em', textTransform: 'uppercase',
          }}>
            Get Started Free
          </Link>
          <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
            No credit card required
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#020617', padding: '40px 6%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Stairway U</div>
          <div style={{ display: 'flex', gap: 28 }}>
            {[{ label: 'Sign In', href: '/login' }, { label: 'Sign Up', href: '/signup' }, { label: 'Pricing', href: '/upgrade' }].map(l => (
              <Link key={l.href} href={l.href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 500, letterSpacing: '0.03em' }}>
                {l.label}
              </Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2025 Stairway U</div>
        </div>
      </footer>

    </div>
  )
}
