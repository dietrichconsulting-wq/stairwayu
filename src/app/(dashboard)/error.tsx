'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import * as Sentry from '@sentry/nextjs'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in oklab, var(--color-negative) 12%, transparent)',
          color: 'var(--color-negative)',
        }}
      >
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--color-text-muted)]">
        We hit a snag loading this page. This is on us — your data is safe. Try again, or head back to your dashboard.
      </p>

      {error?.digest && (
        <p
          className="mt-3 font-mono text-xs"
          style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}
        >
          Ref: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonVariants({ size: 'lg' })}
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'outline', size: 'lg' })}
        >
          <LayoutDashboard className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
