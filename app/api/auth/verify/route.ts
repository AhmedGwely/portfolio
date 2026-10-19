import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get('admin_session')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
