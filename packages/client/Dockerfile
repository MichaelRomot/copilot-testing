# Multi-stage build for the Vite React client using Bun
FROM node:20-alpine AS builder
WORKDIR /app

# Install curl and bash to run Bun installer
RUN apk add --no-cache curl bash ca-certificates

# Install Bun (install script places bun in /root/.bun)
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH

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
