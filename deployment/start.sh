#!/bin/bash
set -e

echo "Starting honestly-insight-hub container..."

# Copy nginx config to sites-available
cp /app/deployment/nginx.conf /etc/nginx/sites-available/default

# Start the Bun server on port 3001 in background
echo "Starting Bun server on port 3001..."
cd /app && INTERNAL_PORT=3001 bun run apps/server/src/index.ts &

# Wait for server to be ready
echo "Waiting for Bun server to start..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Bun server is ready!"
    break
  fi
  echo "Waiting for server... ($i/30)"
  sleep 1
done

# Start nginx on port 8080 in foreground
echo "Starting nginx on port 8080..."
nginx -g "daemon off;"