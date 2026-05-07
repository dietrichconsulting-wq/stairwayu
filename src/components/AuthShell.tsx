'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow?: string
  title: string
  subtitle: string
  children: ReactNode
}

export const authInputClassName =
  'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-teal-300 focus:bg-white/10'

export const authPrimaryButtonClassName =
  'w-full rounded-xl border-none bg-white px-4 py-3.5 text-sm font-extrabold uppercase tracking-[0.04em] text-slate-900 no-underline hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60'

export const authSecondaryButtonClassName =
  'flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white no-underline hover:bg-white/10'

export const authLabelClassName =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/50'

export function AuthAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
      : tone === 'info'
        ? 'border-teal-300/25 bg-teal-400/10 text-teal-100'
        : 'border-rose-300/25 bg-rose-400/10 text-rose-100'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClass}`}>
      {children}
    </div>
  )
}

export function AuthShell({ eyebrow = 'Stairway U', title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white">
      <div className="landing-hero-gradient absolute inset-0" aria-hidden="true" />
      <div className="landing-hero-overlay absolute inset-0" aria-hidden="true" />
      <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[1120px] flex-col justify-center gap-8 lg:grid lg:grid-cols-[1fr_440px] lg:items-center">
        <section className="hidden max-w-[560px] lg:block">
          <Link href="/" className="mb-10 inline-flex items-center">
            <Image src="/stairwayu-wordmark.png" alt="Stairway U" width={210} height={48} className="h-12 w-auto" priority />
          </Link>
          <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-teal-200/80">
            {eyebrow}
          </div>
          <h1 className="mb-5 text-[clamp(42px,5vw,72px)] font-black leading-[1.02] tracking-tight">
            Keep your college plan moving.
          </h1>
          <p className="max-w-[500px] text-lg font-semibold leading-relaxed text-white/70">
            Admission estimates, scholarships, essays, and deadlines stay connected in one private student dashboard.
          </p>
          <div className="mt-8 grid max-w-[520px] grid-cols-3 gap-2">
            {['Federal data', 'Private by default', 'Free to start'].map(item => (
              <div key={item} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-center text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/70">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px]">
          <div className="mb-7 text-center lg:hidden">
            <Link href="/" className="mb-5 inline-flex items-center justify-center">
              <Image src="/stairwayu-wordmark.png" alt="Stairway U" width={192} height={44} className="h-11 w-auto" priority />
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-slate-900/85 p-6 text-left shadow-[0_28px_90px_rgba(8,13,31,0.5)] backdrop-blur-xl sm:p-8">
            <div className="mb-7 text-center">
              <div className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-teal-300">
                {eyebrow}
              </div>
              <h2 className="text-[28px] font-black tracking-tight text-white">{title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/50">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
