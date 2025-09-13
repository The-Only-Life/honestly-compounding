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

# Remove node_modules to avoid host/container binary conflicts
RUN rm -rf node_modules apps/*/node_modules libs/*/node_modules
# Reinstall with container-specific binaries  
RUN bun install --frozen-lockfile

# Generate Prisma client
RUN cd libs/db && bun run generate

# Build the applications
WORKDIR /app/apps/web
RUN bun run build

WORKDIR /app/apps/server  
RUN bun run build

WORKDIR /app

# Production stage
FROM oven/bun:1.2-slim as production

# Install nginx for serving the web app
RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built applications
COPY --from=base /app/apps/web/dist ./web
COPY --from=base /app/apps/server/dist ./server
COPY --from=base /app/libs/db/src/generated ./libs/db/src/generated
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./

# Copy server dependencies and deployment files
COPY --from=base /app/apps/server/package.json ./apps/server/
COPY --from=base /app/deployment ./deployment

# Copy startup script and make it executable
COPY --from=base /app/deployment/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Don't expose a specific port - let Railway handle it
# EXPOSE is removed so Railway can assign whatever port it wants

# Start both services
CMD ["/app/start.sh"]