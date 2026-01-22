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
  isMetrics,
  handleMetrics,
} from './handlers'

export const createGatewayServer = () => {
  return createServer(async (req, res) => {
    const url = parseUrl(req.url!, req.headers.host!)
    const { pathname } = url

    const logMessage = `${req.method} ${pathname}`

    // GraphQL endpoints (root and scoped)
    if (isGraphQLEndpoint(pathname)) {
      log.info(logMessage)
      return handleGraphQL(req, res)
    }

    // Health check endpoints (liveness) - don't log these to avoid noise
    if (isHealthCheck(pathname)) {
      log.debug(logMessage)
      return handleHealthCheck(req, res)
    }

    // Readiness endpoint - don't log these to avoid noise
    if (isReadinessCheck(pathname)) {
      log.debug(logMessage)
      return handleReadinessCheck(req, res)
    }

    // Metrics endpoint
    if (isMetrics(pathname)) {
      log.info(logMessage)
      return handleMetrics(req, res)
    }

    // 404 for everything else
    log.warn(`Not found: ${pathname}`)
    sendJson(res, 404, {
      error: 'Not Found',
      availableEndpoints,
    })
  })
}
