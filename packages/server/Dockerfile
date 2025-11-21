# Multi-stage build for NestJS server using Bun
FROM node:20-alpine AS builder
WORKDIR /app

# Install curl and bash to run Bun installer
RUN apk add --no-cache curl bash ca-certificates

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

# Copy package manifest and lockfile for caching
COPY package.json bun.lock* ./

# Install deps and build
RUN bun install
COPY . .
RUN bun run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
