import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { cache } from 'react'

const cookieConfig = async () => {
  const cookieStore = await cookies()
  return {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        } catch {}
      },
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<any> {
  const config = await cookieConfig()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    config
  )
}

/**
 * Request-scoped cached auth lookup.
 * React's cache() deduplicates calls within a single server request,
 * so layout + page can both call getAuthUser() without duplicate DB hits.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null, subscription: null }

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('tier, status, trial_end, billing_interval').eq('user_id', user.id).single(),
  ])

  return { user, profile, subscription }
})

// Service-role client that truly bypasses RLS.
// Uses @supabase/supabase-js directly (no cookie auth) so the service_role key
// is used for both apikey and Authorization headers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createServiceClient(): Promise<any> {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
    { auth: { persistSession: false } }
  )
}
