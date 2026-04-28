export const additionalTypeDefs = /* GraphQL */ `
  scalar JSON

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
    ipAddress: String
    userAgent: ParsedUserAgent
    location: GeoLocation
    raw: JSON
  }

  extend type Query {
    parseUserAgent(userAgent: String!): ParsedUserAgent!
    geolocateIP(ip: String!): GeoLocation
    sessions: [ExtendedSession!]!
  }
`
