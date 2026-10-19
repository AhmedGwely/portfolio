import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  validateSettingsBody,
  type SiteConfig,
  type SiteConfigBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'site-config'

/* ── Route handlers ────────────────────────────────────────────────────── */

/** GET /api/settings — return the current site configuration (public). */
export async function GET(): Promise<NextResponse> {
  const config = await readData<SiteConfig>(FILENAME, {
    bookingUrl: null,
    contactEmail: '',
    formspreeEndpoint: '',
    siteUrl: '',
    siteTitle: '',
    siteDescription: '',
  })
  return NextResponse.json(config)
}

/** PUT /api/settings — update the site configuration (auth + origin required). */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const body = await parseRequestBody<SiteConfigBody>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateSettingsBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  // Read current config so partial updates merge correctly.
  const current = await readData<SiteConfig>(FILENAME, {
    bookingUrl: null,
    contactEmail: '',
    formspreeEndpoint: '',
    siteUrl: '',
    siteTitle: '',
    siteDescription: '',
  })

  const updated: SiteConfig = {
    bookingUrl:
      body.bookingUrl !== undefined
        ? body.bookingUrl === null
          ? null
          : stripHtml(body.bookingUrl.trim())
        : current.bookingUrl,
    contactEmail:
      body.contactEmail !== undefined
        ? stripHtml(body.contactEmail.trim())
        : current.contactEmail,
    formspreeEndpoint:
      body.formspreeEndpoint !== undefined
        ? stripHtml(body.formspreeEndpoint.trim())
        : current.formspreeEndpoint,
    siteUrl:
      body.siteUrl !== undefined
        ? stripHtml(body.siteUrl.trim())
        : current.siteUrl,
    siteTitle:
      body.siteTitle !== undefined
        ? stripHtml(body.siteTitle.trim())
        : current.siteTitle,
    siteDescription:
      body.siteDescription !== undefined
        ? stripHtml(body.siteDescription.trim())
        : current.siteDescription,
  }

  await writeData(FILENAME, updated)

  return NextResponse.json(updated)
}
