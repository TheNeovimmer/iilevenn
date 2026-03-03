import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb, ttsJobs, audioFiles, voices } from '@iilevenn/db'
import { uploadFile } from './storage'
import { synthesizeSpeech } from './tts-client'

interface JobMessage {
  jobId: string
  voiceId: string
  text: string
  outputFormat: string
}

export async function processJob(message: Record<string, unknown>) {
  const { jobId, voiceId, text, outputFormat } = message as unknown as JobMessage
  const db = getDb()

  // 1. Mark job as processing
  await db
    .update(ttsJobs)
    .set({ status: 'processing', updatedAt: new Date() })
    .where(eq(ttsJobs.id, jobId))

  try {
    console.log(`[processor] Processing job ${jobId}: "${text.slice(0, 50)}..."`)

    // 2. Look up voice metadata to get the Kokoro voice ID
    const voice = await db.query.voices.findFirst({
      where: eq(voices.id, voiceId),
    })

    const kokoroVoice =
      ((voice?.metadata as Record<string, unknown>)?.kokoroVoice as string) || 'af_heart'

    // 3. Call the real TTS service
    const result = await synthesizeSpeech({
      text,
      voice_id: kokoroVoice,
      language: voice?.language || 'en',
      output_format: outputFormat || 'wav',
    })

    const mimeType = outputFormat === 'wav' ? 'audio/wav' : 'audio/mpeg'
    const ext = outputFormat === 'wav' ? 'wav' : 'mp3'
    const fileName = `tts-${jobId.slice(0, 8)}.${ext}`
    const storagePath = `tts/${voiceId}/${randomUUID()}-${fileName}`

    // 3. Upload to MinIO
    await uploadFile(storagePath, result.audioBuffer, mimeType)

    // 4. Create audio file record
    const [audioFile] = await db
      .insert(audioFiles)
      .values({
        jobId,
        fileName,
        mimeType,
        sizeBytes: result.audioBuffer.length,
        durationMs: result.durationMs,
        storagePath,
      })
      .returning()

    // 5. Mark job as completed
    await db
      .update(ttsJobs)
      .set({
        status: 'completed',
        outputFileId: audioFile.id,
        updatedAt: new Date(),
      })
      .where(eq(ttsJobs.id, jobId))

    console.log(`[processor] Job ${jobId} completed (${result.durationMs}ms audio)`)
  } catch (err) {
    // Mark job as failed
    await db
      .update(ttsJobs)
      .set({
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(ttsJobs.id, jobId))

    console.error(`[processor] Job ${jobId} failed:`, err)
    throw err // Re-throw so the queue handler nacks the message
  }
}
