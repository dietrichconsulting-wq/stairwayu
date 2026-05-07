'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  AuthAlert,
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from '@/components/AuthShell'
import { createClient } from '@/lib/supabase/client'

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
    <AuthShell
      eyebrow="Account recovery"
      title={sent ? 'Check your email' : 'Reset your password'}
      subtitle={
        sent
          ? `We sent a password reset link to ${email}.`
          : 'Enter your account email and we will send a secure reset link.'
      }
    >
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-teal-400/10 text-xs font-extrabold uppercase tracking-[0.12em] text-teal-200">
            Sent
          </div>
          <Link href="/login" className={authPrimaryButtonClassName}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={authLabelClassName}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={authInputClassName}
                placeholder="you@school.edu"
              />
            </div>

            {error && <AuthAlert>{error}</AuthAlert>}

            <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            <Link href="/login" className="font-bold text-white no-underline hover:text-teal-200">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
