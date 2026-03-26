'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Profile, Subscription } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',     icon: '⊞',  label: 'Dashboard' },
  { href: '/journey',       icon: '🗺️',  label: 'Your Journey' },
  { href: '/compare',       icon: '⚖️',  label: 'Compare' },
  { href: '/strategy',      icon: '⚡',  label: 'Strategy' },
  { href: '/essays',        icon: '✍️',  label: 'Essays' },
  { href: '/scholarships',  icon: '🏆',  label: 'Scholarships' },
  { href: '/finance',       icon: '💵',  label: 'Finance Plan' },
  { href: '/profile',       icon: '👤',  label: 'Profile' },
]

interface SidebarProps {
  user: User
  profile: Profile | null
  subscription: Pick<Subscription, 'tier' | 'status' | 'billing_interval'> | null
}

export function Sidebar({ user, profile, subscription }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isPro = subscription?.tier === 'pro' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing')

  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <span style={{ fontSize: 18 }}>🎓</span>
        {' '}Stairway U
      </div>

      <div className="sidebar__nav">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={`sidebar__nav-item ${active ? 'sidebar__nav-item--active' : ''}`}>
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="sidebar__nav-item-bg"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span style={{ fontSize: 15, position: 'relative' }}>{item.icon}</span>
              <span style={{ position: 'relative' }}>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        {/* Referral prompt — only shown to Pro users */}
        {isPro && (
          <Link
            href="/profile#referrals"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, marginBottom: 10,
              background: 'rgba(94,234,212,0.06)',
              border: '1px solid rgba(94,234,212,0.15)',
              textDecoration: 'none', color: 'var(--color-text)',
              fontSize: 12, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 14 }}>🎁</span>
            <div>
              <div>Invite Friends</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)' }}>Share &amp; both get 2 wks free</div>
            </div>
          </Link>
        )}

        {/* Pro badge or upgrade */}
        {isPro ? (
          <div style={{ fontSize: 11, fontWeight: 700, color: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? '#C4B5FD' : '#7c3aed', background: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(196,181,253,0.10)' : 'rgba(124,58,237,0.1)', borderRadius: 8, padding: '4px 10px', textAlign: 'center', marginBottom: 12 }}>
            {subscription?.billing_interval === 'year'
              ? '✨ Pro Annual'
              : subscription?.billing_interval === 'month'
              ? '✨ Pro Monthly'
              : '✨ Pro Trial'}
          </div>
        ) : (
          <Link href="/upgrade" style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--color-primary)', borderRadius: 8, padding: '6px 10px', marginBottom: 12, textDecoration: 'none' }}>
            Upgrade to Pro
          </Link>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.display_name || user.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: '4px', borderRadius: 6, flexShrink: 0 }}
          >
            ↩
          </button>
        </div>
      </div>
    </nav>
  )
}
