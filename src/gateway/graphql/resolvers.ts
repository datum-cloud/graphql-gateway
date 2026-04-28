import { parseUserAgent } from '@/gateway/services/user-agent'
import { lookupIp } from '@/gateway/services/geolocation'
import { getK8sServer } from '@/gateway/auth'
import { log } from '@/shared/utils'
import GraphQLJSON from './json-scalar'

interface ResolverContext {
  headers: Record<string, string>
}

interface UpstreamSession {
  metadata?: { name?: string }
  status?: {
    ip?: string
    userAgent?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface UpstreamSessionList {
  items?: UpstreamSession[]
}

function enrichSession(session: UpstreamSession) {
  const id = session.metadata?.name ?? 'unknown'
  const ipAddress = session.status?.ip ?? null
  const rawUserAgent = session.status?.userAgent ?? null

  return {
    id,
    ipAddress,
    userAgent: rawUserAgent ? parseUserAgent(rawUserAgent) : null,
    location: ipAddress ? lookupIp(ipAddress) : null,
    raw: session,
  }
}

export const additionalResolvers = {
  JSON: GraphQLJSON,

  Query: {
    parseUserAgent: (_root: unknown, args: { userAgent: string }) => {
      return parseUserAgent(args.userAgent)
    },

    geolocateIP: (_root: unknown, args: { ip: string }) => {
      return lookupIp(args.ip)
    },

    sessions: async (_root: unknown, _args: unknown, context: ResolverContext) => {
      try {
        const server = getK8sServer()
        const endpointPrefix = context.headers['x-resource-endpoint-prefix'] || ''
        const authorization = context.headers['authorization'] || ''

        const url = `${server}${endpointPrefix}/apis/identity.miloapis.com/v1alpha1/sessions`

        const response = await fetch(url, {
          headers: {
            Authorization: authorization,
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          log.warn('milo sessions fetch failed', { status: response.status })
          return []
        }

        const body = (await response.json()) as UpstreamSessionList
        return (body.items ?? []).map(enrichSession)
      } catch (error) {
        log.error('Sessions resolver failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        return []
      }
    },
  },
}
