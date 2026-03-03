import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { jwtPlugin } from './plugins/jwt'
import { ttsRoutes } from './routes/tts'
import { consumeJobs, closeQueue } from './lib/queue'
import { processJob } from './lib/processor'

const PORT = Number(process.env.WORKER_SERVICE_PORT) || 3003
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  })

  // Plugins
  await app.register(cors, { origin: process.env.CORS_ORIGIN || '*' })
  await app.register(jwtPlugin)

  // Health check
  app.get('/health', async () => ({ status: 'ok', service: 'worker' }))

  // Routes
  await app.register(ttsRoutes, { prefix: '/tts' })

  // Start HTTP server
  await app.listen({ port: PORT, host: HOST })

  // Start consuming jobs from RabbitMQ
  await consumeJobs(processJob)

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[worker] Shutting down...')
    await closeQueue()
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error('Failed to start worker service:', err)
  process.exit(1)
})
