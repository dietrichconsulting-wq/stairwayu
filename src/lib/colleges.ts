import { createClient } from '@/lib/supabase/server'

export interface College {
  ipeds_id: string
  slug: string
  name: string
  city: string | null
  state: string | null
  url: string | null
  control: string | null
  is_public: boolean | null
  admission_rate: number | null
  avg_sat: number | null
  sat_25: number | null
  sat_75: number | null
  act_midpoint: number | null
  tuition_in_state: number | null
  tuition_out_of_state: number | null
  avg_net_price: number | null
  enrollment: number | null
  retention_rate: number | null
  grad_rate_4yr: number | null
  median_earnings_10yr: number | null
  summary: string | null
  popularity: number
  updated_at: string | null
}

export async function getCollegeBySlug(slug: string): Promise<College | null> {
  const sb = await createClient()
  const { data } = await sb
    .from('colleges')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as College) || null
}

export async function getTopCollegeSlugs(limit = 500): Promise<string[]> {
  const sb = await createClient()
  const { data } = await sb
    .from('colleges')
    .select('slug')
    .order('popularity', { ascending: false })
    .limit(limit)
  return ((data || []) as { slug: string }[]).map((r) => r.slug)
}

export async function getSimilarColleges(c: College, limit = 6): Promise<College[]> {
  const sb = await createClient()
  // Same control + similar admission rate window
  const lo = (c.admission_rate ?? 50) - 12
  const hi = (c.admission_rate ?? 50) + 12
  const { data } = await sb
    .from('colleges')
    .select('*')
    .neq('ipeds_id', c.ipeds_id)
    .eq('control', c.control)
    .gte('admission_rate', Math.max(0, lo))
    .lte('admission_rate', Math.min(100, hi))
    .order('popularity', { ascending: false })
    .limit(limit)
  return ((data || []) as College[])
}

export const fmtPct = (n: number | null) => (n == null ? '—' : `${n}%`)
export const fmtMoney = (n: number | null) =>
  n == null ? '—' : `$${n.toLocaleString('en-US')}`
export const fmtNum = (n: number | null) =>
  n == null ? '—' : n.toLocaleString('en-US')
