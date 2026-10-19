import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  generateId,
  stripHtml,
  validateGalleryBody,
  type GalleryImageEntry,
  type GalleryBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'gallery'

/** GET /api/gallery — list all images (public). */
export async function GET(): Promise<NextResponse> {
  const images = await readData<GalleryImageEntry[]>(FILENAME, [])
  return NextResponse.json(images)
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

  const images = await readData<GalleryImageEntry[]>(FILENAME, [])
  const newId = generateId(images)

  const newImage: GalleryImageEntry = {
    id: newId,
    src: stripHtml(body.src!),
    caption: stripHtml(body.caption!),
    alt: stripHtml(body.alt!),
    category: stripHtml(body.category!),
    width: body.width!,
    height: body.height!,
  }

  images.push(newImage)
  await writeData(FILENAME, images)

  return NextResponse.json(newImage, { status: 201 })
}
