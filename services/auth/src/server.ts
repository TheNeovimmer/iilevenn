import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { jwtPlugin } from './plugins/jwt'

import { authRoutes } from './routes/auth'
import { apiKeyRoutes } from './routes/api-keys'

const PORT = Number(process.env.AUTH_SERVICE_PORT) || 3001
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
  app.get('/health', async () => ({ status: 'ok', service: 'auth' }))

  // Routes
  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(apiKeyRoutes, { prefix: '/api-keys' })

  await app.listen({ port: PORT, host: HOST })
}

main().catch((err) => {
  console.error('Failed to start auth service:', err)
  process.exit(1)
})
