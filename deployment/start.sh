#!/bin/bash
set -e

echo "Starting honestly-insight-hub container..."

# Copy nginx config to sites-available
cp /app/deployment/nginx.conf /etc/nginx/sites-available/default

# Start the Bun server on port 3001 in background
echo "Starting Bun server on port 3001..."
cd /app && INTERNAL_PORT=3001 bun run server/index.js &

# Wait for server to start
sleep 3

# Start nginx on port 8080 in foreground
echo "Starting nginx on port 8080..."
nginx -g "daemon off;"