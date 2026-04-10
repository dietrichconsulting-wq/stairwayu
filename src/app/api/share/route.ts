import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/** Generate a 12-char URL-safe token. */
function genToken() {
  return crypto.randomBytes(9).toString('base64url') // 12 chars
}

/**
 * POST /api/share — create (or return existing) share link for the authed user.
 * Body (optional): { label?: string }
 */
export async function POST(req: Request) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const label = body.label?.slice(0, 60) || null

  // If they already have an active link, return it.
  const { data: existing } = await sb
    .from('share_links')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ link: existing })
  }

  // Create a new one.
  let token = genToken()
  // Extremely unlikely collision, but handle it.
  for (let i = 0; i < 3; i++) {
    const { data, error } = await sb
      .from('share_links')
      .insert({ user_id: user.id, token, label })
      .select()
      .single()
    if (!error) return NextResponse.json({ link: data })
    if (error.code === '23505') { token = genToken(); continue }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ error: 'token collision' }, { status: 500 })
}

/**
 * GET /api/share — get current user's active share link.
 */
export async function GET() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data } = await sb
    .from('share_links')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ link: data })
}

/**
 * DELETE /api/share — deactivate all share links for the user.
 */
export async function DELETE() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await sb
    .from('share_links')
    .update({ active: false })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
