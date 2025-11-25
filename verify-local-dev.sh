#!/bin/bash

echo "🔍 Verifying Local Development Environment"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    echo "📋 API URL: $(grep VITE_API_URL .env.local | cut -d'=' -f2)"
else
    echo "❌ .env.local NOT FOUND"
    exit 1
fi

echo ""
echo "🧪 Testing API Connectivity..."
echo ""

# Test API health endpoint
API_URL=$(grep VITE_API_URL .env.local | cut -d'=' -f2)
echo "Testing: $API_URL/api/health"
curl -s "$API_URL/api/health" | jq '.' || echo "❌ Health check failed"

echo ""
echo "🔑 Testing Authentication..."
echo ""

# Check if we can get a token (this will fail without real credentials, but shows the flow)
echo "Note: Authentication requires valid Cognito credentials"
echo "If you see 'Unauthorized' errors, you need to:"
echo "  1. Sign in to the app at https://d2hkqpgqguj4do.cloudfront.net"
echo "  2. Copy your auth token from browser DevTools"
echo "  3. Or use mock auth for local development"

echo ""
echo "📦 Checking Node Modules..."
if [ -d node_modules ]; then
    echo "✅ node_modules exists"
else
    echo "❌ node_modules NOT FOUND - run 'npm install'"
    exit 1
fi

echo ""
echo "🏗️  Checking Build Output..."
if [ -d dist ]; then
    echo "✅ dist/ exists (last build: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" dist 2>/dev/null || stat -c "%y" dist 2>/dev/null | cut -d'.' -f1))"
else
    echo "⚠️  dist/ NOT FOUND - run 'npm run build' to create production build"
fi

echo ""
echo "🚀 To start local development:"
echo "   npm run dev"
echo ""
echo "🌐 Local dev will run at: http://localhost:5173"
echo "   (Vite uses port 5173, not 3000)"
echo ""
echo "📡 API calls will go to: $API_URL"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Local dev connects to DEPLOYED backend"
echo "   - You need valid authentication (sign in first)"
echo "   - Or enable mock auth in backend"
