import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { jwtPlugin } from './plugins/jwt'

import { voiceRoutes } from './routes/voices'
import { libraryRoutes } from './routes/library'
import { sampleRoutes } from './routes/samples'

const PORT = Number(process.env.VOICE_SERVICE_PORT) || 3002
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  // Plugins
  await app.register(cors, { origin: process.env.CORS_ORIGIN || '*' })
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } })
  await app.register(jwtPlugin)

  // Health check
  app.get('/health', async () => ({ status: 'ok', service: 'voice' }))

  // Routes
  await app.register(voiceRoutes, { prefix: '/voices' })
  await app.register(libraryRoutes, { prefix: '/library' })
  await app.register(sampleRoutes, { prefix: '/voices/:voiceId/samples' })

  await app.listen({ port: PORT, host: HOST })
}

main().catch((err) => {
  console.error('Failed to start voice service:', err)
  process.exit(1)
})
