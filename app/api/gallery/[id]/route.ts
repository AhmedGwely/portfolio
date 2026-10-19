import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  validateGalleryBody,
  type GalleryImageEntry,
  type GalleryBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'gallery'

type RouteContext = { params: { id: string } }

function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/** GET /api/gallery/[id] — fetch a single image (public). */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const images = await readData<GalleryImageEntry[]>(FILENAME, [])
  const image = images.find((i) => i.id === id)
  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  return NextResponse.json(image)
}

/** PUT /api/gallery/[id] — update an image (auth + origin required). */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
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

  const images = await readData<GalleryImageEntry[]>(FILENAME, [])
  const index = images.findIndex((i) => i.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const updated: GalleryImageEntry = {
    id,
    src: stripHtml(body.src!),
    caption: stripHtml(body.caption!),
    alt: stripHtml(body.alt!),
    category: stripHtml(body.category!),
    width: body.width!,
    height: body.height!,
  }

  images[index] = updated
  await writeData(FILENAME, images)

  return NextResponse.json(updated)
}

/** DELETE /api/gallery/[id] — remove an image (auth + origin required). */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const images = await readData<GalleryImageEntry[]>(FILENAME, [])
  const index = images.findIndex((i) => i.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  images.splice(index, 1)
  await writeData(FILENAME, images)

  return new NextResponse(null, { status: 204 })
}
