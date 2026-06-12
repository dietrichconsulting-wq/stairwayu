# Cost Reduction Plan

Goal: cut fixed monthly hosting costs (primarily Supabase ~$40/mo) without
losing anything users notice. Written June 2026.

## Current spend & targets

| Service  | Today        | Target | How |
|----------|--------------|--------|-----|
| Supabase | ~$40/mo      | $0     | Downgrade to Free tier (checklist below) |
| Vercel   | $0 or $20/mo | keep   | Cron moved to GitHub Actions removes the 5-min ceiling as a Pro reason |
| Gemini   | ~$1–5/mo     | ~same  | Optional: `gemini-2.5-flash-lite` for brainstorm/scholarship prompts |
| Upstash / Sentry / Resend / Scorecard | $0 | $0 | Already inside free tiers |

Nothing in the codebase requires Supabase Pro: we use Postgres, Auth, RLS,
one DB trigger, and one weekly edge function — all available on Free
(500 MB database, 50K MAU, 500K edge invocations, pg_cron).

## Supabase Pro → Free checklist

Do these **in order, before** clicking downgrade.

### 0. (Maybe stop here) Check for a compute add-on

Dashboard → Project Settings → Compute and Disk. Pro is $25/mo; if the bill
is ~$40 there's likely a **Small** compute instance (+$15). Our workload
(light OLTP, no heavy queries) runs fine on **Micro**, which is fully covered
by Pro's included $10 compute credit. If you want to keep Pro for daily
backups + support, dropping to Micro alone saves $15/mo.

### 1. Verify usage fits Free limits

Dashboard → Reports / Database:
- [ ] Database size < 500 MB (expected: well under — the `colleges` +
      `college_programs` tables are the bulk and total a few tens of MB)
- [ ] Egress < 5 GB/mo
- [ ] Monthly active auth users < 50,000

### 2. Replace auth email delivery (critical — do first)

Free tier's built-in SMTP is throttled to ~2 auth emails/hour, which silently
breaks signup confirmations and password resets.

- [ ] In Resend (already used for weekly-nudge): verify the stairwayu.com
      domain, create an SMTP credential
- [ ] Supabase Dashboard → Authentication → Emails → SMTP Settings:
      host `smtp.resend.com`, port 465, user `resend`, password = API key,
      sender `noreply@stairwayu.com`
- [ ] Send a test password-reset email and confirm delivery
- Resend free tier = 3,000 emails/mo; weekly nudges + auth emails fit easily.

### 3. Replace daily backups

- [ ] Add repo secret `SUPABASE_DB_URL` = **Session pooler** connection
      string (Dashboard → Connect → Session pooler, port 5432). Must be the
      pooler URI — the direct `db.<ref>.supabase.co` host is IPv6-only and
      GitHub runners have no IPv6.
- [ ] Enable `.github/workflows/backup-supabase.yml` (nightly pg_dump →
      Actions artifact, 14-day retention)
- [ ] Run it once manually (Actions → "Nightly Supabase backup" → Run
      workflow) and download the artifact
- [ ] Test a restore locally:
      `pg_restore --list stairwayu-<date>.dump | head` (sanity) or restore
      into a scratch database
- Free tier has **no point-in-time recovery**; nightly granularity means up
  to 24h of data loss in the worst case. Acceptable at current scale —
  revisit when revenue makes Pro a rounding error.

### 4. Pause prevention

Free projects pause after ~7 days of inactivity. With real user traffic this
never triggers, and the nightly backup connection guarantees daily activity
regardless. Nothing to do.

### 5. Downgrade

- [ ] Dashboard → Settings → Billing → change plan to Free
- [ ] Immediately verify: login works, signup confirmation email arrives,
      Stripe webhook writes a row (Stripe Dashboard → resend a test event),
      weekly-nudge edge function still scheduled (it is unaffected)

### What we give up (accepted)

- Daily managed backups + PITR → replaced by nightly pg_dump
- Email support → community support
- 8 GB database / 100 GB egress headroom → far above our usage anyway
- Log retention drops to 1 day → Sentry covers app errors

## Vercel notes

- The monthly college ingest now runs in GitHub Actions
  (`.github/workflows/ingest-colleges.yml`), not Vercel Cron. The
  `/api/cron/ingest-colleges` route is kept for manual triggers but is no
  longer scheduled.
- If on Hobby: be aware Hobby's terms prohibit commercial use (the app takes
  payments). Pro at $20/mo is the honest floor on Vercel; the cheap
  alternative is Cloudflare Workers via OpenNext (~$5/mo) but that's a real
  migration — not recommended yet.

## Gemini notes (optional, small)

All four AI features use `gemini-2.5-flash`. Brainstorm
(`src/app/api/essays/brainstorm/route.ts`) and scholarship finder
(`src/lib/services/scholarshipFinder.ts`) would work fine on
`gemini-2.5-flash-lite` at roughly a quarter of the cost. Keep full Flash
for essay critique and strategy where output quality is most visible.
