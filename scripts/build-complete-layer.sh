#!/bin/bash
set -e

echo "🔧 Building COMPLETE Python Lambda Layer with scipy and matplotlib..."

# Create temp directory
LAYER_DIR=$(mktemp -d)
echo "📁 Working in: $LAYER_DIR"

# Create python directory structure
mkdir -p "$LAYER_DIR/python"

# Use Docker to build with Python 3.12 - ALL required packages
echo "📦 Installing ALL Python dependencies..."
docker run --rm \
  --entrypoint /bin/bash \
  -v "$LAYER_DIR":/layer \
  -w /layer \
  public.ecr.aws/lambda/python:3.12 \
  -c "pip install numpy pandas scipy matplotlib seaborn folium geopandas windrose boto3 aiohttp -t /layer/python --no-cache-dir && \
      echo '🧹 Aggressive cleanup to reduce size...' && \
      find /layer/python -type d -name 'tests' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -type d -name 'test' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
      find /layer/python -name '*.pyc' -delete && \
      find /layer/python -name '*.pyo' -delete && \
      find /layer/python -name '*.pyx' -delete && \
      find /layer/python -name '*.c' -delete && \
      find /layer/python -name '*.cpp' -delete && \
      find /layer/python -name '*.h' -delete && \
      find /layer/python -type f -name '*.md' -delete && \
      find /layer/python -type f -name '*.rst' -delete && \
      find /layer/python -type f -name '*.txt' -delete 2>/dev/null || true && \
      rm -rf /layer/python/pandas/tests 2>/dev/null || true && \
      rm -rf /layer/python/numpy/tests 2>/dev/null || true && \
      rm -rf /layer/python/scipy/tests 2>/dev/null || true && \
      rm -rf /layer/python/matplotlib/tests 2>/dev/null || true && \
      rm -rf /layer/python/*/tests 2>/dev/null || true && \
      rm -rf /layer/python/*/.libs 2>/dev/null || true && \
      rm -rf /layer/python/*/doc 2>/dev/null || true && \
      rm -rf /layer/python/*/docs 2>/dev/null || true && \
      rm -rf /layer/python/*/examples 2>/dev/null || true && \
      rm -rf /layer/python/*/benchmarks 2>/dev/null || true && \
      rm -rf /layer/python/*.dist-info 2>/dev/null || true && \
      echo '✅ Cleanup complete'"

# Create zip file
echo "📦 Creating layer zip..."
cd "$LAYER_DIR"
zip -r9 -q /tmp/python-complete-layer.zip python

# Get layer size
LAYER_SIZE=$(du -h /tmp/python-complete-layer.zip | cut -f1)
UNZIPPED_SIZE=$(du -sh "$LAYER_DIR/python" | cut -f1)
echo "📊 Zipped layer size: $LAYER_SIZE"
echo "📊 Unzipped layer size: $UNZIPPED_SIZE"

# Check if under limit
UNZIPPED_BYTES=$(du -sb "$LAYER_DIR/python" | cut -f1)
LIMIT=262144000
if [ "$UNZIPPED_BYTES" -gt "$LIMIT" ]; then
    echo "❌ ERROR: Unzipped size ($UNZIPPED_BYTES bytes) exceeds Lambda limit ($LIMIT bytes)"
    echo "💡 Need to remove more files. Trying additional cleanup..."
    
    # Additional aggressive cleanup
    docker run --rm \
      --entrypoint /bin/bash \
      -v "$LAYER_DIR":/layer \
      -w /layer \
      public.ecr.aws/lambda/python:3.12 \
      -c "rm -rf /layer/python/scipy/sparse/linalg/dsolve/SuperLU 2>/dev/null || true && \
          rm -rf /layer/python/scipy/sparse/linalg/eigen/arpack/ARPACK 2>/dev/null || true && \
          rm -rf /layer/python/matplotlib/mpl-data/fonts 2>/dev/null || true && \
          rm -rf /layer/python/matplotlib/mpl-data/sample_data 2>/dev/null || true && \
          find /layer/python -name '*.a' -delete && \
          find /layer/python -name '*.la' -delete"
    
    # Recreate zip
    cd "$LAYER_DIR"
    rm /tmp/python-complete-layer.zip
    zip -r9 -q /tmp/python-complete-layer.zip python
    
    LAYER_SIZE=$(du -h /tmp/python-complete-layer.zip | cut -f1)
    UNZIPPED_SIZE=$(du -sh "$LAYER_DIR/python" | cut -f1)
    UNZIPPED_BYTES=$(du -sb "$LAYER_DIR/python" | cut -f1)
    echo "📊 After additional cleanup - Zipped: $LAYER_SIZE, Unzipped: $UNZIPPED_SIZE"
    
    if [ "$UNZIPPED_BYTES" -gt "$LIMIT" ]; then
        echo "❌ Still too large. Cannot proceed."
        rm -rf "$LAYER_DIR"
        exit 1
    fi
fi

echo "✅ Layer size is within limits"

# Upload to S3
echo "📤 Uploading to S3..."
aws s3 cp /tmp/python-complete-layer.zip s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/layers/python-complete-layer.zip

# Publish new layer version
echo "🚀 Publishing layer to AWS..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name RenewableDemoLayer24365431 \
  --description "Complete renewable energy Python dependencies (pandas, scipy, matplotlib, folium)" \
  --content S3Bucket=amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy,S3Key=layers/python-complete-layer.zip \
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

echo "✅ Complete layer rebuild and attachment done!"
echo "🧪 Test with: aws lambda invoke --function-name amplify-digitalassistant--RenewableTerrainToolFBBF-ybNZBb7mi7Uv --payload '{...}' /tmp/test.json"

# Cleanup
rm -rf "$LAYER_DIR"
rm /tmp/python-complete-layer.zip
