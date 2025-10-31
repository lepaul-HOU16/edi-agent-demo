#!/bin/bash

echo "🔄 Rebuilding Catalog Search Lambda Layer..."

# Stop sandbox (you'll need to do this manually with Ctrl+C)
echo "⚠️  Please stop the sandbox with Ctrl+C first, then run this script"
echo "Press Enter when sandbox is stopped..."
read

# Clear Amplify cache
echo "🗑️  Clearing Amplify cache..."
rm -rf .amplify/artifacts/cdk.out/asset.*

# Clear any old layer builds
echo "🗑️  Clearing old layer builds..."
rm -rf amplify/layers/catalogSearchLayer/python/lib

# Reinstall dependencies in correct location
echo "📦 Installing Python dependencies..."
pip3 install -r amplify/functions/catalogSearch/requirements.txt \
  -t amplify/layers/catalogSearchLayer/python/ \
  --upgrade \
  --quiet

echo "✅ Layer rebuilt. Now restart sandbox with: npx ampx sandbox"
