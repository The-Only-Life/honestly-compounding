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

# Start the Bun server on fixed internal port 3001
cd /app && INTERNAL_PORT=3001 bun run server/index.js &

# Wait for server to start
sleep 3

# Start nginx in foreground
nginx -g "daemon off;"