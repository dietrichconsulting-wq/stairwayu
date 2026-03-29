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
import { useUsage } from '@/hooks/useCredits'
import { Tooltip } from '@/components/ui/Tooltip'

const NAV_ITEMS = [
  { href: '/dashboard',      icon: '⊞',  label: 'Dashboard',        tip: 'Your home base — stats, progress, and next steps at a glance.' },
  { href: '/journey',        icon: '🗺️',  label: 'Your Journey',     tip: 'Step-by-step milestones from freshman year through submission.' },
  { href: '/strategy',       icon: '⚡',  label: 'Strategy',         tip: 'Generate a 3-tier application strategy with these schools.' },
  { href: '/explore',         icon: '🎚️',  label: 'Explore',           tip: 'Slide your stats and discover matching schools instantly.' },
  { href: '/score-bands',    icon: '📊',  label: 'Score Bands',      tip: 'Browse schools grouped by your admission chance tier.' },
  { href: '/compare',        icon: '⚖️',  label: 'Compare',          tip: 'Side-by-side comparison of your saved schools.' },
  { href: '/find-major',     icon: '🧭', label: 'Find Your Major',  tip: 'Explore majors that match your interests and strengths.' },
  { href: '/essays',         icon: '✍️',  label: 'Essays',           tip: 'Find your story angle, then get feedback that sharpens your voice.' },
  { href: '/scholarships',   icon: '🏆',  label: 'Scholarships',     tip: 'Discover scholarships matched to your profile.' },
  { href: '/finance',        icon: '💵',  label: 'Finance Plan',     tip: 'Plan how to pay for college — aid, loans, and family contribution.' },
  { href: '/profile',        icon: '👤',  label: 'Profile',          tip: 'Edit your academic stats, preferences, and account settings.' },
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
  const { data: usage } = useUsage()

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
          const tourAttr: Record<string, string> = {
            '/journey': 'nav-journey',
            '/explore': 'nav-explore',
            '/score-bands': 'nav-score-bands',
            '/strategy': 'nav-strategy',
            '/essays': 'nav-essays',
            '/scholarships': 'nav-scholarships',
          }
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Tooltip key={item.href} text={item.tip} position="right" delay={500}>
            <Link href={item.href} className={`sidebar__nav-item ${active ? 'sidebar__nav-item--active' : ''}`} aria-current={active ? 'page' : undefined} data-tour={tourAttr[item.href]}>
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
            </Tooltip>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        {isPro ? (
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
        ) : (
          <Link
            href="/upgrade"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8, marginBottom: 10,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(168,85,247,0.10))',
              border: '1px solid rgba(99,102,241,0.20)',
              textDecoration: 'none', color: 'var(--color-text)',
              fontSize: 12, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 700 }}>Upgrade to Pro</div>
              <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-muted)' }}>Unlimited AI, colleges & more</div>
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

        {usage && (
          <Tooltip
            text={usage.isPro ? `${usage.used} AI calls today (unlimited)` : `${usage.used}/${usage.limit} AI calls used today`}
            position="right" maxWidth={220}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, marginBottom: 10,
              background: 'color-mix(in srgb, var(--color-border) 40%, transparent)',
              fontSize: 11, fontWeight: 600,
            }}>
              <span>
                {usage.isPro
                  ? `${usage.used} AI calls today`
                  : `${usage.remaining} AI calls left today`}
              </span>
              {!usage.isPro && usage.remaining === 0 && (
                <Link
                  href="/upgrade"
                  style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  Upgrade
                </Link>
              )}
            </div>
          </Tooltip>
        )}

        {/* XP Level badge + progress */}
        {!xpLoading && (
          <Tooltip text="Earn XP by completing tasks, generating strategies, and logging in daily. Level up to track your progress." position="right" maxWidth={240}>
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
          </Tooltip>
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
          <Tooltip text="Sign out of your account." position="top">
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: '4px', borderRadius: 6, flexShrink: 0 }}
          >
            ↩
          </button>
          </Tooltip>
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
      <nav className="sidebar sidebar--desktop" aria-label="Main navigation">
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
              aria-label="Main navigation"
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
