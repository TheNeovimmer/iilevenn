import { randomBytes, createHash } from 'node:crypto'

/**
 * Generate a random refresh token (64 hex chars).
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Generate an API key with xi_ prefix (like ElevenLabs).
 * Returns the full key and a short prefix for display.
 */
export function generateApiKey(): { key: string; prefix: string } {
  const raw = randomBytes(16).toString('hex') // 32 hex chars
  const key = `xi_${raw}`
  const prefix = key.slice(0, 7) // "xi_xxxx"
  return { key, prefix }
}

/**
 * Fast SHA-256 hash for refresh tokens.
 * We use SHA-256 (not argon2) because these are high-entropy random values,
 * not user-chosen passwords. No need for slow hashing.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
