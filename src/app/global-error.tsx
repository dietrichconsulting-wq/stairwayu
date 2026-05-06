'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  // global-error replaces the root layout, so it must render its own <html> and <body>.
  // Keep styles inline — we can't rely on the app's CSS loading successfully at this point.
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: '#0a0a0a',
          color: '#f5f5f5',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          textAlign: 'center',
        }}
      >
        <main style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            Something broke
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 15,
              lineHeight: 1.55,
              color: 'rgba(245,245,245,0.7)',
            }}
          >
            An unexpected error stopped us from loading StairwayU. Your data is safe. Try again, or return to the home page.
          </p>

          {error?.digest && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                color: 'rgba(245,245,245,0.45)',
              }}
            >
              Ref: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                background: '#f5f5f5',
                color: '#0a0a0a',
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid rgba(245,245,245,0.2)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                color: '#f5f5f5',
                background: 'transparent',
              }}
            >
              Back to home
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
