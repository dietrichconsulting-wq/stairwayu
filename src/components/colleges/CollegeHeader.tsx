import Link from 'next/link'

export function CollegeHeader() {
  return (
    <header className="border-b border-white/5 bg-[#0c0e14]/80 backdrop-blur supports-[backdrop-filter]:bg-[#0c0e14]/60 sticky top-0 z-30">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stairwayu-wordmark.png" alt="Stairway U" className="h-8 w-auto" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/colleges"
            className="hidden sm:inline text-sm font-medium text-white/60 hover:text-white"
          >
            Browse Colleges
          </Link>
          <Link
            href="/login"
            className="hidden sm:inline text-sm font-medium text-white/60 hover:text-white"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-white/90"
          >
            Start Free
          </Link>
        </nav>
      </div>
    </header>
  )
}
