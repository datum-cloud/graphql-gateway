import { GraphQLError } from 'graphql'
import { parseUserAgent } from '@/gateway/services/user-agent'
import { lookupIp } from '@/gateway/services/geolocation'
import { getK8sServer } from '@/gateway/auth'
import { log } from '@/shared/utils'

/**
 * Hive Gateway runs on graphql-yoga, which exposes incoming request headers
 * via `context.request.headers` (a Web Headers instance). The federated
 * mesh-mapping resolvers in compose-worker.ts read headers via the
 * `context.headers[name]` flat-object shape provided by graphql-mesh's
 * runtime. Hand-written local resolvers see only the yoga shape, so we
 * support both and fall back to the empty string when neither is present.
 */
interface ResolverContext {
  request?: { headers?: Headers }
  headers?: Record<string, string | undefined>
}

function getHeader(context: ResolverContext, name: string): string {
  const yogaValue = context.request?.headers?.get?.(name)
  if (yogaValue) return yogaValue
  const meshValue = context.headers?.[name] ?? context.headers?.[name.toLowerCase()]
  return meshValue ?? ''
}

interface UpstreamSession {
  metadata?: {
    name?: string
    creationTimestamp?: string
  }
  status?: {
    userUID?: string
    provider?: string
    ip?: string
    fingerprintID?: string
    createdAt?: string
    lastUpdatedAt?: string
    userAgent?: string
  }
}

interface UpstreamSessionList {
  items?: UpstreamSession[]
}

function enrichSession(session: UpstreamSession) {
  const status = session.status ?? {}
  const id = session.metadata?.name ?? 'unknown'
  const ipAddress = status.ip ?? null
  const rawUserAgent = status.userAgent ?? null

  return {
    id,
    userUID: status.userUID ?? '',
    provider: status.provider ?? '',
    ipAddress,
    fingerprintID: status.fingerprintID ?? null,
    createdAt: status.createdAt ?? session.metadata?.creationTimestamp ?? '',
    lastUpdatedAt: status.lastUpdatedAt ?? null,
    userAgent: rawUserAgent ? parseUserAgent(rawUserAgent) : null,
    location: ipAddress ? lookupIp(ipAddress) : null,
  }
}

function sessionsURL(context: ResolverContext, name?: string) {
  const server = getK8sServer()
  const endpointPrefix = getHeader(context, 'x-resource-endpoint-prefix')
  const base = `${server}${endpointPrefix}/apis/identity.miloapis.com/v1alpha1/sessions`
  return name ? `${base}/${encodeURIComponent(name)}` : base
}

export const additionalResolvers = {
  Query: {
    parseUserAgent: (_root: unknown, args: { userAgent: string }) => {
      return parseUserAgent(args.userAgent)
    },

    geolocateIP: (_root: unknown, args: { ip: string }) => {
      return lookupIp(args.ip)
    },

    sessions: async (_root: unknown, _args: unknown, context: ResolverContext) => {
      try {
        const url = sessionsURL(context)
        const authorization = getHeader(context, 'authorization')

        const response = await fetch(url, {
          headers: {
            ...(authorization ? { Authorization: authorization } : {}),
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          log.warn('milo sessions fetch failed', {
            status: response.status,
            url,
            hasAuthorization: !!authorization,
          })
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

  Mutation: {
    deleteSession: async (
      _root: unknown,
      args: { id: string },
      context: ResolverContext
    ) => {
      const url = sessionsURL(context, args.id)
      const authorization = getHeader(context, 'authorization')

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          ...(authorization ? { Authorization: authorization } : {}),
          Accept: 'application/json',
        },
      })

      // 200/202/204 are success; 404 means the session is already gone, which
      // we treat as success so the mutation is idempotent for retries.
      if (response.ok || response.status === 404) {
        return true
      }

      const detail = await response.text().catch(() => '')
      log.warn('milo deleteSession failed', {
        status: response.status,
        url,
        detail,
        hasAuthorization: !!authorization,
      })
      throw new GraphQLError(`Failed to delete session: ${response.status}`, {
        extensions: { code: 'SESSION_DELETE_FAILED', status: response.status },
      })
    },
  },
}
