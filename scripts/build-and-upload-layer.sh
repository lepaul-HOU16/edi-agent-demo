#!/bin/bash
# Build minimal Python Lambda Layer and upload via S3

set -e

echo "Building minimal Python Lambda Layer..."

# Create layer directory
LAYER_DIR="python-layer-minimal"
rm -rf $LAYER_DIR
mkdir -p $LAYER_DIR/python

# Install ONLY critical dependencies
echo "Installing minimal dependencies..."
pip3 install \
  pandas==2.0.3 \
  numpy==1.24.4 \
  folium==0.14.0 \
  aiohttp==3.8.6 \
  -t $LAYER_DIR/python \
  --platform manylinux2014_x86_64 \
  --only-binary=:all:

# Aggressive cleanup
echo "Cleaning up..."
cd $LAYER_DIR/python
rm -rf */tests */test */__pycache__ */*.dist-info */docs
find . -name "*.pyc" -delete
find . -name "*.pyo" -delete
find . -name "*.so" -exec strip {} \; 2>/dev/null || true
cd ../..

# Create zip
echo "Creating zip..."
cd $LAYER_DIR
zip -r9 ../renewable-layer-minimal.zip python
cd ..

SIZE=$(du -h renewable-layer-minimal.zip | cut -f1)
echo "Layer size: $SIZE"

# Upload to S3
BUCKET="amplify-digitalassistant-lepaul-sandbox-81360e1def-storage"
echo "Uploading to S3..."
aws s3 cp renewable-layer-minimal.zip s3://$BUCKET/layers/renewable-python-minimal.zip

# Publish layer from S3
echo "Publishing layer..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-python-minimal \
  --description "Minimal Python deps for renewable tools" \
  --content S3Bucket=$BUCKET,S3Key=layers/renewable-python-minimal.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo ""
echo "✅ Layer published!"
echo "Layer ARN: $LAYER_ARN"
echo ""
echo "Save this ARN - you'll need it for the Lambda configuration"

# Cleanup
rm -rf $LAYER_DIR renewable-layer-minimal.zip

echo "Done!"
