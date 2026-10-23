import { NextRequest, NextResponse } from 'next/server'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  validateGalleryBody,
  type GalleryBody,
} from '@/lib/api-helpers'
import { readGalleryEntry, updateGalleryEntry, deleteGalleryEntry } from '@/lib/gallery-data'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/** GET /api/gallery/[id] — fetch a single published image (public). */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const image = await readGalleryEntry(id)
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    return NextResponse.json(image)
  } catch (err) {
    console.error(`GET /api/gallery/${id} failed:`, err)
    return NextResponse.json({ error: 'Failed to load gallery entry' }, { status: 500 })
  }
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

  const id = parseId((await context.params).id)
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

  try {
    // The data layer throws when the row does not exist, so an update to a
    // missing record cannot silently succeed.
    await updateGalleryEntry(id, {
      src: stripHtml(body.src!),
      caption: stripHtml(body.caption!),
      alt: stripHtml(body.alt!),
      category: stripHtml(body.category!),
      width: body.width!,
      height: body.height!,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.error(`PUT /api/gallery/${id} failed:`, err)
    return NextResponse.json({ error: 'Failed to update gallery entry' }, { status: 500 })
  }

  const updated = await readGalleryEntry(id)
  if (!updated) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
  return NextResponse.json(updated)
}

/**
 * PATCH /api/gallery/[id] — publish or unpublish a record (auth + origin).
 *
 * The requested state is validated strictly as a boolean. Only the
 * `is_published` column is written: captions, alt text, category, src, and
 * storage_key are loaded from the existing row and re-sent unchanged, so a
 * publication change can never silently rewrite metadata.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const body = await parseRequestBody<{ isPublished?: unknown }>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Strict boolean: reject "true", 1, null, or a missing field.
  if (typeof body.isPublished !== 'boolean') {
    return NextResponse.json(
      { error: 'Validation failed', details: ['isPublished must be a boolean'] },
      { status: 400 },
    )
  }

  try {
    const existing = await readGalleryEntry(id, { publishedOnly: false })
    if (!existing) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    await updateGalleryEntry(
      id,
      {
        src: existing.src,
        caption: existing.caption,
        alt: existing.alt,
        category: existing.category,
        width: existing.width,
        height: existing.height,
      },
      { isPublished: body.isPublished },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.error(`PATCH /api/gallery/${id} failed:`, err)
    return NextResponse.json({ error: 'Failed to update publication state' }, { status: 500 })
  }

  // Return the record as it now is.
  const updated = await readGalleryEntry(id, { publishedOnly: false })
  if (!updated) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
  return NextResponse.json({ ...updated, isPublished: body.isPublished })
}

/**
 * DELETE /api/gallery/[id] — remove an image (auth + origin required).
 *
 * Response contract (see the admin UI for the matching rendering):
 *   200 { ok: true, deleted: true,  storageDeleted: true,  partial: false }
 *   200 { ok: true, deleted: true,  storageDeleted: false, partial: true,
 *         warning: 'The image record was deleted, but its file could not be
 *                   removed from storage.' }
 *   500 { error: 'Failed to delete gallery entry' }   ← metadata NOT deleted
 *
 * A Storage cleanup failure is never reported as full success, and a metadata
 * failure is never reported as success at all. Deletion stays targeted: a
 * single metadata row and, at most, the one Storage object the record owns.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const id = parseId((await context.params).id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  try {
    const result = await deleteGalleryEntry(id)

    if (result.storageObjectDeleted) {
      // Metadata and its Storage object are both gone.
      return NextResponse.json(
        { ok: true, deleted: true, storageDeleted: true, partial: false },
        { status: 200 },
      )
    }

    // The metadata row is gone. Distinguish the two non-clean outcomes:
    //  - the record owned a Storage object that could NOT be removed;
    //  - the record owned no Storage object at all (legacy /public asset), so
    //    there was nothing to clean up and the operation is complete.
    //
    // `ownedStorage` comes from the data layer's own delete result, captured
    // BEFORE the metadata row was removed. Re-reading the row afterwards would
    // always report false, which would hide a failed cleanup as a clean success.
    const ownedStorage = result.storageObjectOwned

    if (ownedStorage) {
      return NextResponse.json(
        {
          ok: true,
          deleted: true,
          storageDeleted: false,
          partial: true,
          warning:
            'The image record was deleted, but its file could not be removed from storage. It will need manual cleanup.',
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      { ok: true, deleted: true, storageDeleted: false, partial: false },
      { status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    console.error(`DELETE /api/gallery/${id} failed:`, err)
    // Metadata deletion failed: do NOT report any success.
    return NextResponse.json({ error: 'Failed to delete gallery entry' }, { status: 500 })
  }
}
