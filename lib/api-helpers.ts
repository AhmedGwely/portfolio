import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

/**
 * Gallery database row shape as returned by the Supabase
 * `gallery_metadata` table.
 *
 * The database column containing the alternative text is named `alt_text`.
 * It is NOT part of the public API contract — `alt` is the application-
 * facing name.
 */
export type GalleryImageEntry = {
  id: number
  src: string
  caption: string
  alt: string
  alt_text: string
  category: string
  width: number
  height: number
}

/**
 * Application-facing gallery image record (API responses, UI components,
 * public data layer).
 *
 * `alt` is the single field the rest of the codebase uses for alternative
 * text. It is derived from the Supabase column `alt_text` in the data layer
 * (see `mapAltTextToAlt`) so that no other module has to know the database
 * column name.
 */
export type GalleryImage = {
  id: number
  src: string
  caption: string
  alt: string
  category: string
  width: number
  height: number
}

/**
 * Map a database row (`alt_text` column) onto the application-facing
 * `GalleryImage` type. This is the single, explicit mapping between the
 * database schema and the application contract.
 */
export function mapAltTextToAlt(row: GalleryImageEntry): GalleryImage {
  return {
    id: row.id,
    src: row.src,
    caption: row.caption,
    alt: row.alt_text,
    category: row.category,
    width: row.width,
    height: row.height,
  }
}

/**
 * Verify the admin session cookie.
 * Returns a 401 NextResponse when unauthenticated, or null when the request
 * is allowed to proceed.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const token = request.cookies.get('admin_session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
  }
  return null
}

/**
 * CSRF protection — the Origin header must match the request host.
 * Returns false when the origin is missing or does not match.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

/**
 * Parse a JSON request body with a generic type.
 * Returns null when the body is not valid JSON.
 */
export async function parseRequestBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}

/**
 * Generate the next stable integer id (max existing id + 1).
 * Returns 1 for an empty list.
 */
export function generateId(items: { id: number }[]): number {
  if (items.length === 0) return 1
  return Math.max(...items.map((i) => i.id)) + 1
}

/**
 * Strip HTML tags from a user-supplied string to prevent stored XSS.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

/**
 * Request body accepted by the gallery API. Does NOT include `alt_text` —
 * that field is always derived from `alt` server-side.
 */
export type GalleryBody = Partial<Omit<GalleryImageEntry, 'id' | 'alt_text'>>

/** A single project record as stored in data/projects.json. */
export type ProjectEntry = {
  id: number
  title: string
  description: string
  problem: string
  solution: string
  impact: string
  tech: string[]
  github: string
  live: string
  video?: {
    type: 'youtube' | 'tiktok' | 'linkedin' | 'mp4'
    url: string
    thumbnail?: string
  }
  badge: string
  badgeColor: string
  category: string
}

export type ProjectBody = Partial<Omit<ProjectEntry, 'id' | 'tech' | 'video'>> & {
  tech?: string[]
  video?: {
    type: 'youtube' | 'tiktok' | 'linkedin' | 'mp4'
    url: string
    thumbnail?: string
  }
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}

/** A single video record as stored in data/videos.json. */
export type VideoEntry = {
  id: number
  title: string
  type: 'youtube' | 'tiktok' | 'linkedin' | 'mp4'
  url: string
  thumbnail: string
  description: string
  source: string
}

export type VideoBody = Partial<Omit<VideoEntry, 'id'>>

const VIDEO_TYPES = ['youtube', 'tiktok', 'linkedin', 'mp4'] as const

/**
 * Validate a video payload (shared by POST and PUT).
 * title and url are required; url must be a valid URL; type must be one
 * of youtube/tiktok/linkedin/mp4.
 */
export function validateVideoBody(body: VideoBody): ValidationResult {
  const errors: string[] = []
  if (!body.title || typeof body.title !== 'string') errors.push('title is required')
  if (
    !body.type ||
    typeof body.type !== 'string' ||
    !(VIDEO_TYPES as readonly string[]).includes(body.type)
  ) {
    errors.push(`type must be one of: ${VIDEO_TYPES.join(', ')}`)
  }
  if (!body.url || typeof body.url !== 'string') {
    errors.push('url is required')
  } else {
    try {
      new URL(body.url)
    } catch {
      errors.push('url must be a valid URL')
    }
  }
  return { valid: errors.length === 0, errors }
}

const PROJECT_CATEGORIES = [
  'Computer Vision',
  'IoT & Edge',
  'AI & Machine Learning',
  'Data Science',
] as const

/**
 * Validate a project payload (shared by POST and PUT).
 * title, problem, solution, impact, category are required; tech must be
 * an array of non-empty strings.
 */
