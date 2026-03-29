import { NextResponse } from 'next/server'
import { computeChances } from '@/lib/services/admissionChance'
import { chancesSchema, parseBody } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const raw = await req.json()
    const parsed = parseBody(chancesSchema, raw)
    if ('error' in parsed) return parsed.error
    const { gpa, gpa_weighted, sat, act, proposed_major, ec_entries, schools } = parsed.data

    if (schools.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const results = await computeChances({
      gpa,
      gpa_weighted,
      sat,
      act,
      proposedMajor: proposed_major,
      ecEntries: ec_entries,
      schools,
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Chances API error:', err)
    return NextResponse.json({ error: 'Failed to compute chances' }, { status: 500 })
  }
}
