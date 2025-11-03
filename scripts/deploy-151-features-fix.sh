#!/bin/bash

# Deploy 151 Features Regression Fix
# This script redeploys the Lambda functions with the updated optimization code

echo "🚀 Deploying 151 Features Regression Fix..."
echo ""

echo "📦 Step 1: Building frontend with updated validation..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"
echo ""

echo "📤 Step 2: Deploying backend Lambda functions..."
echo "   This will update the artifact optimization logic to preserve all features"
echo ""

# Deploy using Amplify sandbox or push
if command -v npx &> /dev/null; then
    echo "   Using Amplify to deploy backend..."
    npx ampx sandbox --once
    
    if [ $? -ne 0 ]; then
        echo "❌ Backend deployment failed"
        echo "   Try running: npx ampx sandbox"
        exit 1
    fi
else
    echo "⚠️  Amplify CLI not found"
    echo "   Please deploy manually:"
    echo "   1. Run: npx ampx sandbox"
    echo "   2. Or push to main branch for CI/CD deployment"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)"
echo "   2. Request a NEW terrain analysis"
echo "   3. Verify you see 100-200+ features (not 60)"
echo ""
echo "🔍 Expected results:"
echo "   ✅ 151 features preserved (not sampled to 60)"
echo "   ✅ No 'Limited terrain data' warning"
echo "   ✅ All terrain features visible on map"
echo ""
