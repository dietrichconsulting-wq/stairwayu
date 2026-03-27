'use client'

import { useState } from 'react'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { MajorExplorer } from './MajorExplorer'

interface FindMajorClientProps {
  userId: string
}

export function FindMajorClient({ userId }: FindMajorClientProps) {
  const { data: profile } = useProfile(userId)
  const updateProfile = useUpdateProfile(userId)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <div style={{ maxWidth: 900, width: '100%' }}>
      {toast && (
        <div style={{
          background: 'rgba(94,234,212,0.12)',
          border: '1.5px solid rgba(94,234,212,0.25)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      )}

      <MajorExplorer
        currentMajor={profile?.proposed_major}
        onSelectMajor={(major) => {
          updateProfile.mutate({ proposed_major: major })
          setToast(`✓ Major set to ${major}`)
          setTimeout(() => setToast(null), 3000)
        }}
      />
    </div>
  )
}
