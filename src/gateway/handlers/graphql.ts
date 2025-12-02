import type { IncomingMessage } from 'node:http'
import { createGatewayRuntime } from '@graphql-hive/gateway'
import { unifiedGraphHandler } from '@graphql-hive/router-runtime'
import { sendJson, parseUrl } from '@/gateway/utils'
import {
  supergraph,
  env,
  validParentResources,
  scopedEndpoints,
  SCOPED_RESOURCE_PATTERN,
} from '@/gateway/config'
import { log } from '@/shared/utils'
import type { ScopedMatch, GatewayHandler } from '@/gateway/types'

// Create the gateway runtime
const gateway = createGatewayRuntime({
  supergraph,
  logging: env.logLevel,
  unifiedGraphHandler,
})

const parseScopedMatch = (match: RegExpExecArray): ScopedMatch => {
  const [, apiGroup, version, kindPlural, resourceName] = match
  return {
    apiGroup,
    version,
    kindPlural,
    kind: kindPlural.replace(/s$/, ''), // Convert plural to singular
    resourceName,
  }
}

const setScopedHeaders = (req: IncomingMessage, scoped: ScopedMatch): void => {
  req.headers['x-resource-api-group'] = scoped.apiGroup
  req.headers['x-resource-version'] = scoped.version
  req.headers['x-resource-kind'] = scoped.kind
  req.headers['x-resource-name'] = scoped.resourceName
  req.headers['x-resource-endpoint-prefix'] =
    `/apis/${scoped.apiGroup}/${scoped.version}/${scoped.kindPlural}/${scoped.resourceName}/control-plane`
}

export const isRootGraphQL = (pathname: string): boolean => {
  return pathname === '/graphql'
}

export const isScopedGraphQL = (pathname: string): boolean => {
  return SCOPED_RESOURCE_PATTERN?.test(pathname) === true
}

export const isGraphQLEndpoint = (pathname: string): boolean => {
  return isRootGraphQL(pathname) || isScopedGraphQL(pathname)
}

export const handleGraphQL: GatewayHandler = async (req, res) => {
  const url = parseUrl(req.url!, req.headers.host!)
  const scopedMatch = SCOPED_RESOURCE_PATTERN?.exec(url.pathname)

  if (scopedMatch) {
    const scoped = parseScopedMatch(scopedMatch)
    const lookupKey = `${scoped.apiGroup}/${scoped.version}/${scoped.kind}`

    if (!validParentResources.has(lookupKey)) {
      log.warn(`Invalid parent resource: ${lookupKey}`)
      return sendJson(res, 404, {
        error: 'Invalid parent resource',
        message: `No APIs are scoped to ${lookupKey}`,
        validEndpoints: scopedEndpoints,
      })
    }

    log.info(`Scoped request: ${scoped.kind}/${scoped.resourceName}`)
    setScopedHeaders(req, scoped)
  } else {
    // Unscoped access - ensure header is empty so endpoint resolves to baseUrl
    log.debug('Root GraphQL request')
    req.headers['x-resource-endpoint-prefix'] = ''
  }

  return gateway(req, res)
}
