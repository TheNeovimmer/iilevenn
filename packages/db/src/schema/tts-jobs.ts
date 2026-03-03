import { pgTable, uuid, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'
import { voices } from './voices'

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed'])
export const jobTypeEnum = pgEnum('job_type', ['tts', 'clone'])

export const ttsJobs = pgTable('tts_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  voiceId: uuid('voice_id')
    .notNull()
    .references(() => voices.id),
  type: jobTypeEnum('type').notNull().default('tts'),
  status: jobStatusEnum('status').notNull().default('pending'),
  inputText: text('input_text'),
  outputFileId: uuid('output_file_id'),
  error: text('error'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
