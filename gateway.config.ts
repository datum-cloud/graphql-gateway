import { defineConfig } from '@graphql-hive/gateway'
 
export const gatewayConfig = defineConfig({
  cache: {
    type: 'localforage',
    driver: ['LOCALSTORAGE'],
    name: 'DatumGraphQLGateway',
    version: 1.0, 
    size: 4980736, 
    storeName: 'keyvaluepairs',
    description: 'Cache storage for Datum GraphQL Gateway', 
  },
  responseCaching: {
    session: request => request.headers.get('authentication'), // cache based on the authentication header
    ttl: 1000 * 60 * 2, // 2 minutes
  }
})