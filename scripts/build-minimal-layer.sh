#!/bin/bash
# Build MINIMAL Lambda Layer for Renewable Energy Tools
# Only essential dependencies, no heavy geospatial libraries

set -e

echo "🔨 Building MINIMAL Renewable Energy Tools Lambda Layer..."

# Create layer directory
LAYER_DIR="renewable-tools-layer"
rm -rf $LAYER_DIR
mkdir -p $LAYER_DIR/python

echo "📦 Installing MINIMAL Python dependencies..."

# Install only boto3 and requests (lightweight)
pip3 install \
  boto3>=1.28.0 \
  requests>=2.31.0 \
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

# Check size
SIZE=$(du -h renewable-tools-layer.zip | cut -f1)
echo "📏 Layer size: $SIZE"

echo "☁️  Uploading to AWS Lambda..."

# Upload layer
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-tools-minimal \
  --description "Minimal dependencies for renewable energy analysis tools" \
  --zip-file fileb://renewable-tools-layer.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo "✅ Layer created: $LAYER_ARN"
echo ""
echo "📝 Update amplify/backend.ts with:"
echo "const renewableLayerArn = '$LAYER_ARN';"
echo ""

# Clean up
rm -rf $LAYER_DIR
rm renewable-tools-layer.zip

echo "🎉 Done!"
echo ""
echo "⚠️  NOTE: This minimal layer does NOT include:"
echo "  - geopandas (use OSM Overpass API instead)"
echo "  - folium (generate simple GeoJSON)"
echo "  - py-wake (use simplified calculations)"
echo "  - scipy/numpy (use basic math)"
