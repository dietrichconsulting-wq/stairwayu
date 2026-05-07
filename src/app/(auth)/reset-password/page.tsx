'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AuthAlert,
  AuthShell,
  authInputClassName,
  authLabelClassName,
  authPrimaryButtonClassName,
} from '@/components/AuthShell'
import { createClient } from '@/lib/supabase/client'

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
      // Sign out so the user logs in fresh with their new password.
      await supabase.auth.signOut()
      router.push('/login?message=Password+updated.+Please+sign+in.')
    }
  }

  return (
    <AuthShell
      eyebrow="Secure reset"
      title="Choose a new password"
      subtitle="Set a fresh password, then sign back in to continue your college plan."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={authLabelClassName}>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={authInputClassName}
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label className={authLabelClassName}>Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className={authInputClassName}
            placeholder="Confirm password"
          />
        </div>

        {error && <AuthAlert>{error}</AuthAlert>}

        <button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Updating...' : 'Set new password'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        <Link href="/login" className="font-bold text-white no-underline hover:text-teal-200">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  )
}
