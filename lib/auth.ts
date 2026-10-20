import crypto from 'node:crypto'

const ALGORITHM = 'sha256'
const TOKEN_TTL_SECONDS = 86400 // 24 hours

/**
 * The HMAC signing secret.
 *
 * ⚠️ There is deliberately NO fallback value. A hardcoded default would let
 * anyone forge session tokens if the env var were missing in production
 * (the constant would be public in Git). `getSecret()` throws instead so the
 * failure is loud and immediate rather than silently insecure.
 */
function getSecret(): string {
  const secret = process.env.ADMIN_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'ADMIN_SECRET is not configured or is too short (minimum 16 characters). ' +
        'Set it in your environment before starting the server.',
    )
  }
  return secret
}

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
  const hmac = crypto.createHmac(ALGORITHM, getSecret()).update(encoded).digest('base64url')
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

  let expectedSig: Buffer
  try {
    expectedSig = crypto.createHmac(ALGORITHM, getSecret()).update(encoded).digest()
  } catch {
    return null
  }

  const providedBuf = Buffer.from(providedSig, 'base64url')

  // timingSafeEqual requires equal-length buffers
  if (providedBuf.length !== expectedSig.length) return null
  if (!crypto.timingSafeEqual(providedBuf, expectedSig)) return null

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null
    // Reject malformed / clock-skewed timestamps, and enforce a ceiling on iat
    // so a token with a valid exp but an absurd iat cannot be abused.
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (payload.iat > nowSeconds + 60) return null
    if (Date.now() >= payload.exp * 1000) return null
    return payload
  } catch {
    return null
  }
}

/**
 * Constant-time string comparison for secrets (e.g. password verification).
 * Returns false when lengths differ; never throws.
 */
export function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
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
