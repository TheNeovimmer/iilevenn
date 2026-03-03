import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, and, desc, or } from 'drizzle-orm'
import { getDb, ttsJobs, audioFiles, voices } from '@iilevenn/db'
import { publishJob } from '../lib/queue'
import { getPresignedUrl } from '../lib/storage'

const createJobSchema = z.object({
  voiceId: z.string().uuid(),
  text: z.string().min(1, 'Text is required').max(5000),
  outputFormat: z.enum(['mp3', 'wav']).default('mp3'),
})

export async function ttsRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', app.authenticate)

  // POST /tts — Submit a TTS job
  app.post('/', async (request, reply) => {
    const result = createJobSchema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: result.error.issues },
      })
    }

    const { voiceId, text, outputFormat } = result.data
    const db = getDb()

    // Verify voice exists and is accessible (public or owned by user)
    const voice = await db.query.voices.findFirst({
      where: and(
        eq(voices.id, voiceId),
        or(eq(voices.isPublic, true), eq(voices.userId, request.user.sub)),
      ),
    })

    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    // Create the job record
    const [job] = await db
      .insert(ttsJobs)
      .values({
        userId: request.user.sub,
        voiceId,
        inputText: text,
        metadata: { outputFormat },
      })
      .returning({
        id: ttsJobs.id,
        status: ttsJobs.status,
        type: ttsJobs.type,
        voiceId: ttsJobs.voiceId,
        createdAt: ttsJobs.createdAt,
      })

    // Publish to RabbitMQ
    await publishJob({
      jobId: job.id,
      voiceId,
      text,
      outputFormat,
    })

    return reply.status(202).send({ success: true, data: { job } })
  })

  // GET /tts/:jobId — Check job status
  app.get('/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    const db = getDb()

    const job = await db.query.ttsJobs.findFirst({
      where: and(eq(ttsJobs.id, jobId), eq(ttsJobs.userId, request.user.sub)),
    })

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Job not found' },
      })
    }

    // If completed, include audio file + download URL
    let audioFile = null
    let downloadUrl = null

    if (job.status === 'completed' && job.outputFileId) {
      audioFile = await db.query.audioFiles.findFirst({
        where: eq(audioFiles.id, job.outputFileId),
      })

      if (audioFile) {
        downloadUrl = await getPresignedUrl(audioFile.storagePath)
      }
    }

    return reply.status(200).send({
      success: true,
      data: { job, audioFile, downloadUrl },
    })
  })

  // GET /tts — List user's jobs
  app.get('/', async (request, reply) => {
    const { limit = '20', page = '1' } = request.query as { limit?: string; page?: string }
    const take = Math.min(Number(limit) || 20, 100)
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take

    const db = getDb()

    const jobs = await db
      .select({
        id: ttsJobs.id,
        status: ttsJobs.status,
        type: ttsJobs.type,
        voiceId: ttsJobs.voiceId,
        inputText: ttsJobs.inputText,
        error: ttsJobs.error,
        createdAt: ttsJobs.createdAt,
        updatedAt: ttsJobs.updatedAt,
      })
      .from(ttsJobs)
      .where(eq(ttsJobs.userId, request.user.sub))
      .orderBy(desc(ttsJobs.createdAt))
      .limit(take)
      .offset(skip)

    return reply.status(200).send({ success: true, data: { jobs } })
  })
}
