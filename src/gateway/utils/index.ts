import type { ServerResponse } from 'node:http'

export const sendJson = (res: ServerResponse, status: number, body: object): void => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

export const parseUrl = (url: string, host: string): URL => {
  return new URL(url, `http://${host}`)
}
