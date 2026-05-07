'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AuthAlert,
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from '@/components/AuthShell'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const urlError = searchParams.get('error')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleGoogleLogin() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      setError(error.message)
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Stairway U"
      subtitle="Pick up your college list, chances, scholarships, and essays right where you left off."
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-semibold text-teal-200 no-underline hover:text-white">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={authInputClassName}
            placeholder="Password"
          />
        </div>

        {message && <AuthAlert tone="success">{message}</AuthAlert>}
        {(error || urlError) && <AuthAlert>{error || urlError}</AuthAlert>}

        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-white/35">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <button onClick={handleGoogleLogin} className={authSecondaryButtonClassName}>
        <GoogleIcon />
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-white/50">
        New to Stairway U?{' '}
        <Link href="/signup" className="font-bold text-white no-underline hover:text-teal-200">
          Create an account
        </Link>
      </p>

      <p className="mt-4 text-center text-[11px] text-white/35">
        <Link href="/terms" className="text-white/35 no-underline hover:text-white/70">Terms</Link>
        {' '} &middot; {' '}
        <Link href="/privacy" className="text-white/35 no-underline hover:text-white/70">Privacy</Link>
      </p>
    </AuthShell>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
