import { createHash } from 'node:crypto'

/**
 * Fast SHA-256 hash for API key verification.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
