import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Stairway U',
  description:
    'Built by a parent for families who want clarity in the college search. One dashboard, official data, no hype.',
  openGraph: {
    title: 'About Stairway U',
    description:
      'Built by a parent for families who want clarity in the college search. One dashboard, official data, no hype.',
    url: 'https://stairwayu.com/about',
  },
}

const WHAT_WE_BUILT = [
  {
    icon: '🎯',
    title: 'One admission snapshot',
    desc: 'Your student\'s GPA and scores matched against each school\'s published 25th–75th range, shown as a single number.',
  },
  {
    icon: '💰',
    title: 'Real cost, not sticker',
    desc: 'In-state vs. out-of-state tuition, average net price, and aid estimates, side by side for every school on the list.',
  },
  {
    icon: '🎓',
    title: 'Program-level rankings',
    desc: 'A letter grade for each major at each school, computed the same way for every student. Public methodology.',
  },
  {
    icon: '📝',
    title: 'Essay and strategy help',
    desc: 'Brainstorming and critique for Common App and supplements. Strategy builder for the full college list.',
  },
]

export default function AboutPage() {
  return (
    <div style={{ background: '#0a0b0f', color: '#fff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px clamp(16px,4vw,40px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'rgba(10,11,15,0.85)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 32 }} />
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link
            href="/login"
            style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: '#fff',
              color: '#0f172a',
              padding: '8px 20px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: 'clamp(120px,15vw,180px) clamp(16px,6vw,80px) 40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 16,
          }}
        >
          About
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px,5vw,56px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            maxWidth: 780,
            margin: '0 auto 20px',
          }}
        >
          Built by a parent,<br />
          for families who want clarity.
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px,1.8vw,19px)',
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 580,
            margin: '0 auto',
            lineHeight: 1.65,
          }}
        >
          StairwayU exists because the college search should feel exciting, not exhausting.
          One dashboard. Official data. No hype.
        </p>
      </section>

      {/* Origin story */}
      <section style={{ padding: '40px clamp(16px,6vw,80px) 80px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(20,184,166,0.8)',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            Why StairwayU exists
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: 900,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 1.25,
            }}
          >
            A dad, a high-schooler, and way too many open tabs.
          </h2>
          <div
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.75,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <p style={{ margin: 0 }}>
              I&apos;m a parent of a high-schooler. When we started the college search,
              I did what every parent does: opened a browser. Then another. Then ten.
            </p>
            <p style={{ margin: 0 }}>
              Admission rates on one site. Tuition on another. Scholarships somewhere
              else. A chancing calculator on a fourth site that asked for our email but
              wouldn&apos;t tell us how it did the math. Counselors are stretched thin,
              and every for-profit advisor wanted thousands of dollars to tell us
              something we could mostly figure out ourselves &mdash; if we had the time.
            </p>
            <p style={{ margin: 0 }}>
              I built the dashboard I wanted: one place, official federal data,
              admission estimates with the formula in plain English, and tools to
              compare schools on cost and outcomes without the sales pitch. I kept going
              because it worked &mdash; for my kid and for the friends and neighbors I
              shared it with.
            </p>
            <p style={{ margin: 0 }}>
              Now I want other families to have it too. The goal is simple: let kids and
              parents <em>enjoy</em> this season instead of worrying about it.
            </p>
          </div>
        </div>
      </section>

      {/* What we built */}
      <section
        style={{
          padding: '80px clamp(16px,6vw,80px)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(20,184,166,0.8)',
                marginBottom: 12,
              }}
            >
              What&apos;s inside
            </div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 900, margin: 0 }}>
              The tools I wanted, in one place.
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {WHAT_WE_BUILT.map(f => (
              <div
                key={f.title}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: '24px 22px',
                }}
              >
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we make money */}
      <section style={{ padding: '80px clamp(16px,6vw,80px)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            How we make money
          </div>
          <h2
            style={{
              fontSize: 'clamp(22px,3vw,32px)',
              fontWeight: 900,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Families pay us. Colleges don&apos;t.
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.75,
              margin: 0,
              textAlign: 'center',
            }}
          >
            StairwayU is a $9.99/month subscription with a 7-day free trial. That&apos;s
            it. Counselors use it free. We do not take money from colleges to feature,
            rank, or recommend them. We do not sell or share student data with
            advertisers, recruiters, or third parties. Admission percentages, program
            rankings, and college comparisons are computed the same way for every
            student, paying or free &mdash; and the formula is public on our{' '}
            <Link
              href="/methodology"
              style={{ color: '#fff', textDecoration: 'underline' }}
            >
              methodology page
            </Link>
            . If a college shows up at the top of your list, it&apos;s because the
            numbers put it there, not because we were paid to put it there.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px clamp(16px,6vw,80px) 100px', textAlign: 'center' }}>
        <Link
          href="/signup"
          style={{
            display: 'inline-block',
            background: '#fff',
            color: '#0f172a',
            padding: '14px 32px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          Try StairwayU free for 7 days
        </Link>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            marginTop: 16,
          }}
        >
          No credit card for counselors. Cancel anytime for families.
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px clamp(16px,6vw,80px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            flexWrap: 'wrap',
            fontSize: 12,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Home
          </Link>
          <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
            About
          </Link>
          <Link href="/counselors" style={{ color: 'inherit', textDecoration: 'none' }}>
            For Counselors
          </Link>
          <Link href="/parents" style={{ color: 'inherit', textDecoration: 'none' }}>
            For Parents
          </Link>
          <Link href="/methodology" style={{ color: 'inherit', textDecoration: 'none' }}>
            Methodology
          </Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
            Privacy
          </Link>
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 16,
            lineHeight: 1.55,
            maxWidth: 760,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          Admissions, cost, and outcomes data from the{' '}
          <a
            href="https://collegescorecard.ed.gov/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            U.S. Department of Education College Scorecard
          </a>
          . Stairway U is not affiliated with or endorsed by the U.S. Department of
          Education. Admission-chance estimates are statistical projections, not
          predictions or guarantees.{' '}
          <Link href="/methodology" style={{ color: 'inherit', textDecoration: 'underline' }}>
            See our methodology
          </Link>
          .
        </div>
      </footer>
    </div>
  )
}
