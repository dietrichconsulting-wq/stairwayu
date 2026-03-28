'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Profile, Subscription } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useXp } from '@/hooks/useXp'

const NAV_ITEMS = [
  { href: '/dashboard',      icon: '⊞',  label: 'Dashboard' },
  { href: '/journey',        icon: '🗺️',  label: 'Your Journey' },
  { href: '/strategy',       icon: '⚡',  label: 'Strategy' },
  { href: '/compare',        icon: '⚖️',  label: 'Compare' },
  { href: '/find-major',     icon: '🧭', label: 'Find Your Major' },
  { href: '/essays',         icon: '✍️',  label: 'Essays' },
  { href: '/scholarships',   icon: '🏆',  label: 'Scholarships' },
  { href: '/finance',        icon: '💵',  label: 'Finance Plan' },
  { href: '/profile',        icon: '👤',  label: 'Profile' },
]

interface SidebarProps {
  user: User
  profile: Profile | null
  subscription: Pick<Subscription, 'tier' | 'status' | 'billing_interval'> | null
}

const LEVEL_COLORS = [
  '#94A3B8', // Lv 1 – slate
  '#94A3B8', // Lv 2 – slate
  '#38BDF8', // Lv 3 – sky
  '#38BDF8', // Lv 4 – sky
  '#A78BFA', // Lv 5 – violet
  '#A78BFA', // Lv 6 – violet
  '#FBBF24', // Lv 7 – amber
  '#FBBF24', // Lv 8 – amber
  '#F87171', // Lv 9 – red
  '#F87171', // Lv 10 – red
]

export function Sidebar({ user, profile, subscription }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { level, totalXp, xpIntoLevel, xpForNextLevel, isMaxLevel, isLoading: xpLoading } = useXp(user.id)

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close drawer on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    if (mobileOpen) {
      document.addEventListener('keydown', handleKey)
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // Swipe-to-close for mobile drawer
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const drawerRef = useRef<HTMLElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX
    const delta = touchCurrentX.current - touchStartX.current
    // Only allow dragging left (negative delta)
    if (delta < 0 && drawerRef.current) {
      drawerRef.current.style.transform = `translateX(${delta}px)`
      drawerRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentX.current - touchStartX.current
    if (drawerRef.current) {
      drawerRef.current.style.transform = ''
      drawerRef.current.style.transition = ''
    }
    // Close if swiped left more than 80px
    if (delta < -80) {
      setMobileOpen(false)
    }
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isPro = subscription?.tier === 'pro' &&
    (subscription?.status === 'active' || subscription?.status === 'trialing')

  const navContent = (
    <>
      <div className="sidebar__brand">
        <span style={{ fontSize: 18 }}>🎓</span>
        {' '}Stairway U
        {/* Close button — only visible on mobile */}
        <button
          className="sidebar__close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
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
              <div>Suggest to a Friend</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)' }}>Earn 50 XP + 7 days free</div>
            </div>
          </Link>
        )}

        {isPro && (
          <div style={{ fontSize: 11, fontWeight: 700, color: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? '#FCD34D' : '#d97706', background: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(252,211,77,0.10)' : 'rgba(217,119,6,0.1)', borderRadius: 8, padding: '4px 10px', textAlign: 'center', marginBottom: 12 }}>
            {subscription?.status === 'trialing'
              ? '✨ Free Trial'
              : subscription?.billing_interval === 'year'
              ? '✨ Annual'
              : '✨ Monthly'}
          </div>
        )}

        {/* XP Level badge + progress */}
        {!xpLoading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', borderRadius: 8, marginBottom: 10,
            background: 'color-mix(in srgb, var(--color-border) 40%, transparent)',
          }}>
            <div
              style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff',
                background: LEVEL_COLORS[level - 1] ?? LEVEL_COLORS[0],
              }}
              title={`${totalXp} XP total`}
            >
              {level}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
                Level {level} · {totalXp} XP
              </div>
              {!isMaxLevel && xpForNextLevel != null && (
                <div style={{ height: 3, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: LEVEL_COLORS[level - 1] ?? LEVEL_COLORS[0],
                    width: `${Math.min(100, (xpIntoLevel / xpForNextLevel) * 100)}%`,
                    transition: 'width 0.4s ease-out',
                  }} />
                </div>
              )}
              {isMaxLevel && (
                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600 }}>MAX LEVEL</div>
              )}
            </div>
          </div>
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
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="mobile-topbar">
        <button
          className="mobile-topbar__hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
        <span className="mobile-topbar__brand">🎓 Stairway U</span>
        <div style={{ width: 32 }} /> {/* Spacer for centering */}
      </div>

      {/* ── Desktop sidebar (always visible ≥768px) ── */}
      <nav className="sidebar sidebar--desktop">
        {navContent}
      </nav>

      {/* ── Mobile drawer + overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.nav
              ref={drawerRef}
              className="sidebar sidebar--mobile"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 35 }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {navContent}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
