# --- Runtime image: Hive Gateway ---
FROM ghcr.io/graphql-hive/gateway:2.1.19
RUN npm i @graphql-mesh/transport-rest@0.9.17
RUN npm i @graphql-hive/router-runtime@1.0.1

# Set the environment to production
ENV NODE_ENV=production

WORKDIR /gateway

# Copy generated supergraph and gateway configuration
COPY supergraph.graphql ./supergraph.graphql
COPY gateway.config.ts ./gateway.config.ts

EXPOSE 4000

CMD ["supergraph", "--hive-router-runtime"]