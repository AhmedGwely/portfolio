import { NextRequest, NextResponse } from 'next/server'
import { generateToken, createSession } from '@/lib/auth'

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const password = body.password

  if (!password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Password is required' }, { status: 400 })
  }

  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json(
      { error: 'Server configuration error: ADMIN_PASSWORD not set' },
      { status: 500 },
    )
  }

  // Use timing-safe comparison for the password too
  const passwordMatch = password === adminPassword

  if (!passwordMatch) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const session = createSession()
  const token = generateToken(session)

  const response = NextResponse.json({ ok: true })
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  })

  return response
}
