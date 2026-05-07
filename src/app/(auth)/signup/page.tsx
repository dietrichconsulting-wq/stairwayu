'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AuthAlert,
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from '@/components/AuthShell'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [refCode, setRefCode] = useState<string | null>(null)
  const [userType, setUserType] = useState<'student' | 'counselor'>('student')
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setRefCode(ref)
      try { localStorage.setItem('stairwayu_ref', ref) } catch {}
    }
    const type = params.get('type')
    if (type === 'counselor') setUserType('counselor')
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
          ...(userType === 'counselor' ? { user_type: 'counselor' } : {}),
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
      <AuthShell
        eyebrow="Almost there"
        title="Check your email"
        subtitle={`We sent a confirmation link to ${email}. Click it to activate your account.`}
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-teal-400/10 text-xs font-extrabold uppercase tracking-[0.12em] text-teal-200">
            Sent
          </div>
          <Link href="/login" className={authPrimaryButtonClassName}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow={userType === 'counselor' ? 'Counselor access' : 'Start free'}
      title={userType === 'counselor' ? 'Create counselor account' : 'Create your account'}
      subtitle={
        userType === 'counselor'
          ? 'Track student journeys, deadlines, and college progress from one polished dashboard.'
          : 'Save your college chances, build your list, and unlock the rest of your Stairway U dashboard.'
      }
    >
      <div className="mb-5 space-y-3">
        {refCode && (
          <AuthAlert tone="info">
            You were invited by a friend. Welcome to Stairway U.
          </AuthAlert>
        )}
        {userType === 'counselor' && (
          <AuthAlert tone="success">
            Counselor accounts are always free.
          </AuthAlert>
        )}
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        {[
          { label: 'Name', type: 'text', value: name, set: setName, placeholder: 'Your name' },
          { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@school.edu' },
          { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '8+ characters' },
        ].map(({ label, type, value, set, placeholder }) => (
          <div key={label}>
            <label className={authLabelClassName}>{label}</label>
            <input
              type={type}
              value={value}
              onChange={e => set(e.target.value)}
              required
              placeholder={placeholder}
              className={authInputClassName}
            />
          </div>
        ))}

        {error && <AuthAlert>{error}</AuthAlert>}

        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-white no-underline hover:text-teal-200">
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-white/35">
        By signing up you agree to our{' '}
        <Link href="/terms" className="text-white/45 underline decoration-white/20 underline-offset-2 hover:text-white/70">Terms</Link>
        {' and '}
        <Link href="/privacy" className="text-white/45 underline decoration-white/20 underline-offset-2 hover:text-white/70">Privacy Policy</Link>.
      </p>
    </AuthShell>
  )
}
