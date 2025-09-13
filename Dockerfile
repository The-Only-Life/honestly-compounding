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

# Create startup script that adapts to Railway's PORT
RUN printf '#!/bin/bash\nset -e\n\n# Use Railway PORT or default to 8080\nPORT=${PORT:-8080}\necho "Starting on port $PORT"\n\n# Create nginx config dynamically based on PORT\ncat > /etc/nginx/sites-available/default << EOF\nserver {\n    listen $PORT;\n    root /app/web;\n    index index.html;\n    try_files \\$uri \\$uri/ /index.html;\n\n    # Serve static files directly\n    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {\n        expires 1y;\n        add_header Cache-Control \"public, immutable\";\n    }\n\n    # Proxy API requests to the Bun server on internal port\n    location /api/ {\n        proxy_pass http://localhost:3001;\n        proxy_http_version 1.1;\n        proxy_set_header Upgrade \\$http_upgrade;\n        proxy_set_header Connection \"upgrade\";\n        proxy_set_header Host \\$host;\n        proxy_set_header X-Real-IP \\$remote_addr;\n        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \\$scheme;\n    }\n\n    # Health check endpoint\n    location /health {\n        proxy_pass http://localhost:3001;\n        proxy_http_version 1.1;\n        proxy_set_header Host \\$host;\n        proxy_set_header X-Real-IP \\$remote_addr;\n        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto \\$scheme;\n    }\n}\nEOF\n\n# Start the Bun server on fixed internal port 3001\ncd /app && INTERNAL_PORT=3001 bun run server/index.js &\n\n# Wait for server to start\nsleep 3\n\n# Start nginx in foreground\nnginx -g "daemon off;"\n' > /app/start.sh && chmod +x /app/start.sh

# Don't expose a specific port - let Railway handle it
# EXPOSE is removed so Railway can assign whatever port it wants

# Start both services
CMD ["/app/start.sh"]