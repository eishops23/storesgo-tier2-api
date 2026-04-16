#!/bin/bash
# start.sh - Load .env and start PM2

# Stop any running instances
pm2 delete storesgo-api 2>/dev/null || true

# Load environment variables
set -a
source .env
set +a

# Verify DATABASE_URL is loaded
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in .env"
  exit 1
fi

echo "✅ Environment variables loaded"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..." # Show first 30 chars only

# Start PM2
pm2 start ecosystem.config.cjs --env production

echo "✅ PM2 started"
pm2 status