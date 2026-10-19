import crypto from 'node:crypto'

const SECRET = process.env.ADMIN_SECRET || 'dev-only-secret-change-me'
const ALGORITHM = 'sha256'
const TOKEN_TTL_SECONDS = 86400 // 24 hours

export interface SessionPayload {
  iat: number
  exp: number
}

/**
 * Generate an HMAC-SHA256 signed session token.
 * Format: base64url(payload).base64url(signature)
 */
export function generateToken(payload: SessionPayload): string {
  const data = JSON.stringify(payload)
  const encoded = Buffer.from(data).toString('base64url')
  const hmac = crypto.createHmac(ALGORITHM, SECRET).update(encoded).digest('base64url')
  return `${encoded}.${hmac}`
}

/**
 * Verify an HMAC-SHA256 signed session token.
 * Returns the decoded payload if valid, otherwise null.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, providedSig] = parts
  const expectedSig = crypto.createHmac(ALGORITHM, SECRET).update(encoded).digest()

  const providedBuf = Buffer.from(providedSig, 'base64url')
  const expectedBuf = Buffer.from(expectedSig)

  // timingSafeEqual requires equal-length buffers
  if (providedBuf.length !== expectedBuf.length) return null
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null
    if (Date.now() >= payload.exp * 1000) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Create a new session payload with current timestamp and 24h expiry.
 */
export function createSession(): SessionPayload {
  const now = Math.floor(Date.now() / 1000)
  return {
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }
}
