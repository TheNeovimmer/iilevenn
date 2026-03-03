import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core'
import { voices } from './voices'

export const voiceSamples = pgTable('voice_samples', {
  id: uuid('id').defaultRandom().primaryKey(),
  voiceId: uuid('voice_id')
    .notNull()
    .references(() => voices.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  durationMs: integer('duration_ms'),
  storagePath: varchar('storage_path', { length: 1024 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
