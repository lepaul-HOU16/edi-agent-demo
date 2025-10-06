#!/bin/bash

echo "🚀 Deploying Renewable Energy Lambda Functions"
echo "=============================================="
echo ""

echo "📋 Step 1: Checking current deployment status..."
echo ""

# Check if functions exist
if command -v aws &> /dev/null; then
    echo "Checking existing Lambda functions:"
    ./scripts/check-renewable-lambdas.sh
    echo ""
else
    echo "⚠️  AWS CLI not found - skipping pre-deployment check"
    echo ""
fi

echo "📦 Step 2: Deploying with Amplify..."
echo ""
echo "This will deploy:"
echo "  - renewableOrchestrator (TypeScript)"
echo "  - renewableTerrainTool (Python)"
echo "  - renewableLayoutTool (Python)"
echo "  - renewableSimulationTool (Python)"
echo "  - renewableReportTool (Python)"
echo ""

# Deploy with Amplify (single deployment)
npx ampx sandbox --once

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Step 3: Verifying deployment..."
echo ""

if command -v aws &> /dev/null; then
    ./scripts/check-renewable-lambdas.sh
    echo ""
    echo "🧪 Step 4: Testing orchestrator..."
    echo ""
    
    aws lambda invoke \
      --function-name renewableOrchestrator \
      --payload '{"query":"Analyze terrain at 35.067482, -101.395466","userId":"test","sessionId":"test"}' \
      response.json
    
    echo ""
    echo "Response:"
    cat response.json | jq .
    rm response.json
    
    echo ""
    echo "✅ All done! Test in chat UI:"
    echo "   'Analyze terrain for wind farm at 35.067482, -101.395466'"
else
    echo "⚠️  AWS CLI not found - skipping post-deployment verification"
    echo ""
    echo "✅ Deployment complete! Test in chat UI:"
    echo "   'Analyze terrain for wind farm at 35.067482, -101.395466'"
fi
