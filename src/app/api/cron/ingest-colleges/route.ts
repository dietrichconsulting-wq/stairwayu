import { NextResponse } from 'next/server'
import { ingestColleges } from '@/lib/services/collegeIngest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — Vercel cron ceiling

/**
 * Monthly cron: refresh the `colleges` table from College Scorecard.
 * Triggered by Vercel Cron (see vercel.json). Authenticated with CRON_SECRET.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  try {
    const result = await ingestColleges({ maxSeconds: 270 })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/ingest-colleges]', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    )
  }
}
