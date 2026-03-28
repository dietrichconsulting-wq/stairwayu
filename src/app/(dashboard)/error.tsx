'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard error boundary]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: 32,
      textAlign: 'center',
    }}>
      <span style={{ fontSize: 48, marginBottom: 16 }}>⚠️</span>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8, maxWidth: 400 }}>
        An unexpected error occurred. Your data is safe — try refreshing or click below to recover.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: 20,
          padding: '10px 24px',
          borderRadius: 10,
          border: '1.5px solid var(--color-primary)',
          background: 'var(--color-primary)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
