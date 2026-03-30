import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Shared primitives ──────────────────────────────────────────────────

const gpa = z.number().min(0).max(5.0).nullish()
const sat = z.number().int().min(400).max(1600).nullish()
const act = z.number().int().min(1).max(36).nullish()
const shortStr = z.string().max(200)
const medStr = z.string().max(2000)

// ── Colleges ───────────────────────────────────────────────────────────

const ecEntry = z.object({
  name: z.string().min(1).max(200),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

export const chancesSchema = z.object({
  gpa,
  gpa_weighted: gpa,
  sat,
  act,
  proposed_major: shortStr.nullish(),
  ec_entries: z.array(ecEntry).max(20).nullish(),
  schools: z.array(z.object({
    name: z.string().min(1).max(200),
    id: z.string().max(50).nullish(),
  })).max(50).default([]),
})

export const compareSchema = z.object({
  schools: z.array(z.string().min(1).max(200)).min(1).max(20),
  major: shortStr.nullish(),
  gpa,
  gpa_weighted: gpa,
  sat,
  homeState: z.string().max(50).nullish(),
})

export const exploreSchema = z.object({
  satMin: z.coerce.number().int().min(400).max(1600).optional(),
  satMax: z.coerce.number().int().min(400).max(1600).optional(),
  regions: z.string().max(100).optional(),
  page: z.coerce.number().int().min(0).default(0),
  perPage: z.coerce.number().int().min(1).max(60).default(30),
  sort: z.enum(['net_cost', 'grad_rate', 'earnings', 'sat']).default('sat'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})

export const searchSchema = z.object({
  q: z.string().min(2).max(200),
})

// ── Essays ─────────────────────────────────────────────────────────────

export const brainstormSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('questions'),
    school: shortStr,
    essayType: shortStr,
    major: shortStr.nullish(),
    gpa,
    gpa_weighted: gpa,
    sat,
  }),
  z.object({
    action: z.literal('prompts'),
    school: shortStr,
    essayType: shortStr,
    major: shortStr.nullish(),
    gpa,
    gpa_weighted: gpa,
    sat,
    answers: z.record(z.string().max(500), z.string().max(2000)),
  }),
])

export const critiqueSchema = z.object({
  school: shortStr,
  essayType: shortStr,
  major: shortStr.nullish(),
  gpa,
  gpa_weighted: gpa,
  sat,
  draft: z.string().min(50).max(20_000),
})

// ── Stripe / Redeem / Referral ─────────────────────────────────────────

export const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'annual']).default('monthly'),
})

export const redeemSchema = z.object({
  code: z.string().min(1).max(100),
})

export const referralFulfillSchema = z.object({
  code: z.string().max(100).optional(),
})

// ── Strategy / Scholarships ────────────────────────────────────────────

export const strategySchema = z.object({
  gpa,
  gpaWeighted: gpa,
  sat,
  act,
  major: shortStr.nullish(),
  budget: z.number().min(0).max(500_000).nullish(),
  climate: z.union([z.array(shortStr), shortStr]).nullish(),
  schools: z.array(z.string().max(200)).max(50).nullish(),
})

export const scholarshipsSchema = z.object({
  gpa,
  gpa_weighted: gpa,
  sat,
  act,
  major: shortStr.nullish(),
  homeState: z.string().max(50).nullish(),
  gradYear: z.number().int().min(2020).max(2040).nullish(),
  extracurriculars: medStr.nullish(),
  careerInterests: medStr.nullish(),
  background: medStr.nullish(),
  circumstances: medStr.nullish(),
})

// ── Helper ─────────────────────────────────────────────────────────────

/** Parse body with a zod schema; returns 400 Response on failure, parsed data on success */
export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown,
): { data: z.infer<T> } | { error: Response } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    }
  }
  return { data: result.data }
}
