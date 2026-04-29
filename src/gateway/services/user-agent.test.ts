import { describe, expect, it } from 'vitest'
import { parseUserAgent } from './user-agent'

describe('parseUserAgent', () => {
  it('extracts browser and OS from a Chrome on macOS user agent', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.browser).toBe('Chrome')
    expect(result.os).toBe('macOS')
    expect(result.formatted).toBe('Chrome (macOS)')
  })

  it('extracts browser and OS from Firefox on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    const result = parseUserAgent(ua)
    expect(result.browser).toBe('Firefox')
    expect(result.os).toBe('Windows')
    expect(result.formatted).toBe('Firefox (Windows)')
  })

  it('handles an empty string without throwing', () => {
    const result = parseUserAgent('')
    expect(result.browser).toBeNull()
    expect(result.os).toBeNull()
    expect(result.formatted).toBe('Unknown')
  })

  it('extracts the OS even when the browser is generic', () => {
    const result = parseUserAgent('Mozilla/5.0 (X11; Linux x86_64)')
    expect(result.os).toBe('Linux')
    expect(result.formatted).toContain('Linux')
  })
})
