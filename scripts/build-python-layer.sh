#!/bin/bash
# Build Python Lambda Layer with all renewable energy dependencies

set -e

echo "Building Python Lambda Layer..."

# Create layer directory structure
LAYER_DIR="python-layer"
rm -rf $LAYER_DIR
mkdir -p $LAYER_DIR/python

# Install dependencies (excluding boto3 which is in Lambda runtime)
echo "Installing Python dependencies..."
pip3 install pandas numpy folium aiohttp requests -t $LAYER_DIR/python --no-binary :all: 2>/dev/null || \
pip3 install pandas numpy folium aiohttp requests -t $LAYER_DIR/python

# Remove unnecessary files to reduce size
echo "Removing unnecessary files..."
find $LAYER_DIR/python -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true
find $LAYER_DIR/python -type d -name "*.dist-info" -exec rm -rf {} + 2>/dev/null || true
find $LAYER_DIR/python -name "*.pyc" -delete
find $LAYER_DIR/python -name "*.pyo" -delete
find $LAYER_DIR/python -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Create zip file
echo "Creating layer zip..."
cd $LAYER_DIR
zip -r ../renewable-python-layer.zip python
cd ..

echo "Layer built successfully: renewable-python-layer.zip"
echo "Size: $(du -h renewable-python-layer.zip | cut -f1)"

# Publish layer to AWS
echo "Publishing layer to AWS Lambda..."
LAYER_ARN=$(aws lambda publish-layer-version \
  --layer-name renewable-python-dependencies \
  --description "Python dependencies for renewable energy tools (pandas, folium, geopandas, etc.)" \
  --zip-file fileb://renewable-python-layer.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' \
  --output text)

echo "Layer published successfully!"
echo "Layer ARN: $LAYER_ARN"
echo ""
echo "Add this to your Lambda resource:"
echo "layers: [lambda.LayerVersion.fromLayerVersionArn(scope, 'PythonDeps', '$LAYER_ARN')]"

# Clean up
rm -rf $LAYER_DIR renewable-python-layer.zip

echo "Done!"
