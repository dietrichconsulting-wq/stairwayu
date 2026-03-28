'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [refCode, setRefCode] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setRefCode(ref)
      try { localStorage.setItem('stairwayu_ref', ref) } catch {}
    }
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          ...(refCode ? { referral_code: refCode } : {}),
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div className="card-elevated" style={{ maxWidth: 400, width: '100%', padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link href="/login" style={{ display: 'block', marginTop: 24, color: 'var(--color-primary)', fontWeight: 600, fontSize: 14 }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
      <div className="card-elevated" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        {refCode && (
          <div style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1.5px solid rgba(99,102,241,0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 20,
            fontSize: 13,
            color: 'var(--color-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>🎉</span>
            <span>You were invited by a friend! Welcome to Stairway U.</span>
          </div>
        )}

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 6 }}>Create Account</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Start your college journey</div>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Name', type: 'text', value: name, set: setName, placeholder: 'Your name' },
            { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@school.edu' },
            { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '8+ characters' },
          ].map(({ label, type, value, set, placeholder }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={e => set(e.target.value)}
                required
                placeholder={placeholder}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'var(--color-column)', color: 'var(--color-text)', fontSize: 14, outline: 'none', width: '100%' }}
              />
            </div>
          ))}

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Sign in</Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, opacity: 0.6 }}>
          By signing up you agree to our{' '}
          <Link href="/terms" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Terms</Link>
          {' and '}
          <Link href="/privacy" style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
