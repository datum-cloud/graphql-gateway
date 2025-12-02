import { defineConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'yaml'
import type { ApiEntry } from '@/shared/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '../../..')

const apis = yaml.parse(
  readFileSync(resolve(ROOT_DIR, 'config/resources/apis.yaml'), 'utf8')
) as ApiEntry[]

const baseUrl = process.env.DATUM_BASE_URL

export const composeConfig = defineConfig({
  subgraphs: apis.map(({ group, version }) => ({
    sourceHandler: loadOpenAPISubgraph(
      // subgraph name e.g. IAM_V1ALPHA1
      `${group.split('.')[0].toUpperCase()}_${version.toUpperCase()}`,
      {
        source: `${baseUrl}/openapi/v3/apis/${group}/${version}`,
        // Endpoint uses X-Resource-Endpoint-Prefix header when accessing via scoped URL
        // e.g. /resourcemanager.miloapis.com/v1alpha1/organizations/{org}/graphql
        // When accessing /graphql directly, the header is empty and baseUrl is used
        endpoint: `${baseUrl}{context.headers.x-resource-endpoint-prefix}`,
        schemaHeaders: {
          Authorization: 'Bearer {env.DATUM_TOKEN}',
        },
        operationHeaders: {
          Authorization: '{context.headers.authorization}',
        },
      }
    ),
  })),
})