export function validateProjectBody(body: ProjectBody): ValidationResult {
  const errors: string[] = []
  if (!body.title || typeof body.title !== 'string') errors.push('title is required')
  if (!body.problem || typeof body.problem !== 'string') errors.push('problem is required')
  if (!body.solution || typeof body.solution !== 'string') errors.push('solution is required')
  if (!body.impact || typeof body.impact !== 'string') errors.push('impact is required')
  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required')
  } else if (
    !(PROJECT_CATEGORIES as readonly string[]).includes(body.category)
  ) {
    errors.push(
      `category must be one of: ${PROJECT_CATEGORIES.join(', ')}`,
    )
  }
  if (!Array.isArray(body.tech) || body.tech.some((t) => typeof t !== 'string' || !t.trim())) {
    errors.push('tech must be an array of non-empty strings')
  }
  return { valid: errors.length === 0, errors }
}

/* ── Certificates ────────────────────────────────────────────────────────── */

/** A single certificate record as stored in data/certificates.json. */
export type CertificateEntry = {
  id: number
  title: string
  issuer: string
  category: string
  color: string
  emoji: string
  file: string
  preview: string
  type: 'pdf' | 'image'
}

export type CertificateBody = Partial<Omit<CertificateEntry, 'id'>>

const CERTIFICATE_CATEGORIES = [
  'Computer Vision',
  'AI & ML',
  'Machine Learning',
  'Data Science',
  'Programming',
  'Engineering',
  'Projects',
  'Quantum',
] as const

const CERTIFICATE_TYPES = ['pdf', 'image'] as const

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * Validate a certificate payload (shared by POST and PUT).
 * title, issuer, category, color, emoji, file, preview are required;
 * color must be a valid hex color (#RGB or #RRGGBB);
 * type must be 'pdf' or 'image';
 * category must be one of the known categories.
 */
export function validateCertificateBody(body: CertificateBody): ValidationResult {
  const errors: string[] = []
  if (!body.title || typeof body.title !== 'string') errors.push('title is required')
  if (!body.issuer || typeof body.issuer !== 'string') errors.push('issuer is required')
  if (!body.category || typeof body.category !== 'string') {
    errors.push('category is required')
  } else if (
    !(CERTIFICATE_CATEGORIES as readonly string[]).includes(body.category)
  ) {
    errors.push(
      `category must be one of: ${CERTIFICATE_CATEGORIES.join(', ')}`,
    )
  }
  if (!body.color || typeof body.color !== 'string') {
    errors.push('color is required')
  } else if (!HEX_COLOR_RE.test(body.color.trim())) {
    errors.push('color must be a valid hex color (e.g. #RRGGBB)')
  }
  if (!body.emoji || typeof body.emoji !== 'string') errors.push('emoji is required')
  if (!body.file || typeof body.file !== 'string') errors.push('file is required')
  if (!body.preview || typeof body.preview !== 'string') errors.push('preview is required')
  if (
    !body.type ||
    typeof body.type !== 'string' ||
    !(CERTIFICATE_TYPES as readonly string[]).includes(body.type)
  ) {
    errors.push(`type must be one of: ${CERTIFICATE_TYPES.join(', ')}`)
  }
  return { valid: errors.length === 0, errors }
}

/**
 * Validate a gallery image payload (shared by POST and PUT).
 * src, caption, alt and category are required; width and height must be
 * positive finite numbers.
 */
export function validateGalleryBody(body: GalleryBody): ValidationResult {
  const errors: string[] = []
  if (!body.src || typeof body.src !== 'string') errors.push('src is required')
  if (!body.caption || typeof body.caption !== 'string') errors.push('caption is required')
  if (!body.alt || typeof body.alt !== 'string') errors.push('alt is required')
  if (!body.category || typeof body.category !== 'string') errors.push('category is required')
  if (
    typeof body.width !== 'number' ||
    !Number.isFinite(body.width) ||
    body.width <= 0
  ) {
    errors.push('width must be a positive number')
  }
  if (
    typeof body.height !== 'number' ||
    !Number.isFinite(body.height) ||
    body.height <= 0
  ) {
    errors.push('height must be a positive number')
  }
  return { valid: errors.length === 0, errors }
}

/* ── Site config ────────────────────────────────────────────────────────── */

export type SiteConfig = {
  bookingUrl: string | null
  contactEmail: string
  formspreeEndpoint: string
  siteUrl: string
  siteTitle: string
  siteDescription: string
}

export type SiteConfigBody = Partial<SiteConfig>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function validateSettingsBody(body: SiteConfigBody): ValidationResult {
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
