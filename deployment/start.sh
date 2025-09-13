#!/bin/bash
set -e

# Use Railway PORT or default to 8080
PORT=${PORT:-8080}
echo "Starting on port $PORT"

# Create nginx config using sed to replace only the port placeholder
sed "s/PORT_PLACEHOLDER/$PORT/g" /app/deployment/nginx.conf.template > /etc/nginx/sites-available/default

# Debug: show the generated config
echo "Generated nginx config:"
cat /etc/nginx/sites-available/default

# Start the Bun server on fixed internal port 3001 (ensure it doesn't use PORT)
cd /app && env -u PORT INTERNAL_PORT=3001 bun run server/index.js &

# Wait for server to start
sleep 3

# Test if Bun server is responding
echo "Testing Bun server on port 3001..."

# Start nginx in foreground
echo "Starting nginx..."
nginx -g "daemon off;"