
import { NextRequest, NextResponse } from 'next/server'
import { readGalleryForAdmin } from '@/lib/gallery-data'
import { requireAuth, validateOrigin } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

/** GET /api/gallery/all
 *
 * Returns every gallery record, including unpublished drafts.
 * Admin authentication is mandatory.
 *
 * Origin validation: same-origin GETs need no Origin header, per the
 * browser spec. Cross-origin GETs must be rejected with 403.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify the admin session before accessing gallery data.
  const authError = requireAuth(request)

  if (authError) {
    return authError
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const images = await readGalleryForAdmin()

    return NextResponse.json(images)
  } catch (err) {
    console.error('GET /api/gallery/all failed:', err)

    return NextResponse.json(
      { error: 'Failed to load gallery' },
      { status: 500 }
    )
  }
}
