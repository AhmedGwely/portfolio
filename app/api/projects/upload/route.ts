import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import { requireAuth, validateOrigin } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'mp4'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB

/** GET /api/projects/mp4 — list available MP4 files for the projects page. */
export async function GET(): Promise<NextResponse> {
  const files = await readData<string[]>(FILENAME, [])
  return NextResponse.json(files)
}

/** POST /api/projects/upload — upload a single MP4 file. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Only allow MP4 videos
    if (!file.type.startsWith('video/mp4')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4 videos are allowed.' },
        { status: 400 },
      )
    }

    // Enforce size limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large (${(file.size / 1_000_000).toFixed(1)} MB). Max: 100 MB`,
        },
        { status: 400 },
      )
    }

    // Sanitize filename: only alphanumeric, dash, underscore, dot
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'mp4'
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.mp4$/i, '')
    const fileName = `${safeName}.mp4`

    // Ensure uniqueness
    const existing = await readData<string[]>(FILENAME, [])
    const baseName = fileName
    let finalName = baseName
    let counter = 1
    while (existing.includes(finalName)) {
      finalName = `${baseName}_${counter}.mp4`
      counter++
    }
    const finalPath = `uploads/${finalName}`

    // Read file bytes and write to public/uploads
    const bytes = new Uint8Array(await file.arrayBuffer())
    const fs = await import('node:fs/promises')
    await fs.writeFile(finalPath, bytes)

    // Update the files list
    if (!existing.includes(finalName)) {
      existing.push(finalName)
      await writeData(FILENAME, existing)
    }

    return NextResponse.json({
      ok: true,
      file: finalName,
      url: `/uploads/${finalName}`,
    })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    )
  }
}
