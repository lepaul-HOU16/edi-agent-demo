#!/bin/bash
# Build Lambda Layer for Renewable Energy Tools

set -e

echo "🔨 Building Renewable Energy Tools Lambda Layer..."

# Create layer directory
LAYER_DIR="renewable-tools-layer"
rm -rf $LAYER_DIR
mkdir -p $LAYER_DIR/python

echo "📦 Installing Python dependencies..."

# Install all dependencies
pip3 install \
  boto3>=1.28.0 \
  geopandas>=0.14.0 \
  shapely>=2.0.0 \
  folium>=0.15.0 \
  requests>=2.31.0 \
  py-wake>=2.5.0 \
  scipy>=1.11.0 \
  numpy>=1.24.0 \
  -t $LAYER_DIR/python/

echo "📁 Copying renewable-demo tools..."

# Copy the renewable demo tools
mkdir -p $LAYER_DIR/python/agents/tools
cp -r agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/tools/*.py \
  $LAYER_DIR/python/agents/tools/

echo "🗜️  Creating layer zip..."

# Create zip file
cd $LAYER_DIR
zip -r ../renewable-tools-layer.zip python/
cd ..

echo "☁️  Uploading to AWS Lambda..."

# Upload layer
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-tools-dependencies \
  --description "Dependencies and code for renewable energy analysis tools" \
  --zip-file fileb://renewable-tools-layer.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo "✅ Layer created: $LAYER_ARN"
echo ""
echo "📝 Add this to your environment:"
echo "export RENEWABLE_DEMO_LAYER_ARN=$LAYER_ARN"
echo ""
echo "Or update amplify/backend.ts to use this layer ARN"

# Clean up
rm -rf $LAYER_DIR
rm renewable-tools-layer.zip

echo "🎉 Done!"
