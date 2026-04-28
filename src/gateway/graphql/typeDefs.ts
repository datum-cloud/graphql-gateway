export const additionalTypeDefs = /* GraphQL */ `
  type ParsedUserAgent {
    browser: String
    os: String
    formatted: String!
  }

  type GeoLocation {
    city: String
    country: String
    countryCode: String
    formatted: String!
  }

  type ExtendedSession {
    id: String!
    userUID: String!
    provider: String!
    ipAddress: String
    fingerprintID: String
    createdAt: String!
    lastUpdatedAt: String
    userAgent: ParsedUserAgent
    location: GeoLocation
  }

  extend type Query {
    parseUserAgent(userAgent: String!): ParsedUserAgent!
    geolocateIP(ip: String!): GeoLocation
    sessions: [ExtendedSession!]!
  }

  extend type Mutation {
    deleteSession(id: String!): Boolean!
  }
`
