#!/bin/bash

# Deploy Terrain Timeout Fix
# This script deploys the timeout protection changes to the terrain analysis Lambda

echo "🚀 Deploying Terrain Timeout Fix"
echo "================================"
echo ""

echo "📋 Changes being deployed:"
echo "  1. Reduced search radius (5km → 3km max)"
echo "  2. Reduced OSM query timeout (25s → 12s)"
echo "  3. Reduced HTTP timeout (30s → 15s)"
echo "  4. Reduced retry attempts (3 → 2)"
echo "  5. Reduced max features (1000 → 500)"
echo ""

echo "⚠️  This requires restarting the Amplify sandbox"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🔄 Stopping current sandbox..."
echo "   (Press Ctrl+C in the sandbox terminal)"
echo ""
echo "⏳ Waiting for you to stop the sandbox..."
echo "   Once stopped, press Enter to continue..."
read

echo ""
echo "🚀 Starting new sandbox with timeout fix..."
echo ""

# Start sandbox in background
npx ampx sandbox &
SANDBOX_PID=$!

echo "📊 Sandbox starting (PID: $SANDBOX_PID)"
echo ""
echo "⏳ Waiting for deployment to complete..."
echo "   This may take 5-10 minutes..."
echo ""

# Wait for deployment
sleep 300  # Wait 5 minutes

echo ""
echo "✅ Deployment should be complete"
echo ""
echo "🧪 Next steps:"
echo "  1. Run test: node tests/test-terrain-timeout-fix.js"
echo "  2. Try terrain analysis in the UI"
echo "  3. Monitor CloudWatch logs"
echo ""
echo "📖 See TERRAIN_TIMEOUT_FIX.md for details"
