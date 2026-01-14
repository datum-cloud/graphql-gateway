import { createServer } from 'node:http'
import { sendJson, parseUrl } from './utils/'
import { availableEndpoints } from './config'
import { log } from '@/shared/utils'
import {
  isHealthCheck,
  handleHealthCheck,
  isReadinessCheck,
  handleReadinessCheck,
  isGraphQLEndpoint,
  handleGraphQL,
} from './handlers'

export const createGatewayServer = () => {
  return createServer(async (req, res) => {
    const url = parseUrl(req.url!, req.headers.host!)
    const { pathname } = url

    // Log incoming request (debug level to avoid noise)
    log.info(`${req.method} ${pathname}`)

    // GraphQL endpoints (root and scoped)
    if (isGraphQLEndpoint(pathname)) {
      return handleGraphQL(req, res)
    }

    // Health check endpoints (liveness) - don't log these to avoid noise
    if (isHealthCheck(pathname)) {
      return handleHealthCheck(req, res)
    }

    // Readiness endpoint - don't log these to avoid noise
    if (isReadinessCheck(pathname)) {
      return handleReadinessCheck(req, res)
    }

    // 404 for everything else
    log.warn(`Not found: ${pathname}`)
    sendJson(res, 404, {
      error: 'Not Found',
      availableEndpoints,
    })
  })
}
