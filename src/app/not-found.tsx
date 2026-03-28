import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base-100 px-6 text-center">
      <p className="text-8xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-base text-base-content/60">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="btn btn-primary"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="btn btn-ghost"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
