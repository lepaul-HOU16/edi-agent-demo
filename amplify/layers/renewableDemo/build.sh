#!/bin/bash
set -e

echo "Building Renewable Demo Lambda Layer..."

# Navigate to layer directory
cd "$(dirname "$0")"

# Clean previous builds
rm -rf python/lib
rm -f renewable-demo-layer.zip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r python/renewable-demo/requirements.txt -t python/ --upgrade

# Create layer zip
echo "Creating layer zip file..."
zip -r renewable-demo-layer.zip python/ -x "*.pyc" -x "*__pycache__*" -x "*.dist-info*"

echo "✅ Layer built successfully: renewable-demo-layer.zip"
echo ""
echo "To publish the layer, run:"
echo "aws lambda publish-layer-version \\"
echo "  --layer-name renewable-demo-code \\"
echo "  --description 'Renewable energy demo Python code and dependencies' \\"
echo "  --zip-file fileb://renewable-demo-layer.zip \\"
echo "  --compatible-runtimes python3.12 \\"
echo "  --compatible-architectures x86_64"
