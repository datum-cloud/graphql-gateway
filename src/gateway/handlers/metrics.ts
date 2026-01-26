import type { IncomingMessage, ServerResponse } from 'node:http'
import { gateway } from '@/gateway/runtime'

const METRICS_PATHS = new Set(['/metrics'])

export const isMetrics = (pathname: string): boolean => {
  return METRICS_PATHS.has(pathname)
}

export const handleMetrics = (req: IncomingMessage, res: ServerResponse) => {
  return gateway(req, res)
}
