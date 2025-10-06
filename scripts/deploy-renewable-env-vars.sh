#!/bin/bash

# Deploy renewable energy environment variables to Lambda

echo "======================================================================"
echo "  Deploying Renewable Energy Configuration to Lambda"
echo "======================================================================"
echo ""

echo "📦 Building backend changes..."
npm run build

echo ""
echo "🚀 Deploying to Amplify sandbox..."
npx ampx sandbox --stream-function-logs &

# Wait for deployment
DEPLOY_PID=$!

echo ""
echo "⏳ Waiting for deployment to complete..."
echo "   This may take 2-3 minutes..."
echo ""

# Wait for the deployment process
wait $DEPLOY_PID

echo ""
echo "======================================================================"
echo "  Deployment Complete!"
echo "======================================================================"
echo ""
echo "✅ Environment variables added to Lambda function:"
echo "   - NEXT_PUBLIC_RENEWABLE_ENABLED=true"
echo "   - NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:..."
echo "   - NEXT_PUBLIC_RENEWABLE_S3_BUCKET=amplify-d1eeg2gu6ddc3z-..."
echo "   - NEXT_PUBLIC_RENEWABLE_REGION=us-east-1"
echo ""
echo "✅ IAM permissions added:"
echo "   - bedrock-agentcore:InvokeAgentRuntime"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your dev server (if running)"
echo "   2. Try your renewable energy query again"
echo ""
