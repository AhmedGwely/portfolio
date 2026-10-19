import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  generateId,
  stripHtml,
  type VideoEntry,
  type VideoBody,
  validateVideoBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'videos'

/** GET /api/videos — list all videos (public). */
export async function GET(): Promise<NextResponse> {
  const videos = await readData<VideoEntry[]>(FILENAME, [])
  return NextResponse.json(videos)
}

/** POST /api/videos — create a new video (auth + origin required). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
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
  const newId = generateId(videos)

  const newVideo: VideoEntry = {
    id: newId,
    title: stripHtml(body.title!),
    type: body.type!,
    url: stripHtml(body.url!),
    thumbnail: stripHtml(body.thumbnail ?? ''),
    description: stripHtml(body.description ?? ''),
    source: stripHtml(body.source ?? ''),
  }

  videos.push(newVideo)
  await writeData(FILENAME, videos)

  return NextResponse.json(newVideo, { status: 201 })
}
