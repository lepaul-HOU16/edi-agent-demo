#!/bin/bash
set -e

echo "🔧 Rebuilding Python Lambda Layer with dependencies..."

# Create temp directory
LAYER_DIR=$(mktemp -d)
echo "📁 Working in: $LAYER_DIR"

# Create python directory structure for Lambda layer
mkdir -p "$LAYER_DIR/python"

# Use Docker to build with Python 3.12
echo "📦 Installing Python dependencies using Docker..."
docker run --rm \
  --entrypoint /bin/bash \
  -v "$LAYER_DIR":/layer \
  -w /layer \
  public.ecr.aws/lambda/python:3.12 \
  -c "pip install numpy pandas folium boto3 aiohttp -t /layer/python --no-cache-dir && \
      find /layer/python -type d -name 'tests' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -name '*.pyc' -delete && \
      find /layer/python -name '*.pyo' -delete"

# Create zip file
echo "📦 Creating layer zip..."
cd "$LAYER_DIR"
zip -r9 /tmp/python-layer.zip python

# Get layer size
LAYER_SIZE=$(du -h /tmp/python-layer.zip | cut -f1)
echo "📊 Layer size: $LAYER_SIZE"

# Publish new layer version
echo "🚀 Publishing layer to AWS..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name RenewableDemoLayer24365431 \
  --description "Renewable energy Python dependencies (pandas, numpy, folium, etc.)" \
  --zip-file fileb:///tmp/python-layer.zip \
  --compatible-runtimes python3.12 \
  --query "LayerVersionArn" \
  --output text)

echo "✅ Layer published: $LAYER_ARN"

# Update terrain Lambda to use new layer
echo "🔗 Attaching layer to terrain Lambda..."
aws lambda update-function-configuration \
  --function-name amplify-digitalassistant--RenewableTerrainToolFBBF-ybNZBb7mi7Uv \
  --layers "$LAYER_ARN"

echo "⏳ Waiting for Lambda update to complete..."
aws lambda wait function-updated \
  --function-name amplify-digitalassistant--RenewableTerrainToolFBBF-ybNZBb7mi7Uv

echo "✅ Layer rebuild and attachment complete!"
echo "🧪 Test with: aws lambda invoke --function-name amplify-digitalassistant--RenewableTerrainToolFBBF-ybNZBb7mi7Uv --payload '{...}' /tmp/test.json"

# Cleanup
rm -rf "$LAYER_DIR"
rm /tmp/python-layer.zip
