import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/email/unsubscribe?token={token}
// No auth required — the token itself is the credential.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(errorPage('Missing unsubscribe token.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase
    .from('email_preferences')
    .update({ weekly_nudge: false })
    .eq('unsubscribe_token', token)
    .select('user_id')
    .single()

  if (error || !data) {
    return new NextResponse(errorPage('Invalid or expired unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(successPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}

function successPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unsubscribed — Stairway U</title>
<style>
  body { margin: 0; padding: 0; background: #121318; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #1C1D24; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; }
  h1 { color: #E8E6E3; font-size: 22px; font-weight: 800; margin: 0 0 12px; }
  p { color: #A8A29E; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
  a { color: #5EEAD4; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div class="card">
  <div style="font-size: 40px; margin-bottom: 16px;">✅</div>
  <h1>You've been unsubscribed.</h1>
  <p>You'll no longer receive weekly email updates from Stairway U.<br>You can re-enable them anytime in your <a href="https://stairwayu.com/profile">profile settings</a>.</p>
  <a href="https://stairwayu.com/dashboard">Back to Dashboard</a>
</div>
</body>
</html>`
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Error — Stairway U</title>
<style>
  body { margin: 0; padding: 0; background: #121318; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #1C1D24; border-radius: 16px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; }
  h1 { color: #E8E6E3; font-size: 22px; font-weight: 800; margin: 0 0 12px; }
  p { color: #A8A29E; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
  a { color: #5EEAD4; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
<div class="card">
  <div style="font-size: 40px; margin-bottom: 16px;">❌</div>
  <h1>Something went wrong.</h1>
  <p>${message}<br>If you need help, please contact us at <a href="mailto:support@stairwayu.com">support@stairwayu.com</a>.</p>
  <a href="https://stairwayu.com">stairwayu.com</a>
</div>
</body>
</html>`
}
