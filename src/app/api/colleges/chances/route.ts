import { NextResponse } from 'next/server'
import { computeChances } from '@/lib/services/admissionChance'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { gpa, sat, act, proposed_major, schools } = body

    if (!schools || schools.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const results = await computeChances({
      gpa,
      sat,
      act,
      proposedMajor: proposed_major,
      schools,
    })

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Chances API error:', err)
    return NextResponse.json({ error: 'Failed to compute chances' }, { status: 500 })
  }
}
