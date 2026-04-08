'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Sign out so the user logs in fresh with their new password
      await supabase.auth.signOut()
      router.push('/login?message=Password+updated.+Please+sign+in.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '24px' }}>
      <div className="card-elevated" style={{ width: '100%', maxWidth: 400, padding: '40px 36px' }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ marginBottom: 4 }}>
            <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 44, width: 'auto', borderRadius: 6 }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Choose a new password</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputStyle}
              placeholder="Min. 8 characters"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={inputStyle}
              placeholder="••••••••"
            />
          </div>

          {error && <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</div>}

          <button type="submit" disabled={loading} style={primaryBtnStyle}>
            {loading ? 'Updating…' : 'Set New Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 24 }}>
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Back to sign in</Link>
        </p>
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
