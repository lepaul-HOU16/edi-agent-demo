#!/bin/bash

echo "🔧 DEPLOYING ARTIFACT PIPELINE FIX TO SANDBOX"
echo "============================================"
echo "Timestamp: $(date)"

# Step 1: Clean existing deployment artifacts
echo ""
echo "📋 STEP 1: Cleaning existing deployment artifacts"
echo "Removing cached builds and deployment artifacts..."
rm -rf .amplify 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true

# Step 2: Verify all source files have the fixes
echo ""
echo "📋 STEP 2: Verifying source files contain fixes"

echo "✅ Checking utils/amplifyUtils.ts for artifact fix..."
if grep -q "artifacts: invokeResponse.data.artifacts" utils/amplifyUtils.ts; then
    echo "  ✅ Frontend artifact fix is present"
else
    echo "  ❌ Frontend artifact fix is MISSING!"
    exit 1
fi

echo "✅ Checking enhancedStrandsAgent.ts for intent detection fixes..."
if grep -q "comprehensive_well_data_discovery" amplify/functions/agents/enhancedStrandsAgent.ts; then
    echo "  ✅ Backend intent detection fix is present"
else
    echo "  ❌ Backend intent detection fix is MISSING!"
    exit 1
fi

echo "✅ Checking petrophysicsTools.ts for comprehensive analysis tools..."
if grep -q "comprehensiveMultiWellCorrelationTool" amplify/functions/tools/petrophysicsTools.ts; then
    echo "  ✅ Comprehensive analysis tools are present"
else
    echo "  ❌ Comprehensive analysis tools are MISSING!"
    exit 1
fi

# Step 3: Clean build
echo ""
echo "📋 STEP 3: Clean build"
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix build errors before deploying."
    exit 1
else
    echo "✅ Build successful"
fi

# Step 4: Kill existing sandbox
echo ""
echo "📋 STEP 4: Cleaning up existing sandbox"
echo "Terminating existing sandbox (if any)..."
npx ampx sandbox delete --identifier agent-fix-lp --force 2>/dev/null || true

# Wait for cleanup
echo "Waiting for cleanup to complete..."
sleep 10

# Step 5: Deploy fresh sandbox
echo ""
echo "📋 STEP 5: Deploying fresh sandbox with artifact fixes"
echo "Creating new sandbox deployment..."
npx ampx sandbox --identifier artifact-pipeline-fixed --once

if [ $? -ne 0 ]; then
    echo "❌ Sandbox deployment failed!"
    exit 1
else
    echo "✅ Sandbox deployment successful"
fi

# Step 6: Validate deployment
echo ""
echo "📋 STEP 6: Validating deployment"
echo "Testing the deployed sandbox..."

# Run our validation test
echo "Running artifact pipeline validation..."
node test-artifact-pipeline-fix-validation.js

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Test preloaded prompts #1, #2, #3, #4 in your browser"
echo "2. Open browser console (F12) to check for artifact logs"
echo "3. Verify visualization components render correctly"
echo ""
echo "🔍 TROUBLESHOOTING:"
echo "If prompts still don't work, check browser console for:"
echo "- '🔍 FRONTEND: Agent artifacts received:' logs"
echo "- Any JavaScript errors or warnings"
echo "- Network tab for GraphQL mutation responses"
echo ""
echo "💡 TIP: Use 'artifact-pipeline-fixed' as your new sandbox identifier"
