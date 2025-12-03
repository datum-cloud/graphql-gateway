import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import yaml from 'yaml'
import { createGatewayRuntime } from '@graphql-hive/gateway'
import { unifiedGraphHandler } from '@graphql-hive/router-runtime'
import { composeSubgraphs } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'
import { env } from '@/gateway/config'
import { getK8sServer, getMTLSFetch } from '@/gateway/auth'
import { log } from '@/shared/utils'
import type { ApiEntry } from '@/shared/types'

const ROOT_DIR = resolve(__dirname, '../../..')

// Load API configuration from YAML
const apis = yaml.parse(
  readFileSync(resolve(ROOT_DIR, 'config/resources/apis.yaml'), 'utf8')
) as ApiEntry[]

/** Logger wrapper compatible with GraphQL Mesh Logger interface */
const meshLogger = {
  log: console.log.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  child: () => meshLogger,
}

/**
 * Create subgraph handlers for each API defined in the configuration.
 * Each subgraph loads its schema from the K8s API server's OpenAPI endpoint.
 */
const getSubgraphs = () => {
  const server = getK8sServer()
  const fetchFn = getMTLSFetch()

  return apis.map(({ group, version }) => ({
    sourceHandler: loadOpenAPISubgraph(
      // subgraph name e.g. IAM_V1ALPHA1
      `${group.split('.')[0].toUpperCase()}_${version.toUpperCase()}`,
      {
        source: `${server}/openapi/v3/apis/${group}/${version}`,
        endpoint: `${server}{context.headers.x-resource-endpoint-prefix}`,
        fetch: fetchFn,
        operationHeaders: {
          Authorization: '{context.headers.authorization}',
        },
      }
    ),
  }))
}

/**
 * Compose supergraph by fetching OpenAPI specs at runtime.
 * Called on startup and periodically based on pollingInterval.
 */
const composeSupergraph = async (): Promise<string> => {
  log.info('Composing supergraph from OpenAPI specs...')

  const handlers = getSubgraphs()
  const subgraphs = await Promise.all(
    handlers.map(async ({ sourceHandler }) => {
      const result = sourceHandler({
        fetch: globalThis.fetch,
        cwd: process.cwd(),
        logger: meshLogger,
      })
      const schema = await result.schema$
      return { name: result.name, schema }
    })
  )

  const result = composeSubgraphs(subgraphs)
  log.info('Supergraph composed successfully')
  return result.supergraphSdl
}

/**
 * Gateway runtime instance with dynamic supergraph composition.
 * Automatically recomposes the supergraph based on pollingInterval.
 */
export const gateway = createGatewayRuntime({
  supergraph: composeSupergraph,
  pollingInterval: env.pollingInterval,
  logging: env.logLevel,
  unifiedGraphHandler,
})
