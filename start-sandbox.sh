#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    echo "Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
else
    echo "❌ .env.local not found"
    exit 1
fi

# Start sandbox
echo "Starting Amplify sandbox..."
npx ampx sandbox
