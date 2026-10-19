import type { MetadataRoute } from 'next'

const SITE_URL = 'https://ahmed-gwely-portfolio.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Reserved for the admin dashboard and any API surface added later.
        // Disallowed pre-emptively so private routes are never indexed.
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
