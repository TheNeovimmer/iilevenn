import fp from 'fastify-plugin'
import fjwt from '@fastify/jwt'
import { eq, or, isNull, gt } from 'drizzle-orm'
import { getDb, apiKeys, users } from '@iilevenn/db'
import { hashToken } from '../lib/crypto'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string }
    user: { sub: string; email: string }
  }
}

async function jwt(app: FastifyInstance) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }

  await app.register(fjwt, {
    secret,
    sign: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  })

  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' },
      })
    }

    // Check if this is an API key (Bearer xi_...)
    const token = authHeader.replace('Bearer ', '')
    if (token.startsWith('xi_')) {
      return authenticateApiKey(token, request, reply)
    }

    // Otherwise, verify as JWT
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      })
    }
  })
}

async function authenticateApiKey(key: string, request: FastifyRequest, reply: FastifyReply) {
  const db = getDb()
  const keyHash = hashToken(key)

  const apiKey = await db.query.apiKeys.findFirst({
    where: eq(apiKeys.keyHash, keyHash),
  })

  if (!apiKey) {
    return reply
      .status(401)
      .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid API key' } })
  }

  // Check expiry (null = never expires)
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return reply
      .status(401)
      .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'API key has expired' } })
  }

  // Look up the user
  const user = await db.query.users.findFirst({
    where: eq(users.id, apiKey.userId),
    columns: { id: true, email: true },
  })

  if (!user) {
    return reply
      .status(401)
      .send({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } })
  }

  // Update lastUsedAt (fire-and-forget — don't slow down the request)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id))
    .then(() => {})

  // Set user on request (same shape as JWT payload)
  request.user = { sub: user.id, email: user.email }
}

export const jwtPlugin = fp(jwt, { name: 'jwt' })

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
