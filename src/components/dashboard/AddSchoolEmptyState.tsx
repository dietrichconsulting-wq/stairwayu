'use client'

import Link from 'next/link'
import { ArrowRight, School } from 'lucide-react'

interface AddSchoolEmptyStateProps {
  title: string
  description: string
  helper?: string
  href?: string
  cta?: string
}

export function AddSchoolEmptyState({
  title,
  description,
  helper = 'Your saved school list powers chances, essays, comparisons, tasks, and recommendations.',
  href = '/profile',
  cta = 'Add school',
}: AddSchoolEmptyStateProps) {
  return (
    <div
      className="card-elevated"
      style={{
        padding: '28px',
        border: '1.5px dashed color-mix(in srgb, var(--color-primary) 45%, var(--color-border))',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 8%, var(--color-card)), var(--color-card))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in srgb, var(--color-primary) 13%, transparent)',
            color: 'var(--color-primary)',
            flexShrink: 0,
          }}
        >
          <School size={24} strokeWidth={2.3} />
        </div>
        <div style={{ flex: '1 1 280px', minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 850, color: 'var(--color-text)', marginBottom: 7 }}>
            {title}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 14px', maxWidth: 560 }}>
            {description}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0, opacity: 0.82 }}>
            {helper}
          </p>
        </div>
        <Link
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 16px',
            borderRadius: 10,
            background: 'var(--color-primary)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 10px 24px color-mix(in srgb, var(--color-primary) 25%, transparent)',
            flexShrink: 0,
          }}
        >
          {cta}
          <ArrowRight size={15} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  )
}
