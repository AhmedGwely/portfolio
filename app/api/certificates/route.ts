import { NextRequest, NextResponse } from 'next/server'
import { readData, writeData } from '@/lib/data'
import {
  requireAuth,
  validateOrigin,
  parseRequestBody,
  generateId,
  stripHtml,
  type CertificateEntry,
  type CertificateBody,
  validateCertificateBody,
} from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const FILENAME = 'certificates'

/** GET /api/certificates — list all certificates (public). */
export async function GET(): Promise<NextResponse> {
  const certificates = await readData<CertificateEntry[]>(FILENAME, [])
  return NextResponse.json(certificates)
}

/** POST /api/certificates — create a new certificate (auth + origin required). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAuth(request)
  if (authError) return authError

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
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
  const newId = generateId(certificates)

  const newCertificate: CertificateEntry = {
    id: newId,
    title: stripHtml(body.title!),
    issuer: stripHtml(body.issuer!),
    category: stripHtml(body.category!),
    color: stripHtml(body.color!).trim(),
    emoji: stripHtml(body.emoji!),
    file: stripHtml(body.file!),
    preview: stripHtml(body.preview!),
    type: body.type!,
  }

  certificates.push(newCertificate)
  await writeData(FILENAME, certificates)

  return NextResponse.json(newCertificate, { status: 201 })
}
