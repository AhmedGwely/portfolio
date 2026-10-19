import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  stripHtml,
  validateCertificateBody,
  type CertificateEntry,
  type CertificateBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'certificates'

type RouteContext = { params: { id: string } }

function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

/** GET /api/certificates/[id] — fetch a single certificate (public). */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const id = parseId(context.params.id)
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
  }

  const certificates = await readData<CertificateEntry[]>(FILENAME, [])
  const certificate = certificates.find((c) => c.id === id)
  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  return NextResponse.json(certificate)
}

/** PUT /api/certificates/[id] — update a certificate (auth + origin required). */
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

  const body = await parseRequestBody<CertificateBody>(request)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateCertificateBody(body)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 },
    )
  }

  const certificates = await readData<CertificateEntry[]>(FILENAME, [])
  const index = certificates.findIndex((c) => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  const updated: CertificateEntry = {
    id,
    title: stripHtml(body.title!),
    issuer: stripHtml(body.issuer!),
    category: stripHtml(body.category!),
    color: stripHtml(body.color!).trim(),
    emoji: stripHtml(body.emoji!),
    file: stripHtml(body.file!),
    preview: stripHtml(body.preview!),
    type: body.type!,
  }

  certificates[index] = updated
  await writeData(FILENAME, certificates)

  return NextResponse.json(updated)
}

/** DELETE /api/certificates/[id] — remove a certificate (auth + origin required). */
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

  const certificates = await readData<CertificateEntry[]>(FILENAME, [])
  const index = certificates.findIndex((c) => c.id === id)
  if (index === -1) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
  }

  certificates.splice(index, 1)
  await writeData(FILENAME, certificates)

  return new NextResponse(null, { status: 204 })
}
