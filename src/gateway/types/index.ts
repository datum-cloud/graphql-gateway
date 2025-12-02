import type { ServerResponse, IncomingMessage } from 'node:http'

export type ParentResource = {
  apiGroup: string
  kind: string
  version: string
}

export type ScopedMatch = {
  apiGroup: string
  version: string
  kindPlural: string
  kind: string
  resourceName: string
}

export type RequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
) => Promise<void> | void

export type GatewayHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void
