#!/bin/bash
set -e

echo "🔧 Building MINIMAL Python Lambda Layer..."

# Create temp directory
LAYER_DIR=$(mktemp -d)
echo "📁 Working in: $LAYER_DIR"

# Create python directory structure
mkdir -p "$LAYER_DIR/python"

# Use Docker to build with Python 3.12 - MINIMAL packages only
echo "📦 Installing MINIMAL Python dependencies..."
docker run --rm \
  --entrypoint /bin/bash \
  -v "$LAYER_DIR":/layer \
  -w /layer \
  public.ecr.aws/lambda/python:3.12 \
  -c "pip install pandas folium boto3 aiohttp -t /layer/python --no-cache-dir --no-deps && \
      pip install numpy pytz python-dateutil tzdata branca jinja2 requests xyzservices certifi charset-normalizer idna urllib3 botocore jmespath s3transfer aiohappyeyeballs aiosignal async-timeout attrs frozenlist multidict propcache yarl typing-extensions -t /layer/python --no-cache-dir && \
      echo '🧹 Cleaning up...' && \
      find /layer/python -type d -name 'tests' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -type d -name 'test' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -name '*.pyc' -delete && \
      find /layer/python -name '*.pyo' -delete && \
      find /layer/python -name '*.dist-info' -type d -exec rm -rf {} + 2>/dev/null || true && \
      rm -rf /layer/python/pandas/tests 2>/dev/null || true && \
      rm -rf /layer/python/numpy/tests 2>/dev/null || true"

# Create zip file
echo "📦 Creating layer zip..."
cd "$LAYER_DIR"
zip -r9 -q /tmp/python-minimal-layer.zip python

# Get layer size
LAYER_SIZE=$(du -h /tmp/python-minimal-layer.zip | cut -f1)
echo "📊 Layer size: $LAYER_SIZE"

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 cp /tmp/python-minimal-layer.zip s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/layers/python-minimal-layer.zip

# Publish new layer version
echo "🚀 Publishing layer to AWS..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name RenewableDemoLayer24365431 \
  --description "Minimal renewable energy Python dependencies" \
  --content S3Bucket=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,S3Key=layers/python-minimal-layer.zip \
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

# Cleanup
rm -rf "$LAYER_DIR"
rm /tmp/python-minimal-layer.zip
