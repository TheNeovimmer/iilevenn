import { config } from 'dotenv'
config({ path: '../../.env' })

import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required')
  }

  const client = postgres(url, { max: 1 })
  const db = drizzle(client)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations complete.')

  await client.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
