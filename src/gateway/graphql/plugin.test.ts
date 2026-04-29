import { describe, expect, it } from 'vitest'
import { parse } from 'graphql'
import { isLocallyExecutable } from './plugin'

describe('isLocallyExecutable', () => {
  it('matches a query made entirely of local fields', () => {
    const doc = parse(/* GraphQL */ `
      query {
        parseUserAgent(userAgent: "x") {
          formatted
        }
        geolocateIP(ip: "1.2.3.4") {
          formatted
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(true)
  })

  it('matches a mutation made entirely of local fields', () => {
    const doc = parse(/* GraphQL */ `
      mutation {
        deleteSession(id: "sess-1")
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(true)
  })

  it('matches a pure-introspection schema query (codegen)', () => {
    const doc = parse(/* GraphQL */ `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
          }
          mutationType {
            name
          }
          types {
            name
          }
        }
      }
    `)
    expect(isLocallyExecutable(doc, 'IntrospectionQuery')).toBe(true)
  })

  it('matches a __type introspection query', () => {
    const doc = parse(/* GraphQL */ `
      query {
        __type(name: "ExtendedSession") {
          name
          fields {
            name
          }
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(true)
  })

  it('matches an operation that mixes local fields and introspection meta-fields', () => {
    const doc = parse(/* GraphQL */ `
      query {
        __typename
        sessions {
          id
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(true)
  })

  it('rejects an operation that mixes local and federated fields', () => {
    const doc = parse(/* GraphQL */ `
      query {
        sessions {
          id
        }
        listResourcemanagerMiloapisComV1alpha1OrganizationMembershipForAllNamespaces {
          metadata {
            continue
          }
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(false)
  })

  it('rejects a federated-only query', () => {
    const doc = parse(/* GraphQL */ `
      query {
        listResourcemanagerMiloapisComV1alpha1OrganizationMembershipForAllNamespaces {
          metadata {
            continue
          }
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(false)
  })

  it('rejects subscriptions', () => {
    const doc = parse(/* GraphQL */ `
      subscription {
        sessions {
          id
        }
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(false)
  })

  it('rejects an operation with no top-level fields (e.g. only fragment spreads)', () => {
    const doc = parse(/* GraphQL */ `
      fragment Foo on Query {
        sessions {
          id
        }
      }
      query {
        ...Foo
      }
    `)
    expect(isLocallyExecutable(doc)).toBe(false)
  })

  it('matches the named operation when multiple operations are in the document', () => {
    const doc = parse(/* GraphQL */ `
      query Local {
        sessions {
          id
        }
      }
      query Federated {
        listResourcemanagerMiloapisComV1alpha1OrganizationMembershipForAllNamespaces {
          metadata {
            continue
          }
        }
      }
    `)
    expect(isLocallyExecutable(doc, 'Local')).toBe(true)
    expect(isLocallyExecutable(doc, 'Federated')).toBe(false)
  })
})
