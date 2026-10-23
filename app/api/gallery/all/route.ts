import { NextRequest, NextResponse } from 'next/server'
import { readGalleryForAdmin } from '@/lib/gallery-data'
import { requireAuth, validateOrigin } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/gallery/all — list every record, including drafts (admin only).
 *
 * Authentication is enforced HERE, in the route, so a client-supplied query
 * flag can never grant access to unpublished records. Both `requireAuth` and
 * `validateOrigin` are checked before any data is read.
 *
 * Next.js only treats HTTP verbs as route exports, so this lives in its own
 * directory: `GET_ALL` in `route.ts` would not be reachable.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const images = await readGalleryForAdmin()
    return NextResponse.json(images)
  } catch (err) {
    console.error('GET /api/gallery/all failed:', err)
    return NextResponse.json({ error: 'Failed to load gallery' }, { status: 500 })
  }
}
