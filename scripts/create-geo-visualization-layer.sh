#!/bin/bash
# Create a Lambda Layer with geo/visualization dependencies
set -e

echo "📦 Creating Geo/Visualization Lambda Layer"
echo "=========================================="

# Clean and create layer directory
rm -rf lambda-layer/geo-viz
mkdir -p lambda-layer/geo-viz/python

# Install the missing heavy dependencies (skip geopandas - too large, we'll work around it)
echo "Installing matplotlib, shapely, pillow..."
pip3 install matplotlib shapely pillow -t lambda-layer/geo-viz/python --quiet

# Package the layer
echo "🗜️  Creating layer package..."
cd lambda-layer/geo-viz
zip -r ../geo-viz-layer.zip . -q
cd ../..

SIZE=$(du -h lambda-layer/geo-viz-layer.zip | cut -f1)
echo "📦 Layer size: $SIZE"

# Upload to S3 first (layer is too large for direct upload)
echo "📤 Uploading layer to S3..."
aws s3 cp lambda-layer/geo-viz-layer.zip \
  s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/lambda-layers/geo-viz-layer.zip

# Publish the layer from S3
echo "☁️  Publishing Lambda Layer from S3..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-geo-visualization \
  --description "Geopandas, matplotlib, shapely, pillow for renewable energy analysis" \
  --content S3Bucket=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,S3Key=lambda-layers/geo-viz-layer.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo ""
echo "✅ Layer created: $LAYER_ARN"
echo ""
echo "Now attaching BOTH layers to renewable-terrain-simple..."

# Get the existing layer ARN
EXISTING_LAYER="arn:aws:lambda:us-east-1:484907533441:layer:RenewableDemoLayer24365431:3"

# Update Lambda with BOTH layers
aws lambda update-function-configuration \
  --function-name renewable-terrain-simple \
  --layers "$EXISTING_LAYER" "$LAYER_ARN" \
  --output json | jq -r '{FunctionName, Layers: .Layers[].Arn}'

echo ""
echo "✅ Lambda now has BOTH layers!"
echo "Ready to deploy complete terrain_tools.py"
