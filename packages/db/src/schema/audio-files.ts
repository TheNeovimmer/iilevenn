import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { ttsJobs } from './tts-jobs'

export const audioFiles = pgTable('audio_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id')
    .notNull()
    .references(() => ttsJobs.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  durationMs: integer('duration_ms'),
  storagePath: varchar('storage_path', { length: 1024 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
