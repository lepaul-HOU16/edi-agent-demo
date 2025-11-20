#!/bin/bash
# Create multiple Lambda Layers for renewable tools
set -e

echo "🔨 Creating Multiple Lambda Layers for Complete Renewable Tools"
echo "================================================================"

S3_BUCKET="amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy"
LAYER_ARNS=()

# Layer 1: Geopandas + Shapely
echo ""
echo "📦 Layer 1: Geopandas + Shapely"
rm -rf lambda-layers/layer1
mkdir -p lambda-layers/layer1/python
pip3 install geopandas shapely \
  -t lambda-layers/layer1/python \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --python-version 3.12 \
  --quiet
cd lambda-layers/layer1 && zip -r ../layer1.zip . -q && cd ../..
aws s3 cp lambda-layers/layer1.zip s3://$S3_BUCKET/lambda-layers/layer1.zip
LAYER1_ARN=$(aws lambda publish-layer-version \
  --layer-name RenewableGeopandas \
  --content S3Bucket=$S3_BUCKET,S3Key=lambda-layers/layer1.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' --output text)
LAYER_ARNS+=("$LAYER1_ARN")
echo "✅ Layer 1: $LAYER1_ARN"

# Layer 2: Matplotlib + Pillow
echo ""
echo "📦 Layer 2: Matplotlib + Pillow"
rm -rf lambda-layers/layer2
mkdir -p lambda-layers/layer2/python
pip3 install matplotlib pillow \
  -t lambda-layers/layer2/python \
  --platform manylinux2014_x86_64 \
  --only-binary=:all: \
  --python-version 3.12 \
  --quiet
cd lambda-layers/layer2 && zip -r ../layer2.zip . -q && cd ../..
aws s3 cp lambda-layers/layer2.zip s3://$S3_BUCKET/lambda-layers/layer2.zip
LAYER2_ARN=$(aws lambda publish-layer-version \
  --layer-name RenewableMatplotlib \
  --content S3Bucket=$S3_BUCKET,S3Key=lambda-layers/layer2.zip \
  --compatible-runtimes python3.12 \
  --query 'LayerVersionArn' --output text)
LAYER_ARNS+=("$LAYER2_ARN")
echo "✅ Layer 2: $LAYER2_ARN"

# Layer 3: Folium (already in RenewableDemoLayer, but add separately for clarity)
echo ""
echo "📦 Layer 3: Using existing RenewableDemoLayer (has folium, pandas, numpy)"
LAYER3_ARN="arn:aws:lambda:us-east-1:484907533441:layer:RenewableDemoLayer24365431:3"
LAYER_ARNS+=("$LAYER3_ARN")
echo "✅ Layer 3: $LAYER3_ARN"

# Attach all layers to the Lambda
echo ""
echo "🔗 Attaching all layers to renewable-terrain-simple..."
aws lambda update-function-configuration \
  --function-name renewable-terrain-simple \
  --layers "${LAYER_ARNS[@]}" \
  --output json | jq -r '{FunctionName, Layers: [.Layers[].Arn]}'

echo ""
echo "✅ All layers attached!"
echo "Total layers: ${#LAYER_ARNS[@]}"
echo ""
echo "Now deploy the COMPLETE original terrain_tools.py with:"
echo "./scripts/deploy-terrain-with-complete-code.sh"
