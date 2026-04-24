import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SITE_URL as BASE_URL } from '@/lib/siteConfig'
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

function randomChars(n: number) {
  let result = ''
  for (let i = 0; i < n; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return result
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS policies allow users to read/insert their own referral rows,
  // so the authenticated client works here without needing service role.

  // Check for existing referral code
  const { data: existing, error: selectError } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', user.id)
    .maybeSingle()

  if (selectError) {
    console.error('Failed to fetch referral:', selectError)
    return NextResponse.json({ error: 'Failed to fetch referral code' }, { status: 500 })
  }

  let code: string

  if (existing) {
    code = existing.referral_code
  } else {
    // Generate a code like `sophia-x7k2`
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    const rawName = profile?.display_name || user.email?.split('@')[0] || 'user'
    const firstName = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    // Retry on uniqueness collision
    let inserted = false
    let lastError = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${firstName || 'user'}-${randomChars(4)}`
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({ referrer_id: user.id, referral_code: candidate })

      if (!insertError) {
        code = candidate
        inserted = true
        break
      } else {
        lastError = insertError
      }
    }

    if (!inserted) {
      console.error('Failed to insert referral:', lastError)
      return NextResponse.json({ error: 'Could not generate referral code', details: lastError }, { status: 500 })
    }
  }

  // Count completions for this code
  const { count } = await supabase
    .from('referral_completions')
    .select('id', { count: 'exact', head: true })
    .eq('referral_code', code!)

  return NextResponse.json({
    code: code!,
    link: `${BASE_URL}/signup?ref=${code!}`,
    completions: count ?? 0,
  })
}
