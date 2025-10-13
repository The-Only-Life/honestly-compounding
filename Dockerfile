# Use the official Bun image
FROM oven/bun:1.2 as base

# Set the working directory
WORKDIR /app

# Copy package.json files  
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY libs/db/package.json ./libs/db/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

# Reinstall with container-specific binaries  
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN cd libs/db && bun run generate

# Build the web application
WORKDIR /app/apps/web
RUN bun run build

WORKDIR /app

# Production stage
FROM oven/bun:1.2-slim as production

# Install nginx and curl for serving the web app
RUN apt-get update && apt-get install -y nginx curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built web application
COPY --from=base /app/apps/web/dist ./web

# Copy server source code (Bun runs TypeScript directly)
COPY --from=base /app/apps/server ./apps/server

# Copy necessary files
COPY --from=base /app/libs/db/src/generated ./libs/db/src/generated
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/deployment ./deployment

# Copy startup script and make it executable
COPY --from=base /app/deployment/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose port 8080 for Railway
EXPOSE 8080

# Start both services
CMD ["/app/start.sh"]