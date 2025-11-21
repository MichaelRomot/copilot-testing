# Multi-stage build for the Vite React client using Bun
FROM oven/bun:1.3.2 AS builder
WORKDIR /app

# Copy lockfile and package manifest first for caching
COPY package.json bun.lock* ./

# Install dependencies and build
RUN bun install
COPY . .
RUN bun run build

FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
