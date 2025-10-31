#!/bin/bash

set -e

echo "🏗️  Building Catalog Search Lambda Layer for ARM64 Linux..."

# Clean up old build
echo "🗑️  Cleaning up old layer..."
rm -rf amplify/layers/catalogSearchLayer/python
mkdir -p amplify/layers/catalogSearchLayer/python

# Build using Finch with Amazon Linux 2023 ARM64 image
echo "📦 Installing dependencies using Finch (ARM64)..."
finch run --rm \
  --platform linux/arm64 \
  --entrypoint /bin/bash \
  -v "$(pwd)/amplify/functions/catalogSearch/requirements.txt:/requirements.txt:ro" \
  -v "$(pwd)/amplify/layers/catalogSearchLayer/python:/output" \
  public.ecr.aws/lambda/python:3.12-arm64 \
  -c "pip install -r /requirements.txt -t /output --no-cache-dir"

echo "✅ Layer built successfully for ARM64!"
echo "📊 Layer size:"
du -sh amplify/layers/catalogSearchLayer/python

echo ""
echo "🚀 Next steps:"
echo "   1. The sandbox should auto-detect changes and redeploy"
echo "   2. Or manually trigger: touch amplify/layers/catalogSearchLayer/resource.ts"
