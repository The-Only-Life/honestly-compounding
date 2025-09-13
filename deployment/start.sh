#!/bin/bash
set -e

# Use Railway PORT or default to 8080
PORT=${PORT:-8080}
echo "Starting on port $PORT"

# Install envsubst for environment variable substitution
apt-get update && apt-get install -y gettext-base && rm -rf /var/lib/apt/lists/*

# Create nginx config with PORT substitution
envsubst < /app/deployment/nginx.conf.template > /etc/nginx/sites-available/default

# Start the Bun server on fixed internal port 3001
cd /app && INTERNAL_PORT=3001 bun run server/index.js &

# Wait for server to start
sleep 3

# Start nginx in foreground
nginx -g "daemon off;"