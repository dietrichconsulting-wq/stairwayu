import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'email' | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Determine the correct redirect base URL.
  // On Vercel, x-forwarded-host contains the real domain (e.g. www.stairwayu.com)
  // while origin may be the internal deployment URL.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  let redirectBase = origin
  if (!isLocalEnv && forwardedHost) {
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    redirectBase = `${proto}://${forwardedHost}`
  }

  // Handle token_hash flow (email OTP / PKCE token verification)
  // This uses cookies() since it doesn't involve OAuth code exchange
  if (token_hash && type) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
              )
            } catch {
              // Ignored — proxy.ts handles session refresh
            }
          },
        },
      }
    )

    // For password recovery, sign out any existing session first so the
    // recovery token creates a fresh session for the correct user
    if (type === 'recovery') {
      await supabase.auth.signOut()
    }
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${redirectBase}/reset-password`)
      }
      return NextResponse.redirect(`${redirectBase}${next}`)
    }
  }

  // Handle code exchange flow (OAuth / magic link / password recovery)
  // IMPORTANT: Set cookies directly on the redirect response so they survive
  // the redirect. Using cookies() can lose Set-Cookie headers on redirects.
  if (code) {
    const redirectUrl = `${redirectBase}${next}`
    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // If this is a recovery flow, sign out existing session first
    // so the new session belongs to the correct user
    if (next === '/reset-password') {
      await supabase.auth.signOut()
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }

    // Code exchange failed — redirect to login with error
    const errorMsg = encodeURIComponent(error.message || 'Could not sign in. Please try again.')
    return NextResponse.redirect(`${redirectBase}/login?error=${errorMsg}`)
  }

  return NextResponse.redirect(`${redirectBase}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
}
