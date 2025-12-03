import { createGatewayServer } from './server'
import { env, scopedEndpoints } from './config'
import { initAuth } from './auth'
import { log } from '@/shared/utils'

// Initialize K8s authentication before starting the server
try {
  initAuth()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  log.error('Failed to initialize K8s auth', { error: message })
  process.exit(1)
}

const server = createGatewayServer()

server.listen(env.port, () => {
  log.info(`Gateway ready at http://localhost:${env.port}/graphql`)

  if (scopedEndpoints.length > 0) {
    log.info('Valid scoped endpoints:')
    for (const endpoint of scopedEndpoints) {
      log.info(`  http://localhost:${env.port}${endpoint}`)
    }
  }
})

// Graceful shutdown
const shutdown = (signal: string) => {
  log.info(`${signal} received, shutting down gracefully...`)
  server.close(() => {
    log.info('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
