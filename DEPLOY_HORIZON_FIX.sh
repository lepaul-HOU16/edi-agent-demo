#!/bin/bash
# Deploy the horizon fix to Bedrock AgentCore

echo "🚀 Deploying horizon fix to Bedrock AgentCore..."
echo ""

cd edicraft-agent

# Clear Python cache
echo "🧹 Clearing Python cache..."
rm -rf tools/__pycache__ __pycache__

# Deploy to Bedrock AgentCore
echo "📦 Deploying to Bedrock AgentCore..."
make deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test with: Build horizon surface"
