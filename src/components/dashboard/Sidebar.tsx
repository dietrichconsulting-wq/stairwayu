'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Profile, Subscription } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  Zap,
  SlidersHorizontal,
  BarChart3,
  Scale,
  Compass,
  PenTool,
  Trophy,
  DollarSign,
  User as UserIcon,
} from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'
import { useViewMode } from '@/hooks/useViewMode'

type NavItem = { href: string; icon: React.ReactNode; label: string; tip: string; proOnly: boolean }

// Icon map for routes
const ICON_MAP: Record<string, React.ReactNode> = {
  '/dashboard': <LayoutDashboard size={18} />,
  '/journey': <Map size={18} />,
  '/strategy': <Zap size={18} />,
  '/explore': <SlidersHorizontal size={18} />,
  '/score-bands': <BarChart3 size={18} />,
  '/compare': <Scale size={18} />,
  '/find-major': <Compass size={18} />,
  '/essays': <PenTool size={18} />,
  '/scholarships': <Trophy size={18} />,
  '/finance': <DollarSign size={18} />,
  '/profile': <UserIcon size={18} />,
}

// Single source of truth for nav metadata, keyed by href
const NAV_META: Record<string, NavItem> = {
  '/dashboard':    { href: '/dashboard',    icon: ICON_MAP['/dashboard'],    label: 'Snapshot',        tip: 'Your snapshot — admission chances, stats, and next steps at a glance.', proOnly: false },
  '/journey':      { href: '/journey',      icon: ICON_MAP['/journey'],      label: 'Your Journey',    tip: 'Step-by-step milestones from freshman year through submission.', proOnly: false },
  '/strategy':     { href: '/strategy',     icon: ICON_MAP['/strategy'],     label: 'Strategy',        tip: 'AI-powered reach/target/safety strategy. Pro feature — uses AI calls.', proOnly: true },
  '/explore':      { href: '/explore',      icon: ICON_MAP['/explore'],      label: 'Explore',         tip: 'Slide your stats and discover matching schools instantly.', proOnly: false },
  '/score-bands':  { href: '/score-bands',  icon: ICON_MAP['/score-bands'],  label: 'Score Bands',     tip: 'Browse schools grouped by your admission chance tier.', proOnly: false },
  '/compare':      { href: '/compare',      icon: ICON_MAP['/compare'],      label: 'Compare',         tip: 'Side-by-side comparison of your saved schools. Pro feature.', proOnly: true },
  '/find-major':   { href: '/find-major',   icon: ICON_MAP['/find-major'],   label: 'Find Your Major', tip: 'Explore majors that match your interests and strengths.', proOnly: false },
  '/essays':       { href: '/essays',       icon: ICON_MAP['/essays'],       label: 'Essays',          tip: 'AI essay coaching — brainstorm + critique. Pro feature — uses AI calls.', proOnly: true },
  '/scholarships': { href: '/scholarships', icon: ICON_MAP['/scholarships'], label: 'Scholarships',    tip: 'Discover scholarships matched to your profile. Unlimited with Pro.', proOnly: true },
  '/finance':      { href: '/finance',      icon: ICON_MAP['/finance'],      label: 'College Cost',    tip: 'Plan how to pay for college — aid, loans, and family contribution.', proOnly: false },
  '/profile':      { href: '/profile',      icon: ICON_MAP['/profile'],      label: 'Profile',         tip: 'Edit your academic stats, preferences, and account settings.', proOnly: false },
}

// Single nav structure with grouping
interface NavGroup {
  label?: string
  items: string[]
}

// Dashboard is pinned at top; Journey + Profile are in the trailing group
const NAV_STUDENT: NavGroup[] = [
  { label: undefined,   items: ['/dashboard'] },
  { label: 'DISCOVER', items: ['/explore', '/score-bands', '/find-major'] },
  { label: 'APPLY',    items: ['/essays', '/strategy', '/compare'] },
  { label: 'PLAN',     items: ['/finance', '/scholarships'] },
  { label: undefined,   items: ['/journey', '/profile'] },
]

