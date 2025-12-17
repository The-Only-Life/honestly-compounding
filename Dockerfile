# Multi-stage Dockerfile for building a Vite (React + TS) app and serving with nginx

# Stage 1 - build using Bun
FROM oven/bun:1.1 AS builder
WORKDIR /app

# Copy lockfile and package json for caching
COPY package.json .
COPY bun.lockb .

# Install dependencies with Bun
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Stage 2 - serve with nginx
FROM nginx:stable-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
