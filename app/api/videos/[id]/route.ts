import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  type VideoEntry,
  type VideoBody,
  validateVideoBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'videos'

type RouteContext = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/** GET /api/videos/[id] — fetch a single video (public). */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const videos = await readData<VideoEntry[]>(FILENAME, [])
  const video = videos.find((v) => v.id === id)
  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  return NextResponse.json(video)
}

/** PUT /api/videos/[id] — update a video (auth + origin required). */
export async function PUT(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = await requireAuth(request)
  if (authError) return authError

  if (!(await validateOrigin(request))) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await parseRequestBody<VideoBody>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateVideoBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  const videos = await readData<VideoEntry[]>(FILENAME, [])
  const index = videos.findIndex((v) => v.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const updated: VideoEntry = {
    id,
    title: stripHtml(body.title!),
    type: body.type!,
    url: stripHtml(body.url!),
    thumbnail: stripHtml(body.thumbnail ?? ''),
    description: stripHtml(body.description ?? ''),
    source: stripHtml(body.source ?? ''),
  }

  videos[index] = updated
  await writeData(FILENAME, videos)

  return NextResponse.json(updated)
}

/** DELETE /api/videos/[id] — remove a video (auth + origin required). */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = await requireAuth(request)
  if (authError) return authError

  if (!(await validateOrigin(request))) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const videos = await readData<VideoEntry[]>(FILENAME, [])
  const index = videos.findIndex((v) => v.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  videos.splice(index, 1)
  await writeData(FILENAME, videos)

  return new NextResponse(null, { status: 204 })
}