const NAV_MOM: NavGroup[] = [
  { label: undefined,   items: ['/dashboard'] },
  { label: 'PLAN',     items: ['/finance', '/scholarships'] },
  { label: 'APPLY',    items: ['/essays', '/strategy', '/compare'] },
  { label: 'DISCOVER', items: ['/explore', '/score-bands', '/find-major'] },
  { label: undefined,   items: ['/journey', '/profile'] },
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [viewMode, setViewMode] = useViewMode()
  const NAV_STRUCTURE = viewMode === 'mom' ? NAV_MOM : NAV_STUDENT

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

  const navContent = (
    <>
      <div className="sidebar__brand" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 48, width: 'auto', display: 'block' }} />
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
        {NAV_STRUCTURE.map((group, groupIdx) => (
          <div key={groupIdx}>
            {/* Section header (if label exists) */}
            {group.label && (
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.05em',
                color: 'var(--color-text-muted)',
                padding: '12px 20px 8px 20px',
                textTransform: 'uppercase',
              }}>
                {group.label}
              </div>
            )}

            {/* Nav items in this group */}
            {group.items.map(href => {
              const item = NAV_META[href]
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
                  <Link
                    href={item.href}
                    className={`sidebar__nav-item ${active ? 'sidebar__nav-item--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    data-tour={tourAttr[item.href]}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active-bg"
                        className="sidebar__nav-item-bg"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}
                    <span style={{ position: 'relative' }}>{item.icon}</span>
                    <span style={{ position: 'relative', flex: 1 }}>{item.label}</span>
                  </Link>
                </Tooltip>
              )
            })}
          </div>
        ))}

        {/* Admin-only nav link */}
        {profile?.account_tier === 'admin' && (
          <>
            <div style={{
              height: 1,
              background: 'var(--color-border)',
              margin: '12px 20px',
            }} />
            <Link
              href="/admin"
              className={`sidebar__nav-item ${pathname === '/admin' ? 'sidebar__nav-item--active' : ''}`}
              aria-current={pathname === '/admin' ? 'page' : undefined}
            >
              {pathname === '/admin' && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="sidebar__nav-item-bg"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <span style={{ position: 'relative' }}>⚙️</span>
              <span style={{ position: 'relative', flex: 1 }}>Admin</span>
            </Link>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
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

        {/* View mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {viewMode === 'mom' ? 'Parent View' : 'Student View'}
          </span>
          <div
            role="tablist"
            aria-label="View mode"
            style={{
              display: 'inline-flex',
              padding: 2,
              borderRadius: 99,
              background: 'var(--color-column)',
              border: '1px solid var(--color-border)',
              gap: 2,
            }}
          >
            {([
              { key: 'student' as const, icon: '\uD83C\uDF93', tip: 'Student View' },
              { key: 'mom' as const, icon: '\uD83D\uDC6A', tip: 'Parent View' },
            ]).map(opt => {
              const active = viewMode === opt.key
              return (
                <Tooltip key={opt.key} text={opt.tip} position="top">
                  <button
                    role="tab"
                    aria-selected={active}
                    onClick={() => setViewMode(opt.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: 99, border: 'none',
                      background: active ? 'var(--color-primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--color-text-muted)',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.icon}
                  </button>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Upgrade surface */}
        {subscription?.tier !== 'pro' && (
          <Link
            href="/upgrade"
            style={{
              display: 'block',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border))',
              background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-card))',
              color: 'var(--color-text)',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Unlock Pro
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.35 }}>
              AI strategy, essays, comparisons, and unlimited scholarships.
            </div>
          </Link>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="mobile-topbar__hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
        <span className="mobile-topbar__brand" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 28, width: 'auto' }} />
        </span>
        <div style={{ width: 32 }} />
      </div>

      {/* Desktop sidebar (always visible >= 768px) */}
      <nav className="sidebar sidebar--desktop" aria-label="Main navigation">
        {navContent}
      </nav>

      {/* Mobile drawer + overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
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
