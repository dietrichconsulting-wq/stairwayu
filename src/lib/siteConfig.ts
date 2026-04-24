/**
 * Single source of truth for the site's canonical URLs and brand constants.
 *
 * Prefer these over hardcoding `https://stairwayu.com` in pages, metadata,
 * emails, and sitemaps so we can change domains (or test against preview
 * deployments) in one place.
 */

/** Canonical production URL, no trailing slash, bare apex (www → apex via Vercel). */
export const SITE_URL = 'https://stairwayu.com'

/** Brand name as it should appear in titles, meta, and user-facing copy. */
export const SITE_NAME = 'Stairway U'

/** Primary support / contact address. */
export const SUPPORT_EMAIL = 'support@stairwayu.com'

/** Build an absolute URL for a given app path. Path must start with `/`. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) throw new Error(`absoluteUrl expects a leading slash, got "${path}"`)
  return `${SITE_URL}${path}`
}
