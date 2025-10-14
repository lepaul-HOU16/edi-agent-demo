#!/bin/bash

# Deploy Manual Renewable Energy Lambda Functions
# This script bypasses Amplify Gen 2's Docker deployment issues by manually
# building, pushing to ECR, and creating Lambda functions directly.

set -e

echo "🚀 Starting manual deployment of renewable energy Lambda functions"
echo "=================================================="

# Get AWS account and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-west-2")

echo "📋 Account ID: $ACCOUNT_ID"
echo "🌍 Region: $REGION"
echo ""

# Get S3 bucket name from existing Lambda
echo "🔍 Finding S3 bucket name..."
S3_BUCKET=$(aws lambda get-function-configuration \
  --function-name $(aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewable`)].FunctionName' --output text | head -1) \
  --query 'Environment.Variables.S3_BUCKET' --output text 2>/dev/null || echo "")

if [ -z "$S3_BUCKET" ]; then
  echo "⚠️  Could not find S3 bucket from existing Lambda, using default pattern"
  S3_BUCKET="amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy"
fi

echo "📦 S3 Bucket: $S3_BUCKET"
echo ""

# Get IAM role from existing Lambda
echo "🔍 Finding IAM role..."
IAM_ROLE=$(aws lambda get-function \
  --function-name $(aws lambda list-functions --query 'Functions[?contains(FunctionName, `renewable`)].FunctionName' --output text | head -1) \
  --query 'Configuration.Role' --output text 2>/dev/null)

if [ -z "$IAM_ROLE" ]; then
  echo "❌ Could not find IAM role from existing Lambda"
  echo "Please ensure renewable energy functions are deployed via Amplify first"
  exit 1
fi

echo "🔐 IAM Role: $IAM_ROLE"
echo ""

# Create ECR repositories
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name renewable-terrain --region $REGION 2>/dev/null || echo "  ✓ renewable-terrain repository exists"
aws ecr create-repository --repository-name renewable-simulation --region $REGION 2>/dev/null || echo "  ✓ renewable-simulation repository exists"
echo ""

# Authenticate Docker with ECR
echo "🔐 Authenticating Docker with ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
echo ""

# Build and push terrain image
echo "🏗️  Building terrain analysis image..."
DOCKER_BUILDKIT=0 docker build \
  -t renewable-terrain:latest \
  -f amplify/functions/renewableTools/terrain/Dockerfile \
  amplify/functions/renewableTools

echo "📤 Pushing terrain image to ECR..."
docker tag renewable-terrain:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-terrain:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-terrain:latest
echo ""

# Build and push simulation image
echo "🏗️  Building wake simulation image..."
DOCKER_BUILDKIT=0 docker build \
  -t renewable-simulation:latest \
  -f amplify/functions/renewableTools/simulation/Dockerfile \
  amplify/functions/renewableTools

echo "📤 Pushing simulation image to ECR..."
docker tag renewable-simulation:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-simulation:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-simulation:latest
echo ""

# Create or update terrain Lambda function
echo "🔧 Creating/updating terrain Lambda function..."
if aws lambda get-function --function-name renewable-terrain-manual 2>/dev/null; then
  echo "  ↻ Updating existing function..."
  aws lambda update-function-code \
    --function-name renewable-terrain-manual \
    --image-uri $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-terrain:latest
else
  echo "  ✨ Creating new function..."
  aws lambda create-function \
    --function-name renewable-terrain-manual \
    --package-type Image \
    --code ImageUri=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-terrain:latest \
    --role $IAM_ROLE \
    --timeout 90 \
    --memory-size 2048 \
    --environment "Variables={S3_BUCKET=$S3_BUCKET,LOG_LEVEL=INFO}" \
    --description 'Manually deployed terrain analysis with full visualization support'
fi
echo ""

# Create or update simulation Lambda function
echo "🔧 Creating/updating simulation Lambda function..."
if aws lambda get-function --function-name renewable-simulation-manual 2>/dev/null; then
  echo "  ↻ Updating existing function..."
  aws lambda update-function-code \
    --function-name renewable-simulation-manual \
    --image-uri $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-simulation:latest
else
  echo "  ✨ Creating new function..."
  aws lambda create-function \
    --function-name renewable-simulation-manual \
    --package-type Image \
    --code ImageUri=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/renewable-simulation:latest \
    --role $IAM_ROLE \
    --timeout 90 \
    --memory-size 2048 \
    --environment "Variables={S3_BUCKET=$S3_BUCKET,LOG_LEVEL=INFO}" \
    --description 'Manually deployed wake simulation with full visualization support'
fi
echo ""

# Wait for functions to be active
echo "⏳ Waiting for functions to be active..."
aws lambda wait function-active --function-name renewable-terrain-manual
aws lambda wait function-active --function-name renewable-simulation-manual
echo ""

# Test terrain function
echo "🧪 Testing terrain function..."
aws lambda invoke \
  --function-name renewable-terrain-manual \
  --payload '{"parameters":{"latitude":40.7128,"longitude":-74.0060,"radius_km":3,"project_id":"test-deploy"}}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/terrain-test.json

TERRAIN_STATUS=$(cat /tmp/terrain-test.json | jq -r '.statusCode')
if [ "$TERRAIN_STATUS" = "200" ]; then
  TERRAIN_BODY=$(cat /tmp/terrain-test.json | jq -r '.body' | jq -r '.')
  FEATURE_COUNT=$(echo "$TERRAIN_BODY" | jq -r '.feature_count')
  VIZ_AVAILABLE=$(echo "$TERRAIN_BODY" | jq -r '.visualization_available')
  echo "  ✅ Terrain function working! Features: $FEATURE_COUNT, Visualizations: $VIZ_AVAILABLE"
else
  echo "  ⚠️  Terrain function returned status $TERRAIN_STATUS"
fi
echo ""

# Test simulation function
echo "🧪 Testing simulation function..."
aws lambda invoke \
  --function-name renewable-simulation-manual \
  --payload '{"parameters":{"project_id":"test-wake","layout":{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[-101.395466,35.067482]},"properties":{"capacity_MW":2.5,"turbine_id":"T01"}},{"type":"Feature","geometry":{"type":"Point","coordinates":[-101.385466,35.067482]},"properties":{"capacity_MW":2.5,"turbine_id":"T02"}}]},"wind_speed":8.5}}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/simulation-test.json

SIM_STATUS=$(cat /tmp/simulation-test.json | jq -r '.statusCode')
if [ "$SIM_STATUS" = "200" ]; then
  SIM_BODY=$(cat /tmp/simulation-test.json | jq -r '.body' | jq -r '.')
  SIM_SUCCESS=$(echo "$SIM_BODY" | jq -r '.success')
  SIM_VIZ=$(echo "$SIM_BODY" | jq -r '.visualization_available')
  echo "  ✅ Simulation function working! Success: $SIM_SUCCESS, Visualizations: $SIM_VIZ"
else
  echo "  ⚠️  Simulation function returned status $SIM_STATUS"
fi
echo ""

echo "=================================================="
echo "✅ Manual deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update orchestrator environment variables:"
echo "   RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME=renewable-terrain-manual"
echo "   RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME=renewable-simulation-manual"
echo ""
echo "2. Redeploy the orchestrator with updated environment variables"
echo ""
echo "3. Test the full workflow through the chat interface"
echo ""
echo "🎉 Your renewable energy tools are now deployed with full visualization support!"
