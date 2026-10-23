import { NextRequest, NextResponse } from 'next/server'
import { readGallery, createGalleryEntry } from '@/lib/gallery-data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  validateGalleryBody,
  type GalleryImage,
  type GalleryBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/** GET /api/gallery — list all published images (public). */
export async function GET(): Promise<NextResponse> {
  try {
    const images = await readGallery()
    return NextResponse.json(images)
  } catch (err) {
    // A database failure must be a 500, not an empty list: an empty list is
    // indistinguishable from "no images yet" and would hide the outage.
    console.error('GET /api/gallery failed:', err)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}

/** POST /api/gallery — create a new image (auth + origin required). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const body = await parseRequestBody<GalleryBody>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateGalleryBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  try {
    // The id is assigned by the data layer from the full id set and the
    // reserved legacy range, so it can never collide with a legacy id or a
    // draft's id. The route does not compute an id of its own.
    const created: GalleryImage = await createGalleryEntry({
      src: stripHtml(body.src!),
      caption: stripHtml(body.caption!),
      alt: stripHtml(body.alt!),
      category: stripHtml(body.category!),
      width: body.width!,
      height: body.height!,
    })

    // Targeted single-row insert: only this new record is written.
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/gallery failed:', err)
    return NextResponse.json({ error: 'Failed to create gallery entry' }, { status: 500 })
  }
}
