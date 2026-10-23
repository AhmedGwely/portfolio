import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { getSupabase, getStorageBucket } from '@/lib/supabase'
import { requireAuth, validateOrigin } from '@/lib/api-helpers'
import { createGalleryEntry, readGalleryEntry, deleteGalleryEntry } from '@/lib/gallery-data'

/**
 * Upload endpoint for portfolio gallery images.
 *
 * Security model (aligned with the approved architecture):
 *  - Server-side only: service-role Supabase client, never exposed to browser
 *  - Admin auth: existing HMAC session cookie (requireAuth)
 *  - CSRF: Origin header validated against Host (validateOrigin)
 *  - Storage: Supabase Storage 'gallery' bucket (Free plan, public read only)
 *  - Metadata: the `gallery_metadata` PostgreSQL table (durable store)
 *  - Limits: 5 MB max, MIME allowlist (image/jpeg, image/png, image/webp, image/gif)
 *  - Free-tier note: 1 GB total storage, 5 GB egress/month
 *
 * The exact Storage object key is captured at upload time and passed to the
 * data layer, so deletion never has to reconstruct the key from a public URL.
 */
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  let uploadedObjectKey: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = (formData.get('caption') as string) || ''
    const alt = (formData.get('alt') as string) || ''
    const category = (formData.get('category') as string) || 'AI & Computer Vision'
    const width = Number(formData.get('width')) || 0
    const height = Number(formData.get('height')) || 0

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type "${file.type}". Allowed: ${ALLOWED_MIME.join(
            ', ',
          )}`,
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1_000_000).toFixed(1)} MB). Max: ${MAX_FILE_SIZE / 1_000_000} MB`,
        },
        { status: 400 },
      )
    }

    if (width <= 0) {
      return NextResponse.json({ error: 'Width must be a positive number' }, { status: 400 })
    }
    if (height <= 0) {
      return NextResponse.json({ error: 'Height must be a positive number' }, { status: 400 })
    }

    // Server-controlled storage key — never trust a user-supplied filename.
    const ext = file.type.split('/')[1] || 'bin'
    const objectName = `gallery/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await getSupabase()
      .storage.from(getStorageBucket())
      .upload(objectName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }

    // Record the exact key now — this is what deletion will use.
    uploadedObjectKey = objectName

    // Public delivery URL for the gallery
    const { data: publicUrlData } = getSupabase()
      .storage.from(getStorageBucket())
      .getPublicUrl(objectName)
    const publicUrl = publicUrlData?.publicUrl || ''

    // The id is assigned by the data layer from the full id set, so it cannot
    // collide with an unpublished record's id.
    const newImage = await createGalleryEntry(
      {
        src: publicUrl,
        caption,
        alt,
        category,
        width,
        height,
      },
      uploadedObjectKey,
    )

    return NextResponse.json({
      ok: true,
      image: newImage,
      fileUrl: publicUrl,
      message: 'Upload complete',
    })
  } catch (err) {
    console.error('Upload error:', err)

    // A file may already be in Storage even though the metadata write failed.
    // Remove exactly that one object so the bucket does not accumulate
    // orphans. Only the key captured above is ever removed.
    if (uploadedObjectKey) {
      try {
        const { error: cleanupError } = await getSupabase()
          .storage.from(getStorageBucket())
          .remove([uploadedObjectKey])
        if (cleanupError) {
          console.error('Failed to clean up orphaned upload:', cleanupError)
        }
      } catch (cleanupErr) {
        console.error('Failed to clean up orphaned upload:', cleanupErr)
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/media/upload — delete a gallery record and its storage object.
 *
 * Ownership is established by the record itself: `deleteGalleryEntry` removes
 * the metadata row and the exact Storage object key the record owns (if any),
 * never touching unrelated objects or using a broad prefix.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const id = Number(formData.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    // Verify the record exists and is owned before deleting anything.
    const existing = await readGalleryEntry(id, { publishedOnly: false })
    if (!existing) {
      return NextResponse.json({ error: 'Gallery entry not found' }, { status: 404 })
    }

    await deleteGalleryEntry(id)

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Failed to delete gallery entry' }, { status: 500 })
  }
}
