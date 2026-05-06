import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SITE_URL as SITE } from '@/lib/siteConfig'

export const revalidate = 3600 // re-query DB at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE}/`,        changeFrequency: 'weekly',  priority: 1.0, lastModified: new Date() },
    { url: `${SITE}/signup`,  changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/login`,   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE}/colleges`,changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE}/parents`, changeFrequency: 'monthly', priority: 0.8 },
  ]

  let collegeEntries: MetadataRoute.Sitemap = []
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseKey) return staticEntries

    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
    const { data } = await sb
      .from('colleges')
      .select('slug, updated_at, popularity')
      .order('popularity', { ascending: false })
      .limit(50000)

    collegeEntries = (data || []).flatMap((c: { slug: string; updated_at: string | null }) => [
      {
        url: `${SITE}/colleges/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${SITE}/colleges/${c.slug}/chances`,
        lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ])
  } catch (err) {
    console.error('[sitemap] failed to load colleges', err)
  }

  return [...staticEntries, ...collegeEntries]
}
