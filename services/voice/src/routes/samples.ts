import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { getDb, voices, voiceSamples } from '@iilevenn/db'
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/storage'

const ALLOWED_MIME_TYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/ogg', // .ogg
  'audio/flac', // .flac
  'audio/mp4', // .m4a
  'audio/webm', // .webm
]

async function verifyOwnership(voiceId: string, userId: string) {
  const db = getDb()
  return db.query.voices.findFirst({
    where: and(eq(voices.id, voiceId), eq(voices.userId, userId)),
  })
}

export async function sampleRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook('onRequest', app.authenticate)

  // POST /voices/:voiceId/samples — Upload a voice sample
  app.post('/', async (request, reply) => {
    const { voiceId } = request.params as { voiceId: string }

    // 1. Verify voice ownership
    const voice = await verifyOwnership(voiceId, request.user.sub)
    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    // 2. Get the uploaded file
    const file = await request.file()
    if (!file) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      })
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
      })
    }

    // 4. Read file into buffer
    const buffer = await file.toBuffer()

    // 5. Upload to MinIO
    const storagePath = `voices/${voiceId}/${randomUUID()}-${file.filename}`
    await uploadFile(storagePath, buffer, file.mimetype)

    // 6. Save metadata to DB
    const db = getDb()
    const [sample] = await db
      .insert(voiceSamples)
      .values({
        voiceId,
        fileName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: buffer.length,
        storagePath,
      })
      .returning()

    return reply.status(201).send({ success: true, data: { sample } })
  })

  // GET /voices/:voiceId/samples — List all samples for a voice
  app.get('/', async (request, reply) => {
    const { voiceId } = request.params as { voiceId: string }

    const voice = await verifyOwnership(voiceId, request.user.sub)
    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    const db = getDb()
    const samples = await db.select().from(voiceSamples).where(eq(voiceSamples.voiceId, voiceId))

    return reply.status(200).send({ success: true, data: { samples } })
  })

  // GET /voices/:voiceId/samples/:sampleId — Get sample with presigned download URL
  app.get('/:sampleId', async (request, reply) => {
    const { voiceId, sampleId } = request.params as { voiceId: string; sampleId: string }

    const voice = await verifyOwnership(voiceId, request.user.sub)
    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    const db = getDb()
    const sample = await db.query.voiceSamples.findFirst({
      where: and(eq(voiceSamples.id, sampleId), eq(voiceSamples.voiceId, voiceId)),
    })

    if (!sample) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sample not found' },
      })
    }

    const downloadUrl = await getPresignedUrl(sample.storagePath)

    return reply.status(200).send({
      success: true,
      data: { sample, downloadUrl },
    })
  })

  // DELETE /voices/:voiceId/samples/:sampleId — Delete a sample
  app.delete('/:sampleId', async (request, reply) => {
    const { voiceId, sampleId } = request.params as { voiceId: string; sampleId: string }

    const voice = await verifyOwnership(voiceId, request.user.sub)
    if (!voice) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Voice not found' },
      })
    }

    const db = getDb()
    const sample = await db.query.voiceSamples.findFirst({
      where: and(eq(voiceSamples.id, sampleId), eq(voiceSamples.voiceId, voiceId)),
    })

    if (!sample) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Sample not found' },
      })
    }

    // Delete from MinIO first, then DB
    await deleteFile(sample.storagePath)
    await db.delete(voiceSamples).where(eq(voiceSamples.id, sampleId))

    return reply.status(200).send({
      success: true,
      data: { message: 'Sample deleted' },
    })
  })
}
