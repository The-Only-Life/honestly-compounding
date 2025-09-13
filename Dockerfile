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

# Copy server dependencies
COPY --from=base /app/apps/server/package.json ./apps/server/

# Create nginx configuration
RUN echo 'server { \
    listen 3000; \
    root /app/web; \
    index index.html; \
    try_files $uri $uri/ /index.html; \
    \
    # Proxy API requests to the Bun server \
    location /api/ { \
        proxy_pass http://localhost:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    \
    # Health check endpoint \
    location /health { \
        proxy_pass http://localhost:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/sites-available/default

# Create startup script
RUN printf '#!/bin/bash\nset -e\n\n# Start the Bun server in the background\ncd /app && bun run server/index.js &\n\n# Wait a moment for the server to start\nsleep 2\n\n# Start nginx in the foreground\nnginx -g "daemon off;"\n' > /app/start.sh && chmod +x /app/start.sh

# Expose port 3000 (web app with API proxy)
EXPOSE 3000

# Start both services
CMD ["/app/start.sh"]