#!/bin/bash

# Deploy Amplify Backend with Renewable Energy Features Enabled
# This script exports environment variables and deploys the backend

set -e

echo "🚀 Deploying Amplify Backend with Renewable Energy Features"
echo "============================================================"
echo ""

# Export environment variables for Amplify deployment
export NEXT_PUBLIC_RENEWABLE_ENABLED=true
export NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT="arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o"
export NEXT_PUBLIC_RENEWABLE_S3_BUCKET="renewable-energy-artifacts-484907533441"
export NEXT_PUBLIC_RENEWABLE_REGION="us-east-1"
export NEXT_PUBLIC_RENEWABLE_AWS_REGION="us-west-2"

echo "✅ Environment variables set:"
echo "   NEXT_PUBLIC_RENEWABLE_ENABLED=$NEXT_PUBLIC_RENEWABLE_ENABLED"
echo "   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT"
echo "   NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$NEXT_PUBLIC_RENEWABLE_S3_BUCKET"
echo "   NEXT_PUBLIC_RENEWABLE_REGION=$NEXT_PUBLIC_RENEWABLE_REGION"
echo ""

echo "📦 Deploying Amplify backend..."
echo ""

npx ampx sandbox --once

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Restart your dev server: npm run dev"
echo "   2. Test renewable queries in chat"
echo ""
