FROM node:20-alpine AS builder

WORKDIR /app

ARG DATUM_TOKEN
ENV DATUM_TOKEN=$DATUM_TOKEN

ARG DATUM_BASE_URL
ENV DATUM_BASE_URL=$DATUM_BASE_URL

# Install dependencies (needed for mesh compose)
COPY package.json package-lock.json ./
RUN npm ci

# Copy composition config and API descriptions
COPY mesh.config.ts ./
COPY config/apis.yaml ./config/apis.yaml

# Generate the supergraph at build time
RUN npx mesh-compose -o supergraph.graphql

# --- Runtime image: Hive Gateway ---
FROM ghcr.io/graphql-hive/gateway:2.1.19
RUN npm i @graphql-mesh/transport-rest

# Set the environment to production
ENV NODE_ENV=production

WORKDIR /gateway

# Copy generated supergraph and gateway configuration
COPY --from=builder /app/supergraph.graphql ./supergraph.graphql
COPY gateway.config.ts ./gateway.config.ts

EXPOSE 4000

CMD ["supergraph", "--hive-router-runtime"]