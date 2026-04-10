import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/pledge — create a gift pledge (no auth required).
 * Body: { token, name, email?, relation?, amount, message? }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.name || !body?.amount) {
    return NextResponse.json({ error: 'token, name, and amount required' }, { status: 400 })
  }

  const amount = Math.max(1, Math.min(100000, Math.round(Number(body.amount))))
  if (isNaN(amount)) {
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
  }

  const sb = await createServiceClient()

  // Look up share link.
  const { data: link } = await sb
    .from('share_links')
    .select('id, user_id, active')
    .eq('token', body.token)
    .eq('active', true)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'share link not found' }, { status: 404 })
  }

  const { data: pledge, error } = await sb
    .from('gift_pledges')
    .insert({
      share_link_id: link.id,
      user_id: link.user_id,
      pledger_name: String(body.name).slice(0, 100),
      pledger_email: body.email ? String(body.email).slice(0, 200) : null,
      pledger_relation: body.relation ? String(body.relation).slice(0, 60) : null,
      amount,
      message: body.message ? String(body.message).slice(0, 500) : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pledge })
}
