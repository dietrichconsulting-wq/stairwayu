'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const [codes, setCodes] = useState<{ id: string; code: string; use_count: number; max_uses: number; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  async function fetchCodes() {
    const res = await fetch('/api/counselor/invite')
    if (res.ok) {
      const data = await res.json()
      setCodes(data.codes ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchCodes() }, [])

  async function handleGenerate() {
    setGenerating(true)
    const res = await fetch('/api/counselor/invite', { method: 'POST' })
    if (res.ok) await fetchCodes()
    setGenerating(false)
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeCode = codes[0]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', margin: 0, marginBottom: 8 }}>Invite Students</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Share your invite code with students. They&apos;ll enter it on their Stairway U profile to link their account to yours.
      </p>

      {loading ? (
        <div className="card-elevated" style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : activeCode ? (
        <div className="card-elevated" style={{ padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 12 }}>
            Your Invite Code
          </div>
          <div
            onClick={() => handleCopy(activeCode.code)}
            style={{
              fontSize: 36, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--color-primary)',
              cursor: 'pointer', padding: '12px 24px', borderRadius: 12,
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
              display: 'inline-block', userSelect: 'all',
            }}
          >
            {activeCode.code}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 12 }}>
            {copied ? '✓ Copied!' : 'Click to copy'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 16 }}>
            {activeCode.use_count} of {activeCode.max_uses} slots used
          </div>
        </div>
      ) : (
        <div className="card-elevated" style={{ padding: '32px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
            Generate an invite code to start linking students.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {generating ? 'Generating...' : 'Generate Invite Code'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 32, padding: '20px 24px', background: 'var(--color-column)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>How it works</div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          <li>Share your invite code with your students</li>
          <li>Students go to their Profile page on Stairway U</li>
          <li>They enter the code in the &quot;Link to Counselor&quot; section</li>
          <li>You&apos;ll see their college list and profile on your Students page</li>
        </ol>
      </div>

      {!activeCode && !loading && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {generating ? 'Generating...' : 'Generate Invite Code'}
          </button>
        </div>
      )}
    </div>
  )
}
