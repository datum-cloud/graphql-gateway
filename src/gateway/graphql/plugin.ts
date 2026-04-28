import {
  parse,
  extendSchema,
  execute as defaultExecute,
  Kind,
  type GraphQLSchema,
  type DocumentNode,
  type OperationDefinitionNode,
  type FieldNode,
} from 'graphql'
import { addResolversToSchema } from '@graphql-tools/schema'
import type { Plugin } from 'graphql-yoga'
import type { IResolvers } from '@graphql-tools/utils'
import { additionalTypeDefs } from './typeDefs'
import { additionalResolvers } from './resolvers'

/**
 * Top-level Query / Mutation field names that are resolved locally by the
 * gateway and should NOT be planned by the Hive Router.  Derived from the
 * resolver map so the two stay in sync.
 */
const resolverMap = additionalResolvers as {
  Query?: Record<string, unknown>
  Mutation?: Record<string, unknown>
}
const LOCAL_FIELDS: Readonly<Record<'query' | 'mutation', ReadonlySet<string>>> = {
  query: new Set(Object.keys(resolverMap.Query ?? {})),
  mutation: new Set(Object.keys(resolverMap.Mutation ?? {})),
}

/**
 * Returns true when every top-level selection on the operation is a local
 * gateway field.  Operations that mix local + federated fields fall back to
 * the router (which will fail – we don't currently support mixed operations).
 */
const isPurelyLocalOperation = (doc: DocumentNode, opName?: string | null): boolean => {
  const op = doc.definitions.find(
    (d): d is OperationDefinitionNode =>
      d.kind === Kind.OPERATION_DEFINITION &&
      (d.operation === 'query' || d.operation === 'mutation') &&
      (!opName || d.name?.value === opName)
  )
  if (!op) return false

  const localFields = LOCAL_FIELDS[op.operation as 'query' | 'mutation']
  if (!localFields || localFields.size === 0) return false

  const topLevelFields = op.selectionSet.selections.filter(
    (s): s is FieldNode => s.kind === Kind.FIELD
  )
  if (topLevelFields.length === 0) return false

  return topLevelFields.every((f) => localFields.has(f.name.value))
}

/**
 * Adds gateway-local fields (e.g. parseUserAgent, geolocateIP) to the unified
 * graph schema produced by the Hive Router and routes their execution to the
 * default GraphQL executor.
 *
 * Two phases:
 *
 * 1. `onSchemaChange` – extends the router's schema with our type defs +
 *    resolvers so that validation succeeds for local fields.  The Hive Router
 *    (`@graphql-hive/router-runtime`'s `unifiedGraphHandler`) ignores
 *    `additionalTypeDefs` / `additionalResolvers` on `createGatewayRuntime`
 *    config, so we have to do it ourselves here.
 *
 * 2. `onExecute` – for operations that only select local fields, swap the
 *    executor for the default `graphql.execute`.  Otherwise the router would
 *    try to plan the operation against the supergraph SDL (which knows nothing
 *    about local fields) and fail with "Field 'X' not found in type 'Query'".
 */
export const useGatewayLocalSchema = (): Plugin => {
  const ast = parse(additionalTypeDefs)
  const extended = new WeakSet<GraphQLSchema>()

  return {
    onSchemaChange({ schema, replaceSchema }) {
      if (!schema || extended.has(schema)) return

      const withTypes = extendSchema(schema, ast, {
        assumeValid: true,
        assumeValidSDL: true,
      })
      const withResolvers = addResolversToSchema({
        schema: withTypes,
        resolvers: additionalResolvers as IResolvers,
      })

      extended.add(withResolvers)
      replaceSchema(withResolvers)
    },

    onExecute({ args, setExecuteFn }) {
      if (isPurelyLocalOperation(args.document, args.operationName)) {
        setExecuteFn(defaultExecute)
      }
    },
  }
}
