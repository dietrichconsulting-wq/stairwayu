import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <p
        className="text-7xl sm:text-8xl font-extrabold tracking-tight"
        style={{ color: 'var(--color-primary)' }}
      >
        404
      </p>
      <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text)]">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm sm:text-base text-[var(--color-text-muted)]">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Try exploring colleges or heading to your dashboard.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white no-underline"
        >
          Your Dashboard
        </Link>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] no-underline"
        >
          Explore Colleges
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-[var(--color-text-muted)] no-underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
