import { defineConfig } from '@graphql-mesh/compose-cli'
import { loadOpenAPISubgraph } from '@omnigraph/openapi'
import { readFileSync } from 'node:fs';
import yaml from 'yaml';

// read apis.yaml
type ApiEntry = { group: string; version: string }
const apis = yaml.parse(readFileSync('./config/apis.yaml', 'utf8')) as ApiEntry[]

const baseUrl = process.env.DATUM_BASE_URL

export const composeConfig = defineConfig({
  subgraphs: apis.map(({ group, version }) => ({
    sourceHandler: loadOpenAPISubgraph(
      // subgraph name e.g. IAM_V1ALPHA1
      `${group.split('.')[0].toUpperCase()}_${version.toUpperCase()}`,
      {
        source: `${baseUrl}/openapi/v3/apis/${group}/${version}`,
        endpoint: baseUrl,
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
