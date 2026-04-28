import Bowser from 'bowser'

export type ParsedUserAgent = {
  browser: string | null
  os: string | null
  formatted: string
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const parser = Bowser.getParser(userAgent)
  const browser = parser.getBrowser().name ?? null
  const os = parser.getOS().name ?? null

  let formatted = 'Unknown'
  if (browser && os) {
    formatted = `${browser} (${os})`
  } else if (browser) {
    formatted = browser
  } else if (os) {
    formatted = os
  }

  return { browser, os, formatted }
}
