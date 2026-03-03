import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, desc, and } from 'drizzle-orm'
import { getDb, apiKeys } from '@iilevenn/db'
import { generateApiKey, hashToken } from '../lib/crypto'

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  expiresAt: z.coerce.date().optional(),
})

export async function apiKeyRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', app.authenticate)

  // POST /api-keys — Create a new API key
  app.post('/', async (request, reply) => {
    const result = createKeySchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.issues },
      })
    }

    const { name, expiresAt } = result.data
    const db = getDb()

    const { key, prefix } = generateApiKey()
    const keyHash = hashToken(key)

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: request.user.sub,
        name,
        prefix,
        keyHash,
        expiresAt: expiresAt ?? null,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })

    // Return the full key only once — it cannot be retrieved later
    return reply.status(201).send({
      success: true,
      data: { ...created, key },
    })
  })

  // GET /api-keys — List all API keys for the authenticated user
  app.get('/', async (request, reply) => {
    const db = getDb()
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, request.user.sub))
      .orderBy(desc(apiKeys.createdAt))

    return reply.status(200).send({
      success: true,
      data: { keys },
    })
  })

  // DELETE /api-keys/:id — Revoke an API key
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    const [deleted] = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, request.user.sub)))
      .returning({ id: apiKeys.id })

    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'API key not found' },
      })
    }

    return reply.status(200).send({
      success: true,
      data: { message: 'API key revoked' },
    })
  })
}
