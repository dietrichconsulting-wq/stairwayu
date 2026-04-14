import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I confusion
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function GET() {
  const { user, profile } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (profile?.user_type !== 'counselor') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const sb = await createClient()
  const { data, error } = await sb
    .from('counselor_invite_codes')
    .select('*')
    .eq('counselor_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data })
}

export async function POST() {
  const { user, profile } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (profile?.user_type !== 'counselor') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const sb = await createClient()

  // Generate a unique code (retry if collision)
  let code = generateCode()
  let attempts = 0
  while (attempts < 5) {
    const { error } = await sb
      .from('counselor_invite_codes')
      .insert({ counselor_id: user.id, code })
    if (!error) break
    if (error.code === '23505') { // unique violation
      code = generateCode()
      attempts++
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ code })
}
