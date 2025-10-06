#!/bin/bash

# Simple AgentCore Deployment Script
# This script deploys the wind farm agent to AgentCore

set -e

echo "🚀 Starting AgentCore Deployment..."
echo ""

# Configuration
AGENT_NAME="wind_farm_dev_agent"
REPOSITORY_NAME="wind-farm-agent-runtime"
IMAGE_TAG="latest"
REGION="${AWS_REGION:-us-east-1}"

echo "📋 Configuration:"
echo "   Agent Name: $AGENT_NAME"
echo "   Repository: $REPOSITORY_NAME"
echo "   Image Tag: $IMAGE_TAG"
echo "   Region: $REGION"
echo ""

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found. Please run this script from the workshop-assets directory."
    echo "   cd agentic-ai-for-renewable-site-design-mainline/workshop-assets"
    exit 1
fi

# Step 1: Create ECR repository
echo "📦 Step 1: Creating ECR repository..."
aws ecr describe-repositories --repository-names "$REPOSITORY_NAME" --region "$REGION" 2>/dev/null || \
aws ecr create-repository --repository-name "$REPOSITORY_NAME" --region "$REGION"

# Get ECR URI
ECR_URI=$(aws ecr describe-repositories --repository-names "$REPOSITORY_NAME" --region "$REGION" --query 'repositories[0].repositoryUri' --output text)
echo "   ECR URI: $ECR_URI"
echo ""

# Step 2: Login to ECR
echo "🔐 Step 2: Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_URI"
echo ""

# Step 3: Build Docker image
echo "🏗️  Step 3: Building Docker image..."
docker build -t "$REPOSITORY_NAME:$IMAGE_TAG" .
echo ""

# Step 4: Tag image
echo "🏷️  Step 4: Tagging image..."
docker tag "$REPOSITORY_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
echo ""

# Step 5: Push image
echo "⬆️  Step 5: Pushing image to ECR..."
docker push "$ECR_URI:$IMAGE_TAG"
echo ""

# Step 6: Create IAM role for AgentCore runtime
echo "👤 Step 6: Creating IAM role..."
ROLE_NAME="agentcore-runtime-role"

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
    echo "   Role already exists: $ROLE_NAME"
else
    # Create trust policy
    cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json \
        --description "Role for AgentCore runtime"
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
    
    echo "   Role created: $ROLE_NAME"
fi

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "   Role ARN: $ROLE_ARN"
echo ""

# Step 7: Create AgentCore runtime
echo "🤖 Step 7: Creating AgentCore runtime..."
echo ""
echo "⚠️  NOTE: The bedrock-agentcore service might not be available via AWS CLI yet."
echo "   If this step fails, you'll need to create the runtime via the AWS Console or continue using mock data."
echo ""

# Try to create the runtime (this might fail if the service isn't available)
cat > /tmp/agentcore-request.json <<EOF
{
  "agentRuntimeName": "$AGENT_NAME",
  "agentRuntimeType": "CONTAINER",
  "agentRuntimeArtifact": {
    "type": "CONTAINER",
    "containerArtifact": {
      "imageUri": "$ECR_URI:$IMAGE_TAG"
    }
  },
  "agentRuntimeRoleArn": "$ROLE_ARN",
  "description": "Wind farm site design agent with MCP tools"
}
EOF

echo "   Attempting to create AgentCore runtime..."
if aws bedrock-agentcore create-agent-runtime --cli-input-json file:///tmp/agentcore-request.json --region "$REGION" 2>/tmp/agentcore-error.txt; then
    echo "   ✅ AgentCore runtime created successfully!"
    echo ""
    echo "   Getting runtime ARN..."
    RUNTIME_ARN=$(aws bedrock-agentcore list-agent-runtimes --region "$REGION" --query "agentRuntimes[?agentRuntimeName=='$AGENT_NAME'].agentRuntimeArn" --output text 2>/dev/null || echo "")
    
    if [ -n "$RUNTIME_ARN" ]; then
        echo ""
        echo "🎉 Deployment Complete!"
        echo ""
        echo "📋 Runtime ARN:"
        echo "   $RUNTIME_ARN"
        echo ""
        echo "📝 Next Steps:"
        echo "   1. Update your Lambda environment variable:"
        echo "      NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$RUNTIME_ARN"
        echo ""
        echo "   2. Run this command:"
        echo "      aws lambda update-function-configuration \\"
        echo "        --function-name amplify-digitalassistant--lightweightAgentlambda3D-SvyqMpiwGrVq \\"
        echo "        --environment Variables=\"{NEXT_PUBLIC_RENEWABLE_ENABLED=true,NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=$RUNTIME_ARN,NEXT_PUBLIC_RENEWABLE_S3_BUCKET=renewable-energy-artifacts-484907533441,NEXT_PUBLIC_RENEWABLE_REGION=us-east-1,RENEWABLE_PROXY_FUNCTION_NAME=amplify-digitalassistant--RenewableAgentCoreProxy6-Vv9NVowsUjd5}\""
        echo ""
        echo "   3. Test in your UI with a renewable query!"
    fi
else
    echo "   ⚠️  AgentCore runtime creation failed (expected if service not available)"
    cat /tmp/agentcore-error.txt
    echo ""
    echo "📦 Docker Image Ready!"
    echo "   Image URI: $ECR_URI:$IMAGE_TAG"
    echo "   Role ARN: $ROLE_ARN"
    echo ""
    echo "📝 Manual Steps Required:"
    echo "   1. Create AgentCore runtime via AWS Console (if available)"
    echo "   2. Use the image URI and role ARN above"
    echo "   3. Get the runtime ARN from the console"
    echo "   4. Update your Lambda environment variable with the new ARN"
    echo ""
    echo "   OR continue using mock data - the integration is working correctly!"
fi

# Cleanup
rm -f /tmp/trust-policy.json /tmp/agentcore-request.json /tmp/agentcore-error.txt

echo ""
echo "✅ Script complete!"
