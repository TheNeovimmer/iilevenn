import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { getDb, voices } from '@iilevenn/db'

const createVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.enum(['cloned', 'custom']),
  language: z.string().min(1).max(10).default('en'),
  gender: z.enum(['male', 'female', 'neutral']).default('neutral'),
  description: z.string().optional(),
  accent: z.string().max(100).optional(),
  isPublic: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateVoiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  language: z.string().min(1).max(10).optional(),
  gender: z.enum(['male', 'female', 'neutral']).optional(),
  description: z.string().optional(),
  accent: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function voiceRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', app.authenticate)

  // POST /voices — Create a new voice
  app.post('/', async (request, reply) => {
    const result = createVoiceSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.issues },
      })
    }

    const db = getDb()

    const [voice] = await db
      .insert(voices)
      .values({ ...result.data, userId: request.user.sub })
      .returning()

    return reply.status(201).send({ success: true, data: { voice } })
  })

  // GET /voices — List user's own voices
  app.get('/', async (request, reply) => {
    const db = getDb()

    const userVoices = await db.query.voices.findMany({
      where: eq(voices.userId, request.user.sub),
      orderBy: desc(voices.createdAt),
    })

    return reply.status(200).send({ success: true, data: { voices: userVoices } })
  })

  // GET /voices/:id — Get a single voice (owner only)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    const voice = await db.query.voices.findFirst({
      where: and(eq(voices.id, id), eq(voices.userId, request.user.sub)),
    })

    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    return reply.status(200).send({ success: true, data: { voice } })
  })

  // PUT /voices/:id — Update a voice (owner only)
  app.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = updateVoiceSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.issues },
      })
    }

    const db = getDb()

    // Verify ownership
    const existing = await db.query.voices.findFirst({
      where: and(eq(voices.id, id), eq(voices.userId, request.user.sub)),
    })

    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    const [updated] = await db
      .update(voices)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(voices.id, id))
      .returning()

    return reply.status(200).send({ success: true, data: { voice: updated } })
  })

  // DELETE /voices/:id — Delete a voice (owner only)
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    const [deleted] = await db
      .delete(voices)
      .where(and(eq(voices.id, id), eq(voices.userId, request.user.sub)))
      .returning({ id: voices.id })

    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    return reply.status(200).send({
      success: true,
      data: { message: 'Voice deleted' },
    })
  })
}
