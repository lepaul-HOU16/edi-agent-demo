#!/bin/bash

# Deploy Amplify with Renewable Energy Environment Variables
# This script ensures environment variables are properly loaded before deployment

echo "🔧 Setting up renewable energy environment variables..."

# Export environment variables from .env.local
export NEXT_PUBLIC_RENEWABLE_ENABLED=true
export NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT="arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o"
export NEXT_PUBLIC_RENEWABLE_S3_BUCKET="renewable-energy-artifacts-484907533441"
export NEXT_PUBLIC_RENEWABLE_REGION="us-east-1"
export NEXT_PUBLIC_RENEWABLE_AWS_REGION="us-west-2"

echo "✅ Environment variables set:"
echo "   NEXT_PUBLIC_RENEWABLE_ENABLED=$NEXT_PUBLIC_RENEWABLE_ENABLED"
echo "   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT"
echo "   NEXT_PUBLIC_RENEWABLE_S3_BUCKET=$NEXT_PUBLIC_RENEWABLE_S3_BUCKET"
echo ""

echo "🚀 Deploying Amplify backend..."
npx ampx sandbox

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 To verify, check Lambda environment variables:"
echo "   aws lambda get-function-configuration \\"
echo "     --function-name \$(aws lambda list-functions --query 'Functions[?contains(FunctionName, \`lightweightAgent\`)].FunctionName' --output text | awk '{print \$NF}') \\"
echo "     --query 'Environment.Variables.NEXT_PUBLIC_RENEWABLE_ENABLED'"
