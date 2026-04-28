import { Reader } from '@maxmind/geoip2-node'
import type ReaderModel from '@maxmind/geoip2-node/dist/src/readerModel'
import { log } from '@/shared/utils'

export type GeoLocation = {
  city: string | null
  country: string | null
  countryCode: string | null
  formatted: string
}

let reader: ReaderModel | null = null

export async function initGeolocation(dbPath: string): Promise<void> {
  reader = await Reader.open(dbPath)
  log.info('MaxMind GeoIP database loaded', { path: dbPath })
}

export function isGeolocationReady(): boolean {
  return reader !== null
}

export function lookupIp(ipAddress: string): GeoLocation | null {
  if (!reader) {
    log.warn('MaxMind reader not initialized, skipping geolocation lookup')
    return null
  }

  try {
    const result = reader.city(ipAddress)
    const city = result.city?.names?.en ?? null
    const country = result.country?.names?.en ?? null
    const countryCode = result.country?.isoCode ?? null

    let formatted = 'Unknown'
    if (city && country) {
      formatted = `${city}, ${country}`
    } else if (country) {
      formatted = country
    } else if (city) {
      formatted = city
    }

    return { city, country, countryCode, formatted }
  } catch (error) {
    log.warn('GeoIP lookup failed', {
      ipAddress,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
