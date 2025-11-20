#!/bin/bash
# Create Lambda Layer with geopandas and visualization dependencies
set -e

echo "🔨 Creating GeoVisualization Lambda Layer"
echo "=========================================="

# Clean and create layer directory
rm -rf lambda-layers/geopandas-layer
mkdir -p lambda-layers/geopandas-layer/python

# Install geopandas and its dependencies
echo "📦 Installing geopandas, matplotlib, shapely, pillow..."
pip3 install \
  geopandas \
  matplotlib \
  shapely \
  pillow \
  -t lambda-layers/geopandas-layer/python \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --python-version 3.12

# Package the layer
echo "🗜️  Creating layer package..."
cd lambda-layers/geopandas-layer
zip -r ../geopandas-layer.zip . -q
cd ../..

SIZE=$(du -h lambda-layers/geopandas-layer.zip | cut -f1)
echo "📦 Layer size: $SIZE"

# Upload to S3 first (layer is too large for direct upload)
echo "📤 Uploading layer to S3..."
aws s3 cp lambda-layers/geopandas-layer.zip \
  s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/lambda-layers/geopandas-layer.zip

# Publish the layer from S3
echo "☁️  Publishing Lambda Layer from S3..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name GeoVisualizationLayer \
  --description "Geopandas, matplotlib, shapely, pillow for terrain visualization" \
  --content S3Bucket=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,S3Key=lambda-layers/geopandas-layer.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo ""
echo "✅ Layer created successfully!"
echo "Layer ARN: $LAYER_ARN"
echo ""
echo "Now attaching to renewable-terrain-simple Lambda..."

# Get existing layers
EXISTING_LAYER=$(aws lambda get-function-configuration \
  --function-name renewable-terrain-simple \
  --query 'Layers[0].Arn' \
  --output text 2>/dev/null || echo "")

# Attach both layers (existing + new)
if [ -n "$EXISTING_LAYER" ] && [ "$EXISTING_LAYER" != "None" ]; then
  echo "Keeping existing layer: $EXISTING_LAYER"
  aws lambda update-function-configuration \
    --function-name renewable-terrain-simple \
    --layers "$EXISTING_LAYER" "$LAYER_ARN" \
    --output json | jq -r '{FunctionName, Layers: [.Layers[].Arn]}'
else
  aws lambda update-function-configuration \
    --function-name renewable-terrain-simple \
    --layers "$LAYER_ARN" \
    --output json | jq -r '{FunctionName, Layers: [.Layers[].Arn]}'
fi

echo ""
echo "✅ Complete! Lambda now has geopandas layer"
echo "Ready to deploy COMPLETE original terrain_tools.py"
