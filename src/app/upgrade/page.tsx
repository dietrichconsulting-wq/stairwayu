'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Sparkles,
  BarChart3,
  Map as MapIcon,
  Infinity as InfinityIcon,
  Zap,
  Scale,
  PenTool,
  Trophy,
  Radar,
  type LucideIcon,
} from 'lucide-react'

type Feature = { Icon: LucideIcon; label: string; desc: string }

const FREE_FEATURES: Feature[] = [
  { Icon: GraduationCap, label: 'Up to 8 colleges', desc: 'Track your top schools on the dashboard' },
  { Icon: Sparkles, label: '3 AI calls per day', desc: 'Strategy, essays, and scholarships' },
  { Icon: BarChart3, label: 'Admission chancing', desc: 'See your score for each school' },
  { Icon: MapIcon, label: 'Journey milestones', desc: 'Visual progress tracker' },
]

const PRO_FEATURES: Feature[] = [
  { Icon: InfinityIcon, label: 'Unlimited colleges', desc: 'No cap on schools you can track' },
  { Icon: Sparkles, label: 'Unlimited AI calls', desc: 'Strategy, essays, scholarships — no daily limit' },
  { Icon: Zap, label: 'College Strategy Generator', desc: 'AI-powered reach/target/safety list with real data' },
  { Icon: Scale, label: 'College Comparison', desc: 'Side-by-side with live admissions stats' },
  { Icon: PenTool, label: 'Full Essay Coaching', desc: 'Unlimited brainstorm + critique cycles' },
  { Icon: Trophy, label: 'Unlimited scholarships', desc: 'Track as many as you need' },
  { Icon: Radar, label: 'Deadline Radar', desc: 'Smart deadline tracking across all apps' },
]

export default function UpgradePage() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [codeSuccess, setCodeSuccess] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    setUpgradeError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setUpgradeError(data.error || 'Failed to start checkout. Please try again.')
        setLoading(false)
      }
    } catch {
      setUpgradeError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleRedeem() {
    setCodeError('')
    setCodeLoading(true)
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCodeError(data.error || 'Invalid code')
      } else {
        setCodeSuccess(true)
        setTimeout(() => { window.location.replace(`/dashboard?upgraded=${Date.now()}`) }, 2000)
      }
    } catch {
      setCodeError('Something went wrong')
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 480, width: '100%' }}>
        <div className="card-elevated" style={{ padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Sparkles style={{ width: 32, height: 32, color: 'var(--color-primary)' }} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>Stairway U</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Everything you need to build a smart college list
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.6, opacity: 0.7 }}>
            Free gets you started. Pro removes every limit.
          </p>

          {/* Free tier summary */}
          <div style={{ textAlign: 'left', marginBottom: 24, padding: '16px 18px', borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface, rgba(255,255,255,0.03))' }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>Free — $0 forever</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FREE_FEATURES.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <f.Icon
                    aria-hidden="true"
                    style={{ width: 16, height: 16, flexShrink: 0, color: 'var(--color-text-muted)' }}
                  />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro tier */}
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--color-primary)' }}>Upgrade to Pro</div>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', background: 'var(--color-surface, rgba(255,255,255,0.06))', borderRadius: 10, padding: 3, marginBottom: 20, border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setPlan('monthly')}
              style={{
                padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: plan === 'monthly' ? 'var(--color-primary)' : 'transparent',
                color: plan === 'monthly' ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setPlan('annual')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: plan === 'annual' ? 'var(--color-primary)' : 'transparent',
                color: plan === 'annual' ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.15s',
              }}
            >
              Annual
              <span style={{ fontSize: 10, fontWeight: 800, background: '#fbbf24', color: '#78350f', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.04em' }}>
                BEST VALUE
              </span>
            </button>
          </div>

          {/* Price display */}
          {plan === 'monthly' ? (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 28 }}>
              <span style={{ fontSize: 36, fontWeight: 800 }}>$9.99</span>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>/month</span>
            </div>
          ) : (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800 }}>$79</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>/year</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>$119.88</span>
              </div>
              <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
                $6.58/mo · Save 34%
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
            {PRO_FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <f.Icon
                  aria-hidden="true"
                  style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, color: 'var(--color-primary)' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontWeight: 800, fontSize: 16, cursor: 'pointer', width: '100%', marginBottom: 12 }}
          >
            {loading ? 'Redirecting…' : 'Start 7-Day Pro Trial →'}
          </button>

          {upgradeError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>{upgradeError}</p>}

          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
            You won&apos;t be charged during your 7-day Pro trial.<br />
            Cancel anytime from your Profile before the trial ends — no charge.<br />
            <span style={{ opacity: 0.7 }}>Replaces CollegeVine + Niche + Scholarply + ChatGPT + spreadsheets.</span>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border, #e5e7eb)', paddingTop: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10 }}>Have a promo code?</p>
            {codeSuccess ? (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                Access activated! Redirecting...
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={code}
                  onChange={e => { setCode(e.target.value); setCodeError('') }}
                  placeholder="Enter code"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border, #d1d5db)', fontSize: 14, background: 'var(--color-bg)', color: 'var(--color-text)' }}
                />
                <button
                  onClick={handleRedeem}
                  disabled={codeLoading || !code.trim()}
                  style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: codeLoading || !code.trim() ? 0.5 : 1 }}
                >
                  {codeLoading ? '...' : 'Redeem'}
                </button>
              </div>
            )}
            {codeError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{codeError}</p>}
          </div>

          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            ← Back to dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
