#!/bin/bash

# Deploy and Test Terrain Fix
# This script deploys the terrain Lambda fixes and tests them

set -e

echo "🚀 Deploying Terrain Lambda Fixes..."
echo ""

# Deploy using Amplify sandbox
echo "📦 Starting Amplify deployment..."
npx ampx sandbox --once &
DEPLOY_PID=$!

# Wait for deployment (max 5 minutes)
echo "⏳ Waiting for deployment to complete..."
sleep 300

# Check if deployment process is still running
if ps -p $DEPLOY_PID > /dev/null; then
    echo "⚠️  Deployment still in progress after 5 minutes"
    echo "   You can check status with: npx ampx sandbox"
else
    echo "✅ Deployment process completed"
fi

echo ""
echo "🧪 Testing Terrain Lambda..."
echo ""

# Test the terrain Lambda directly
node scripts/test-terrain-lambda.js

echo ""
echo "✅ Deployment and testing complete!"
echo ""
echo "Next steps:"
echo "1. Check CloudWatch logs for any errors"
echo "2. Test in the UI at http://localhost:3000/chat"
echo "3. Try query: 'Analyze terrain for wind farm at 35.067482, -101.395466'"
