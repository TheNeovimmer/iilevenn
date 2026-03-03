import type { FastifyInstance } from 'fastify'
import { eq, and, ilike, or, count } from 'drizzle-orm'
import { getDb, voices } from '@iilevenn/db'

export async function libraryRoutes(app: FastifyInstance) {
  // GET /library — Browse public voices (no auth required)
  app.get('/', async (request, reply) => {
    const query = request.query as {
      search?: string
      language?: string
      gender?: string
      category?: string
      page?: string
      limit?: string
    }

    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
    const offset = (page - 1) * limit

    const db = getDb()

    // Build filter conditions
    const conditions = [eq(voices.isPublic, true)]

    if (query.search) {
      conditions.push(
        or(
          ilike(voices.name, `%${query.search}%`),
          ilike(voices.description, `%${query.search}%`),
        )!,
      )
    }

    if (query.language) {
      conditions.push(eq(voices.language, query.language))
    }

    if (query.gender && ['male', 'female', 'neutral'].includes(query.gender)) {
      conditions.push(eq(voices.gender, query.gender as 'male' | 'female' | 'neutral'))
    }

    if (query.category && ['premade', 'cloned', 'custom'].includes(query.category)) {
      conditions.push(eq(voices.category, query.category as 'premade' | 'cloned' | 'custom'))
    }

    const where = and(...conditions)

    // Run count and data queries in parallel
    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: voices.id,
          name: voices.name,
          description: voices.description,
          category: voices.category,
          language: voices.language,
          gender: voices.gender,
          accent: voices.accent,
          previewUrl: voices.previewUrl,
          metadata: voices.metadata,
          createdAt: voices.createdAt,
        })
        .from(voices)
        .where(where)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(voices).where(where),
    ])

    return reply.status(200).send({
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  })

  // GET /library/:id — Get a single public voice (no auth required)
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    const voice = await db.query.voices.findFirst({
      where: and(eq(voices.id, id), eq(voices.isPublic, true)),
    })

    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    return reply.status(200).send({ success: true, data: { voice } })
  })
}
