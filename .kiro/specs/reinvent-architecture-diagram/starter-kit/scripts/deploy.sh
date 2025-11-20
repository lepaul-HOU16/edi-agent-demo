#!/bin/bash

# Deployment script for AWS Energy Insights Starter Kit
# Usage: ./scripts/deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "AWS Energy Insights - Deployment Script"
echo "========================================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
print_status "Node.js installed: $(node --version)"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_status "npm installed: $(npm --version)"

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi
print_status "AWS CLI installed: $(aws --version)"

if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK is not installed. Install with: npm install -g aws-cdk"
    exit 1
fi
print_status "AWS CDK installed: $(cdk --version)"

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    exit 1
fi
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
print_status "AWS Account: $AWS_ACCOUNT"
print_status "AWS Region: $AWS_REGION"

echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    print_status "Loading environment variables from .env"
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
else
    print_warning ".env file not found. Using defaults."
fi

echo ""

# Install dependencies
echo "Installing dependencies..."
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
    print_status "Installing root dependencies..."
    npm install
else
    print_status "Root dependencies already installed"
fi

cd "$PROJECT_ROOT/cdk"
if [ ! -d "node_modules" ]; then
    print_status "Installing CDK dependencies..."
    npm install
else
    print_status "CDK dependencies already installed"
fi

echo ""

# Install Python dependencies for Lambda layers
echo "Installing Python dependencies..."

for tool_dir in "$PROJECT_ROOT/cdk/lambda-functions/tools"/*; do
    if [ -d "$tool_dir" ] && [ -f "$tool_dir/requirements.txt" ]; then
        tool_name=$(basename "$tool_dir")
        print_status "Installing dependencies for $tool_name..."
        pip install -r "$tool_dir/requirements.txt" -t "$tool_dir" --upgrade
    fi
done

echo ""

# Build TypeScript
echo "Building TypeScript..."
cd "$PROJECT_ROOT"
npm run build
print_status "TypeScript build complete"

echo ""

# Run tests
if [ "$ENVIRONMENT" == "prod" ]; then
    echo "Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        print_error "Tests failed. Aborting deployment."
        exit 1
    fi
    print_status "All tests passed"
    echo ""
fi

# CDK Bootstrap (if needed)
echo "Checking CDK bootstrap..."
cd "$PROJECT_ROOT/cdk"

if ! aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    print_warning "CDK not bootstrapped. Bootstrapping now..."
    cdk bootstrap aws://$AWS_ACCOUNT/$AWS_REGION
    print_status "CDK bootstrap complete"
else
    print_status "CDK already bootstrapped"
fi

echo ""

# CDK Synth
echo "Synthesizing CloudFormation templates..."
cdk synth --context environment=$ENVIRONMENT
print_status "CloudFormation synthesis complete"

echo ""

# Show diff
echo "Showing deployment changes..."
cdk diff --context environment=$ENVIRONMENT

echo ""

# Confirm deployment
if [ "$ENVIRONMENT" == "prod" ]; then
    read -p "Deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
fi

# Deploy
echo ""
echo "Deploying to $ENVIRONMENT..."
echo ""

if [ "$ENVIRONMENT" == "prod" ]; then
    cdk deploy --all --context environment=$ENVIRONMENT --require-approval never
else
    cdk deploy --all --context environment=$ENVIRONMENT
fi

if [ $? -ne 0 ]; then
    print_error "Deployment failed"
    exit 1
fi

echo ""
print_status "Deployment complete!"

# Get outputs
echo ""
echo "========================================="
echo "Deployment Outputs"
echo "========================================="

STACK_NAME="AgentPlatformStack-$ENVIRONMENT"

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)

STORAGE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='StorageBucketName'].OutputValue" \
    --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "API URL: $API_URL"
echo "Storage Bucket: $STORAGE_BUCKET"

echo ""

# Update .env file
echo "Updating .env file..."
cat > "$PROJECT_ROOT/.env.deployed" << EOF
# Deployed on $(date)
# Environment: $ENVIRONMENT

AWS_REGION=$AWS_REGION
AWS_ACCOUNT_ID=$AWS_ACCOUNT

COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID

API_GATEWAY_URL=$API_URL

STORAGE_BUCKET_NAME=$STORAGE_BUCKET

ENVIRONMENT=$ENVIRONMENT
EOF

print_status ".env.deployed file created"

echo ""

# Run smoke tests
if [ "$ENVIRONMENT" == "prod" ]; then
    echo "Running smoke tests..."
    cd "$PROJECT_ROOT"
    npm run test:smoke
    
    if [ $? -ne 0 ]; then
        print_warning "Smoke tests failed. Please investigate."
    else
        print_status "Smoke tests passed"
    fi
fi

echo ""
echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
echo "1. Create a test user:"
echo "   npm run create-user"
echo ""
echo "2. Test the agent:"
echo "   npm run test-agent \"What's the weather in Seattle?\""
echo ""
echo "3. Monitor logs:"
echo "   npm run logs:$ENVIRONMENT"
echo ""
echo "4. View CloudWatch dashboard:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:"
echo ""

print_status "Deployment complete! 🚀"
