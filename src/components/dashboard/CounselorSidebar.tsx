'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Profile } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Link2, User as UserIcon } from 'lucide-react'
import { Tooltip } from '@/components/ui/Tooltip'

type NavItem = { href: string; icon: React.ReactNode; label: string; tip: string }

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview', tip: 'Student overview — linked students and key stats.' },
  { href: '/students', icon: <Users size={18} />, label: 'Students', tip: 'View all linked students, their profiles, and college lists.' },
  { href: '/invite', icon: <Link2 size={18} />, label: 'Invite', tip: 'Generate invite codes to link students to your account.' },
  { href: '/profile', icon: <UserIcon size={18} />, label: 'Profile', tip: 'Edit your profile and account settings.' },
]

interface CounselorSidebarProps {
  user: User
  profile: Profile | null
}

export function CounselorSidebar({ user, profile }: CounselorSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setMobileOpen(false) }
    if (mobileOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [mobileOpen])

  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const drawerRef = useRef<HTMLElement>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchCurrentX.current = e.touches[0].clientX }, [])
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX
    const delta = touchCurrentX.current - touchStartX.current
    if (delta < 0 && drawerRef.current) { drawerRef.current.style.transform = `translateX(${delta}px)`; drawerRef.current.style.transition = 'none' }
  }, [])
  const handleTouchEnd = useCallback(() => {
    const delta = touchCurrentX.current - touchStartX.current
    if (drawerRef.current) { drawerRef.current.style.transform = ''; drawerRef.current.style.transition = '' }
    if (delta < -80) setMobileOpen(false)
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
        <button className="sidebar__close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">✕</button>
      </div>

      <div className="sidebar__nav">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Tooltip key={item.href} text={item.tip} position="right" delay={500}>
              <Link
                href={item.href}
                className={`sidebar__nav-item ${active ? 'sidebar__nav-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
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

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
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
            <button onClick={handleSignOut} aria-label="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-text-muted)', padding: '4px', borderRadius: 6, flexShrink: 0 }}>
              ↩
            </button>
          </Tooltip>
        </div>

        <div style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--color-primary)', background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          padding: '4px 10px', borderRadius: 6, textAlign: 'center',
        }}>
          Counselor
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="mobile-topbar__hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
        <img src="/stairwayu-wordmark.png" alt="Stairway U" style={{ height: 28 }} />
      </div>

      {/* Desktop sidebar */}
      <aside className="sidebar">{navContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <aside
        ref={drawerRef}
        className={`sidebar sidebar--mobile ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {navContent}
      </aside>
    </>
  )
}
