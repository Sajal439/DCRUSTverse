# ==============================================================================
# Base stage: Node.js 26 on Alpine Linux
# ==============================================================================
FROM node:26-alpine AS base

WORKDIR /app

# Install standard libraries needed for native modules and postgres clients
RUN apk add --no-cache libc6-compat curl

# ==============================================================================
# Dependencies stage: Install npm packages
# ==============================================================================
FROM base AS dependencies

COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Test stage: Source code and tests for local/CI test runs
# ==============================================================================
FROM dependencies AS test

COPY tsconfig.json tsconfig.typecheck.json drizzle.config.ts ./
COPY src ./src
COPY test ./test
COPY drizzle ./drizzle

# Default command runs the entire test suite
CMD ["npm", "test"]

# ==============================================================================
# Build stage: Compile TypeScript to JavaScript in dist/
# ==============================================================================
FROM test AS build

RUN npm run build
RUN npm prune --omit=dev

# ==============================================================================
# Production stage: Minimal runtime image
# ==============================================================================
FROM base AS production

ENV NODE_ENV=production

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

USER node
EXPOSE 4000

CMD ["npm", "start"]
