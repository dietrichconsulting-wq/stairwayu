import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.stairwayu.com'
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

  // Check for existing referral code
  const { data: existing } = await supabase
    .from('referrals')
    .select('referral_code')
    .eq('referrer_id', user.id)
    .single()

  let code: string

  if (existing) {
    code = existing.referral_code
  } else {
    // Generate a code like `sophia-x7k2`
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()

    const rawName = profile?.display_name || user.email?.split('@')[0] || 'user'
    const firstName = rawName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    // Retry on uniqueness collision
    let inserted = false
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${firstName}-${randomChars(4)}`
      const { error: insertError } = await supabase
        .from('referrals')
        .insert({ referrer_id: user.id, referral_code: candidate })

      if (!insertError) {
        code = candidate
        inserted = true
        break
      }
    }

    if (!inserted) {
      return NextResponse.json({ error: 'Could not generate referral code' }, { status: 500 })
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
