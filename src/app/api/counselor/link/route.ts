import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { user, profile } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (profile?.user_type !== 'student') return NextResponse.json({ error: 'Only students can link to a counselor' }, { status: 403 })

  const body = await req.json()
  const code = (body.code as string)?.trim()?.toUpperCase()
  if (!code) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 })

  // Use service client to look up and update invite code (bypasses RLS for atomic operation)
  const sbService = await createServiceClient()

  // Look up the invite code
  const { data: invite, error: lookupErr } = await sbService
    .from('counselor_invite_codes')
    .select('id, counselor_id, max_uses, use_count, active')
    .eq('code', code)
    .single()

  if (lookupErr || !invite) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
  if (!invite.active) return NextResponse.json({ error: 'This invite code is no longer active' }, { status: 400 })
  if (invite.use_count >= invite.max_uses) return NextResponse.json({ error: 'This invite code has reached its limit' }, { status: 400 })

  // Link student to counselor
  const sb = await createClient()
  const { error: linkErr } = await sb
    .from('counselor_students')
    .insert({
      counselor_id: invite.counselor_id,
      student_id: user.id,
      invite_code_id: invite.id,
    })

  if (linkErr) {
    if (linkErr.code === '23505') return NextResponse.json({ error: 'You are already linked to this counselor' }, { status: 409 })
    return NextResponse.json({ error: linkErr.message }, { status: 500 })
  }

  // Increment use_count
  await sbService
    .from('counselor_invite_codes')
    .update({ use_count: invite.use_count + 1 })
    .eq('id', invite.id)

  return NextResponse.json({ success: true, counselor_id: invite.counselor_id })
}

export async function DELETE() {
  const { user, profile } = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (profile?.user_type !== 'student') return NextResponse.json({ error: 'Only students can unlink' }, { status: 403 })

  const sb = await createClient()
  const { error } = await sb
    .from('counselor_students')
    .delete()
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
