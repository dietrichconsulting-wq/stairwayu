'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(searchParams.get('error') || '')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
      <div className="card-elevated" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <img src="/stairwayu-logo.svg" alt="" style={{ width: 32, height: 32, borderRadius: 6 }} />
            Stairway U
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Reset your password</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              We sent a password reset link to <strong>{email}</strong>
            </div>
            <Link href="/login" style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  placeholder="you@school.edu"
                />
              </div>

              {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

              <button type="submit" disabled={loading} style={primaryBtnStyle}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 24 }}>
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-column)',
  color: 'var(--color-text)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
}

const primaryBtnStyle: React.CSSProperties = {
  background: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
}
