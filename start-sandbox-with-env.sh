#!/bin/bash

echo "=== Starting Amplify Sandbox with EDIcraft Environment Variables ==="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found"
    echo "Run: ./setup-edicraft-env.sh"
    exit 1
fi

echo "✅ Loading environment variables from .env.local"

# Export all variables from .env.local
set -a
source .env.local
set +a

echo "✅ Environment variables loaded"
echo ""
echo "Starting sandbox..."
echo ""

# Start the sandbox with environment variables
npx ampx sandbox
