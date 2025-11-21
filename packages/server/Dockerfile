# Multi-stage build for NestJS server using Bun
FROM oven/bun:1.3.2 AS builder
WORKDIR /app

# Copy package manifest and lockfile for caching
COPY package.json bun.lock* ./

# Install deps and build
RUN bun install
COPY . .
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
# Copy built app and node_modules from builder so runtime has dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
