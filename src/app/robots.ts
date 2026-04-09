import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/', '/onboarding/'] },
    ],
    sitemap: 'https://stairwayu.com/sitemap.xml',
    host: 'https://stairwayu.com',
  }
}
