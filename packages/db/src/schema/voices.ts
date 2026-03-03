import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { users } from './users'

export const voiceCategoryEnum = pgEnum('voice_category', ['premade', 'cloned', 'custom'])
export const voiceGenderEnum = pgEnum('voice_gender', ['male', 'female', 'neutral'])

export const voices = pgTable('voices', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: voiceCategoryEnum('category').notNull().default('premade'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  gender: voiceGenderEnum('gender').notNull().default('neutral'),
  accent: varchar('accent', { length: 100 }),
  previewUrl: varchar('preview_url', { length: 1024 }),
  isPublic: boolean('is_public').notNull().default(true),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
