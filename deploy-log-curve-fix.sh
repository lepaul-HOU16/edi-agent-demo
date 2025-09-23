#!/bin/bash
echo "🚀 Deploying log curve inventory fix..."

# Navigate to project root
cd "$(dirname "$0")"

# Install dependencies
echo "📦 Installing dependencies..."
cd amplify/functions/agents
npm install @aws-sdk/client-s3@^3.400.0 zod@^3.22.0

# Go back to root
cd ../../..

# Deploy to AWS
echo "🌐 Deploying to AWS..."
npx amplify push --yes

echo "✅ Deployment complete!"
echo "💡 Test by opening a new chat session and checking log curves tab"
