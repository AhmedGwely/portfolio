import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'site-config'

/** The shape of a site-config.json document. */
export type SiteConfig = {
  bookingUrl: string | null
  contactEmail: string
  formspreeEndpoint: string
  siteUrl: string
  siteTitle: string
  siteDescription: string
}

/** Fields accepted from the PUT body — all optional except siteTitle & siteDescription. */
export type SiteConfigBody = Partial<SiteConfig>

/* ── Validation ─────────────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Validate the PUT body.
 * - siteTitle and siteDescription are required (must be non-empty strings).
 * - contactEmail, if provided, must be a valid email.
 * - bookingUrl, if provided, must be a valid URL or null.
 * - formspreeEndpoint, if provided, must be a valid URL.
 * - siteUrl, if provided, must be a valid URL.
 */
export function validateSettingsBody(body: SiteConfigBody): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (
    body.siteTitle !== undefined &&
    (typeof body.siteTitle !== 'string' || !body.siteTitle.trim())
  ) {
    errors.push('siteTitle is required and must be a non-empty string')
  }
  if (
    body.siteDescription !== undefined &&
    (typeof body.siteDescription !== 'string' || !body.siteDescription.trim())
  ) {
    errors.push('siteDescription is required and must be a non-empty string')
  }
  if (
    body.contactEmail !== undefined &&
    (typeof body.contactEmail !== 'string' || !EMAIL_RE.test(body.contactEmail.trim()))
  ) {
    errors.push('contactEmail must be a valid email address')
  }
  if (body.bookingUrl !== undefined && body.bookingUrl !== null) {
    if (typeof body.bookingUrl !== 'string' || !isValidUrl(body.bookingUrl.trim())) {
      errors.push('bookingUrl must be a valid URL or null')
    }
  }
  if (
    body.formspreeEndpoint !== undefined &&
    (typeof body.formspreeEndpoint !== 'string' || !isValidUrl(body.formspreeEndpoint.trim()))
  ) {
    errors.push('formspreeEndpoint must be a valid URL')
  }
  if (
    body.siteUrl !== undefined &&
    (typeof body.siteUrl !== 'string' || !isValidUrl(body.siteUrl.trim()))
  ) {
    errors.push('siteUrl must be a valid URL')
  }

  return { valid: errors.length === 0, errors }
}

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
