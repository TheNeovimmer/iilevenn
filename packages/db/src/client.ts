import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb(databaseUrl?: string) {
  if (!db) {
    const url = databaseUrl ?? process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is required')
    }
    const client = postgres(url)
    db = drizzle(client, { schema })
  }
  return db
}
