// Supabase Edge Function: weekly-nudge
// Runs every Monday at 9:00 AM Central (15:00 UTC)
// Sends personalized weekly email nudges via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'
const DASHBOARD_URL = 'https://www.stairwayu.com/dashboard'
const UNSUBSCRIBE_BASE = 'https://www.stairwayu.com/api/email/unsubscribe'
const BATCH_SIZE = 50

Deno.serve(async (req: Request) => {
  // Allow both scheduled invocations and manual HTTP triggers (with service role bearer token)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'Stairway U <nudge@stairwayu.com>'

  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set')
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const sevenDaysOut = new Date(today)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)
  const sevenDaysOutStr = sevenDaysOut.toISOString().split('T')[0]

  const fourteenDaysOut = new Date(today)
  fourteenDaysOut.setDate(fourteenDaysOut.getDate() + 14)
  const fourteenDaysOutStr = fourteenDaysOut.toISOString().split('T')[0]

  const sixDaysAgo = new Date(today)
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6)

  let sent = 0
  let skipped = 0
  let errors = 0
  let offset = 0

  // Process in batches to handle scale
  while (true) {
    const { data: prefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('user_id, unsubscribe_token, last_nudge_sent')
      .eq('weekly_nudge', true)
      .or(`last_nudge_sent.is.null,last_nudge_sent.lt.${sixDaysAgo.toISOString()}`)
      .range(offset, offset + BATCH_SIZE - 1)

    if (prefsError) {
      console.error('Error fetching email_preferences:', prefsError)
      break
    }
    if (!prefs || prefs.length === 0) break

    for (const pref of prefs) {
      try {
        const userId = pref.user_id

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', userId)
          .single()

        // Fetch user email via admin API
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        if (authError || !authUser?.user?.email) {
          console.warn(`No email for user ${userId}:`, authError?.message)
          skipped++
          continue
        }
        const email = authUser.user.email
        const displayName = profile?.display_name ?? email.split('@')[0]

        // Overdue tasks (due_date < today, not Done)
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('title, due_date')
          .eq('user_id', userId)
          .lt('due_date', todayStr)
          .neq('status', 'Done')
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true })

        // Tasks due in next 7 days
        const { data: upcomingTasks } = await supabase
          .from('tasks')
          .select('title, due_date')
          .eq('user_id', userId)
          .gte('due_date', todayStr)
          .lte('due_date', sevenDaysOutStr)
          .neq('status', 'Done')
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true })

        // Total incomplete task count
        const { count: incompleteCount } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'Done')

        // Total task count
        const { count: totalCount } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)

        const completedCount = (totalCount ?? 0) - (incompleteCount ?? 0)

        // Scholarship deadlines in next 14 days
        const { data: upcomingScholarships } = await supabase
          .from('scholarships')
          .select('name, deadline')
          .eq('user_id', userId)
          .gte('deadline', todayStr)
          .lte('deadline', fourteenDaysOutStr)
          .not('stage', 'in', '("Submitted","Won")')
          .not('deadline', 'is', null)
          .order('deadline', { ascending: true })

        // Subscription info
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, trial_end')
          .eq('user_id', userId)
          .single()

        let trialDaysLeft: number | null = null
        if (subscription?.status === 'trialing' && subscription.trial_end) {
          const trialEnd = new Date(subscription.trial_end)
          const msLeft = trialEnd.getTime() - Date.now()
          trialDaysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
          if (trialDaysLeft > 3) trialDaysLeft = null // Only show when ≤ 3 days
        }

        // Skip users with nothing actionable
        const hasContent =
          (overdueTasks && overdueTasks.length > 0) ||
          (upcomingTasks && upcomingTasks.length > 0) ||
          (upcomingScholarships && upcomingScholarships.length > 0) ||
          trialDaysLeft !== null

        if (!hasContent) {
          console.log(`Skipping ${userId} — no actionable content`)
          skipped++
          continue
        }

        // Build email HTML
        const html = buildEmailHtml({
          displayName,
          overdueTasks: overdueTasks ?? [],
          upcomingTasks: upcomingTasks ?? [],
          upcomingScholarships: upcomingScholarships ?? [],
          completedCount,
          totalCount: totalCount ?? 0,
          trialDaysLeft,
          unsubscribeToken: pref.unsubscribe_token,
        })

        // Send via Resend
        const resendRes = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: `Your college plan for this week, ${displayName} 📋`,
            html,
          }),
        })

        if (!resendRes.ok) {
          const body = await resendRes.text()
          console.error(`Resend error for ${userId}:`, resendRes.status, body)
          errors++
          continue
        }

        // Update last_nudge_sent
        await supabase
          .from('email_preferences')
          .update({ last_nudge_sent: new Date().toISOString() })
          .eq('user_id', userId)

        console.log(`Sent to ${userId} (${email})`)
        sent++
      } catch (err) {
        console.error(`Unexpected error for user ${pref.user_id}:`, err)
        errors++
      }
    }

    if (prefs.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  const summary = { sent, skipped, errors }
  console.log('Weekly nudge complete:', summary)
  return new Response(JSON.stringify(summary), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─── Email Template ──────────────────────────────────────────────────────────

interface Task { title: string; due_date: string }
interface ScholarshipItem { name: string; deadline: string }

function buildEmailHtml(opts: {
  displayName: string
  overdueTasks: Task[]
  upcomingTasks: Task[]
  upcomingScholarships: ScholarshipItem[]
  completedCount: number
  totalCount: number
  trialDaysLeft: number | null
  unsubscribeToken: string
}): string {
  const {
    displayName, overdueTasks, upcomingTasks, upcomingScholarships,
    completedCount, totalCount, trialDaysLeft, unsubscribeToken,
  } = opts

  const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${unsubscribeToken}`
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const barFilled = Math.round(progressPct / 5) // out of 20 blocks
  const progressBar = '█'.repeat(barFilled) + '░'.repeat(20 - barFilled)

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00Z')
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  function daysUntil(dateStr: string): number {
    const d = new Date(dateStr + 'T12:00:00Z')
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  function daysOverdue(dateStr: string): number {
    const d = new Date(dateStr + 'T12:00:00Z')
    return Math.ceil((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  }

  const overdueHtml = overdueTasks.length > 0 ? `
    <tr><td style="padding: 0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 4px solid #DC2626; padding-left: 16px;">
        <tr><td style="padding-bottom: 10px;">
          <span style="font-size: 14px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em;">
            🔴 Overdue
          </span>
        </td></tr>
        ${overdueTasks.map(t => `
          <tr><td style="padding: 4px 0;">
            <span style="font-size: 14px; color: #1e293b;">${escapeHtml(t.title)}</span>
            <span style="font-size: 12px; color: #DC2626; margin-left: 8px;">${daysOverdue(t.due_date)} day${daysOverdue(t.due_date) === 1 ? '' : 's'} overdue</span>
          </td></tr>
        `).join('')}
      </table>
    </td></tr>
  ` : ''

  const upcomingHtml = upcomingTasks.length > 0 ? `
    <tr><td style="padding: 0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 4px solid #2563EB; padding-left: 16px;">
        <tr><td style="padding-bottom: 10px;">
          <span style="font-size: 14px; font-weight: 700; color: #2563EB; text-transform: uppercase; letter-spacing: 0.05em;">
            📋 Due This Week
          </span>
        </td></tr>
        ${upcomingTasks.map(t => `
          <tr><td style="padding: 4px 0;">
            <span style="font-size: 14px; color: #1e293b;">${escapeHtml(t.title)}</span>
            <span style="font-size: 12px; color: #64748b; margin-left: 8px;">${formatDate(t.due_date)}</span>
          </td></tr>
        `).join('')}
      </table>
    </td></tr>
  ` : ''

  const scholarshipsHtml = upcomingScholarships.length > 0 ? `
    <tr><td style="padding: 0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left: 4px solid #D97706; padding-left: 16px;">
        <tr><td style="padding-bottom: 10px;">
          <span style="font-size: 14px; font-weight: 700; color: #D97706; text-transform: uppercase; letter-spacing: 0.05em;">
            🏆 Scholarship Deadlines
          </span>
        </td></tr>
        ${upcomingScholarships.map(s => `
          <tr><td style="padding: 4px 0;">
            <span style="font-size: 14px; color: #1e293b;">${escapeHtml(s.name)}</span>
            <span style="font-size: 12px; color: #64748b; margin-left: 8px;">${formatDate(s.deadline)} · ${daysUntil(s.deadline)} days left</span>
          </td></tr>
        `).join('')}
      </table>
    </td></tr>
  ` : ''

  const trialHtml = trialDaysLeft !== null ? `
    <tr><td style="padding: 0 0 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FEF3C7; border-radius: 8px; padding: 14px 16px;">
        <tr><td>
          <span style="font-size: 14px; font-weight: 700; color: #92400E;">⏳ Trial Ending Soon</span><br>
          <span style="font-size: 13px; color: #78350F;">Your free trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}. Subscribe to keep access to all your tools.</span>
        </td></tr>
      </table>
    </td></tr>
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your week ahead — Stairway U</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 16px;">
<tr><td align="center">

  <!-- Email wrapper -->
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

    <!-- Header -->
    <tr><td style="background-color: #0f172a; border-radius: 12px 12px 0 0; padding: 28px 32px;">
      <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Stairway U</span>
      <span style="font-size: 13px; color: #94a3b8; margin-left: 10px;">Weekly Update</span>
    </td></tr>

    <!-- Body -->
    <tr><td style="background-color: #ffffff; padding: 32px;">

      <!-- Greeting -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding-bottom: 24px;">
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">
            Hey ${escapeHtml(displayName)}, here's your week ahead.
          </p>
        </td></tr>

        ${overdueHtml}
        ${upcomingHtml}
        ${scholarshipsHtml}
        ${trialHtml}

        <!-- Progress snapshot -->
        <tr><td style="padding: 0 0 28px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Progress</p>
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #1e293b; font-weight: 600;">
            ${completedCount} of ${totalCount} tasks completed (${progressPct}%)
          </p>
          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #2563EB; letter-spacing: -1px;">
            ${progressBar}
          </p>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding-bottom: 8px;" align="center">
          <a href="${DASHBOARD_URL}"
             style="display: inline-block; background-color: #2563EB; color: #ffffff; text-decoration: none;
                    font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.02em;">
            Open Your Dashboard →
          </a>
        </td></tr>

      </table>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background-color: #f8fafc; border-radius: 0 0 12px 12px; padding: 20px 32px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; text-align: center;">
        You're receiving this because you signed up for Stairway U.
      </p>
      <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; text-align: center;">
        Stairway U · 123 College Ave · Austin, TX 78701
      </p>
      <p style="margin: 0; font-size: 11px; text-align: center;">
        <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe from weekly emails</a>
      </p>
    </td></tr>

  </table>
</td></tr>
</table>

</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
