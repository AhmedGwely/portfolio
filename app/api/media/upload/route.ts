import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { supabase } from '@/lib/supabase'
import { getStorageBucket } from '@/lib/supabase'
import { requireAuth, validateOrigin } from '@/lib/api-helpers'
import { readGallery, writeGallery } from '@/lib/gallery-data'

/**
 * Upload endpoint for portfolio gallery images.
 *
 * Security model (aligned with the approved architecture):
 *  - Server-side only: service-role Supabase client, never exposed to browser
 *  - Admin auth: existing HMAC session cookie (requireAuth)
 *  - CSRF: Origin header validated against Host (validateOrigin)
 *  - Storage: Supabase Storage 'gallery' bucket (Free plan, public read only)
 *  - Metadata: JSON file (data/gallery.json), not in DB yet
 *  - Limits: 5 MB max, MIME allowlist (image/jpeg, image/png, image/webp, image/gif)
 *  - Free-tier note: 1 GB total storage, 5 GB egress/month
 */
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = (formData.get('caption') as string) || ''
    const alt = (formData.get('alt') as string) || ''
    const category =
      (formData.get('category') as string) || 'AI & Computer Vision'
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
      return NextResponse.json(
        { error: 'Width must be a positive number' },
        { status: 400 },
      )
    }
    if (height <= 0) {
      return NextResponse.json(
        { error: 'Height must be a positive number' },
        { status: 400 },
      )
    }

    // Server-controlled storage key — never trust user-supplied filename
    const ext = file.type.split('/')[1] || 'bin'
    const objectName = `gallery/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(getStorageBucket())
      .upload(objectName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 },
      )
    }

    // Public delivery URL for the gallery
    const { data: publicUrlData } = supabase.storage
      .from(getStorageBucket())
      .getPublicUrl(objectName)
    const publicUrl = publicUrlData?.publicUrl || ''

    // Persist metadata
    const images = await readGallery()
    const maxId = images.reduce((max, img) => Math.max(max, img?.id || 0), 0)
    const newImage = {
      id: maxId + 1,
      src: publicUrl,
      caption,
      alt,
      category,
      width,
      height,
    }

    const updated = [...images, newImage]
    await writeGallery(updated)

    return NextResponse.json({
      ok: true,
      image: newImage,
      fileUrl: publicUrl,
      message: 'Upload complete',
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
