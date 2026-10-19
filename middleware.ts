import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — soft auth check for /admin/* routes.
 *
 * This runs on the Edge runtime which cannot import node:crypto.
 * We only check that a session cookie EXISTS here. The hard verification
 * (HMAC signature + expiry) happens in:
 *   1. /api/auth/verify — called by the admin layout on mount
 *   2. Every /api/* mutation route — via lib/auth.ts (Node runtime)
 *
 * A fake/invalid cookie passes the middleware but is rejected by
 * /api/auth/verify, which redirects to /admin-login.
 */
export function middleware(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl

  // Allow the login page through
  if (pathname === '/admin-login') {
    return NextResponse.next()
  }

  // Soft check: cookie must exist
  const token = request.cookies.get('admin_session')?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin-login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
