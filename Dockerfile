# --- Stage 1: Build ---
FROM node:22-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src/ ./src/

# Build the application
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:22-slim

WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled gateway and shared code from builder
COPY --from=builder /app/dist/gateway ./dist/gateway
COPY --from=builder /app/dist/shared ./dist/shared

# Copy runtime configuration and supergraph
COPY config/ ./config/
COPY src/mesh/gen/ ./src/mesh/gen/

EXPOSE 4000

CMD ["node", "dist/gateway/index.js"]
