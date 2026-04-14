import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'For Counselors · Stairway U',
  description: 'Free counselor dashboard — see every student\'s college list, admission profile, and progress in one place. No extra logins, no spreadsheets.',
  openGraph: {
    title: 'Stairway U for Counselors',
    description: 'Track every student\'s college journey from one dashboard. Always free for counselors.',
    url: 'https://stairwayu.com/counselors',
  },
}

const PAIN_POINTS = [
  { icon: '📋', title: 'Are my students on track?', desc: 'See every student\'s college list, GPA, test scores, and admission snapshot without chasing them down.' },
  { icon: '⏰', title: 'Who\'s missing deadlines?', desc: 'Spot students who haven\'t built their list yet or are only targeting reaches.' },
  { icon: '📊', title: 'What does their list look like?', desc: 'Reach, target, and safety breakdown for each student — powered by federal admission data.' },
  { icon: '📥', title: 'Can I export this?', desc: 'Download a CSV of all your students\' profiles and college lists with one click.' },
  { icon: '🔗', title: 'How do students connect?', desc: 'Share an 8-character invite code. Students enter it on their profile and you\'re linked instantly.' },
  { icon: '🔒', title: 'Is student data safe?', desc: 'Students opt in to share. You get read-only access. They can unlink at any time.' },
]

const STEPS = [
  { step: '1', title: 'Sign up as a counselor', desc: 'Create a free account — takes 30 seconds.' },
  { step: '2', title: 'Generate an invite code', desc: 'Get an 8-character code from your dashboard.' },
  { step: '3', title: 'Students link their accounts', desc: 'They enter your code on their Stairway U profile.' },
  { step: '4', title: 'See everything in one place', desc: 'College lists, admission snapshots, and academic profiles — all on your dashboard.' },
]

export default function CounselorsPage() {
  return (
    <div style={{ background: '#0a0b0f', color: '#fff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px clamp(16px,4vw,40px)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 32 }} />
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/signup?type=counselor" style={{ fontSize: 13, fontWeight: 700, background: '#fff', color: '#0f172a', padding: '8px 20px', borderRadius: 8, textDecoration: 'none' }}>Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: 'clamp(120px,15vw,180px) clamp(16px,6vw,80px) 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>For Counselors</div>
        <h1 style={{ fontSize: 'clamp(32px,5vw,64px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 700, margin: '0 auto 24px' }}>
          Track every student.<br />Zero extra logins.
        </h1>
        <p style={{ fontSize: 'clamp(15px,1.8vw,19px)', color: 'rgba(255,255,255,0.6)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.6 }}>
          See college lists, admission profiles, and academic stats for every student who links with you — from one free dashboard.
        </p>
        <Link href="/signup?type=counselor" style={{ display: 'inline-block', background: '#fff', color: '#0f172a', padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
          Create Free Counselor Account
        </Link>
      </section>

      {/* Pain points */}
      <section style={{ padding: '0 clamp(16px,6vw,80px) 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {PAIN_POINTS.map(p => (
            <div key={p.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px clamp(16px,6vw,80px)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(20,184,166,0.8)', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 900, marginBottom: 48 }}>Up and running in under 5 minutes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24 }}>
            {STEPS.map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', color: '#14b8a6', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{s.step}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '80px clamp(16px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 900, marginBottom: 12 }}>Free for counselors. Always.</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, lineHeight: 1.6 }}>
            No trial, no credit card, no expiration. Counselor accounts are free because you drive student adoption.
          </p>
          <Link href="/signup?type=counselor" style={{ display: 'inline-block', background: '#14b8a6', color: '#fff', padding: '14px 32px', borderRadius: 10, fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px clamp(16px,6vw,80px)', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <Link href="/counselors" style={{ color: 'inherit', textDecoration: 'none' }}>For Counselors</Link>
          <Link href="/parents" style={{ color: 'inherit', textDecoration: 'none' }}>For Parents</Link>
          <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>
          Stairway U Inc. Data from the U.S. Department of Education College Scorecard.
        </div>
      </footer>
    </div>
  )
}
