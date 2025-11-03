#!/bin/bash
set -e

echo "🚀 Deploying Renewable Demo Lambda Layer"
echo "=========================================="
echo ""

# Navigate to layer directory
cd amplify/layers/renewableDemo

# Build the layer
echo "📦 Building layer..."
./build.sh

# Publish to AWS Lambda
echo ""
echo "☁️  Publishing to AWS Lambda..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-demo-code \
  --description 'Renewable energy demo Python code and dependencies' \
  --zip-file fileb://renewable-demo-layer.zip \
  --compatible-runtimes python3.12 \
  --compatible-architectures x86_64 \
  --query 'LayerVersionArn' \
  --output text)

echo ""
echo "✅ Layer published successfully!"
echo ""
echo "Layer ARN: $LAYER_ARN"
echo ""
echo "Add this to your .env.local:"
echo "RENEWABLE_DEMO_LAYER_ARN=$LAYER_ARN"
echo ""
echo "Next steps:"
echo "1. Add the Layer ARN to your environment variables"
echo "2. Deploy the Lambda functions with: npx ampx sandbox"
