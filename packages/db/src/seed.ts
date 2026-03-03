import { config } from 'dotenv'
config({ path: '../../.env' })

import { and, eq, isNull } from 'drizzle-orm'
import { getDb } from './client.js'
import { voices } from './schema/voices.js'

async function main() {
  const db = getDb()

  console.log('Seeding database...')

  // Idempotent seed: replace public premade voices so reruns stay clean.
  await db.delete(voices).where(and(eq(voices.category, 'premade'), isNull(voices.userId)))

  await db.insert(voices).values([
    {
      name: 'Heart',
      description: 'A warm, expressive American female voice',
      category: 'premade',
      language: 'en',
      gender: 'female',
      accent: 'american',
      isPublic: true,
      metadata: { engine: 'kokoro', kokoroVoice: 'af_heart' },
    },
    {
      name: 'Bella',
      description: 'A smooth, friendly American female voice',
      category: 'premade',
      language: 'en',
      gender: 'female',
      accent: 'american',
      isPublic: true,
      metadata: { engine: 'kokoro', kokoroVoice: 'af_bella' },
    },
    {
      name: 'Adam',
      description: 'A deep, confident American male voice',
      category: 'premade',
      language: 'en',
      gender: 'male',
      accent: 'american',
      isPublic: true,
      metadata: { engine: 'kokoro', kokoroVoice: 'am_adam' },
    },
    {
      name: 'Alice',
      description: 'A refined, elegant British female voice',
      category: 'premade',
      language: 'en',
      gender: 'female',
      accent: 'british',
      isPublic: true,
      metadata: { engine: 'kokoro', kokoroVoice: 'bf_alice' },
    },
    {
      name: 'George',
      description: 'A classic, distinguished British male voice',
      category: 'premade',
      language: 'en',
      gender: 'male',
      accent: 'british',
      isPublic: true,
      metadata: { engine: 'kokoro', kokoroVoice: 'bm_george' },
    },
  ])

  console.log('Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
