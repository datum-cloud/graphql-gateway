import { createGatewayServer } from './server'
import { env, scopedEndpoints } from './config'
import { log } from '@/shared/utils'

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
