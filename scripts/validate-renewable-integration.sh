#!/bin/bash

# Renewable Energy Integration Validation Script
# This script performs quick validation checks for the renewable energy integration

set -e

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "Loading environment variables from .env.local..."
    set -a  # automatically export all variables
    source .env.local
    set +a  # stop automatically exporting
    echo ""
fi

echo "🌱 Renewable Energy Integration Validation"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
PASSED=0
FAILED=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED=$((PASSED + 1))
}

# Function to print failure
failure() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

echo "1. Checking Environment Variables"
echo "-----------------------------------"

# Check NEXT_PUBLIC_RENEWABLE_ENABLED
if [ -z "$NEXT_PUBLIC_RENEWABLE_ENABLED" ]; then
    warning "NEXT_PUBLIC_RENEWABLE_ENABLED is not set (integration disabled)"
elif [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
    success "NEXT_PUBLIC_RENEWABLE_ENABLED=true"
else
    warning "NEXT_PUBLIC_RENEWABLE_ENABLED=$NEXT_PUBLIC_RENEWABLE_ENABLED (integration disabled)"
fi

# Check NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT
if [ -z "$NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT" ]; then
    if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
        failure "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT is not set (required when enabled)"
    else
        warning "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT is not set"
    fi
else
    success "NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT is set"
    echo "   Endpoint: $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT"
fi

# Check NEXT_PUBLIC_RENEWABLE_S3_BUCKET
if [ -z "$NEXT_PUBLIC_RENEWABLE_S3_BUCKET" ]; then
    if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
        failure "NEXT_PUBLIC_RENEWABLE_S3_BUCKET is not set (required when enabled)"
    else
        warning "NEXT_PUBLIC_RENEWABLE_S3_BUCKET is not set"
    fi
else
    success "NEXT_PUBLIC_RENEWABLE_S3_BUCKET is set"
    echo "   Bucket: $NEXT_PUBLIC_RENEWABLE_S3_BUCKET"
fi

# Check NEXT_PUBLIC_RENEWABLE_AWS_REGION
if [ -z "$NEXT_PUBLIC_RENEWABLE_AWS_REGION" ]; then
    warning "NEXT_PUBLIC_RENEWABLE_AWS_REGION is not set (will use default: us-west-2)"
else
    success "NEXT_PUBLIC_RENEWABLE_AWS_REGION=$NEXT_PUBLIC_RENEWABLE_AWS_REGION"
fi

echo ""
echo "2. Checking AWS Resources"
echo "-------------------------"

# Check S3 bucket exists (if configured)
if [ -n "$NEXT_PUBLIC_RENEWABLE_S3_BUCKET" ]; then
    set +e  # Temporarily disable exit on error for AWS CLI
    aws s3 ls "s3://$NEXT_PUBLIC_RENEWABLE_S3_BUCKET" > /dev/null 2>&1
    S3_RESULT=$?
    set -e  # Re-enable exit on error
    
    if [ $S3_RESULT -eq 0 ]; then
        success "S3 bucket exists and is accessible"
    else
        failure "S3 bucket does not exist or is not accessible"
    fi
else
    warning "Skipping S3 bucket check (not configured)"
fi

# Check SSM parameters
echo ""
echo "3. Checking SSM Parameters"
echo "--------------------------"

REGION="${NEXT_PUBLIC_RENEWABLE_AWS_REGION:-us-west-2}"

set +e  # Temporarily disable exit on error for AWS CLI
aws ssm get-parameter --name "/wind-farm-assistant/s3-bucket-name" --region "$REGION" > /dev/null 2>&1
SSM1_RESULT=$?
set -e  # Re-enable exit on error

if [ $SSM1_RESULT -eq 0 ]; then
    success "SSM parameter /wind-farm-assistant/s3-bucket-name exists"
    BUCKET_PARAM=$(aws ssm get-parameter --name "/wind-farm-assistant/s3-bucket-name" --region "$REGION" --query 'Parameter.Value' --output text)
    echo "   Value: $BUCKET_PARAM"
    
    # Check if it matches environment variable
    if [ -n "$NEXT_PUBLIC_RENEWABLE_S3_BUCKET" ] && [ "$BUCKET_PARAM" != "$NEXT_PUBLIC_RENEWABLE_S3_BUCKET" ]; then
        warning "SSM parameter value ($BUCKET_PARAM) does not match environment variable ($NEXT_PUBLIC_RENEWABLE_S3_BUCKET)"
    fi
else
    if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
        failure "SSM parameter /wind-farm-assistant/s3-bucket-name not found"
    else
        warning "SSM parameter /wind-farm-assistant/s3-bucket-name not found"
    fi
fi

set +e  # Temporarily disable exit on error for AWS CLI
aws ssm get-parameter --name "/wind-farm-assistant/use-s3-storage" --region "$REGION" > /dev/null 2>&1
SSM2_RESULT=$?
set -e  # Re-enable exit on error

if [ $SSM2_RESULT -eq 0 ]; then
    success "SSM parameter /wind-farm-assistant/use-s3-storage exists"
    STORAGE_PARAM=$(aws ssm get-parameter --name "/wind-farm-assistant/use-s3-storage" --region "$REGION" --query 'Parameter.Value' --output text)
    echo "   Value: $STORAGE_PARAM"
else
    if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
        failure "SSM parameter /wind-farm-assistant/use-s3-storage not found"
    else
        warning "SSM parameter /wind-farm-assistant/use-s3-storage not found"
    fi
fi

echo ""
echo "4. Checking File Structure"
echo "--------------------------"

# Check integration layer files
FILES=(
    "src/services/renewable-integration/config.ts"
    "src/services/renewable-integration/types.ts"
    "src/services/renewable-integration/renewableClient.ts"
    "src/services/renewable-integration/responseTransformer.ts"
    "amplify/functions/agents/renewableProxyAgent.ts"
    "src/components/renewable/TerrainMapArtifact.tsx"
    "src/components/renewable/LayoutMapArtifact.tsx"
    "src/components/renewable/SimulationChartArtifact.tsx"
    "src/components/renewable/ReportArtifact.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        failure "$file is missing"
    fi
done

echo ""
echo "5. Checking TypeScript Compilation"
echo "-----------------------------------"

set +e  # Temporarily disable exit on error for build
npm run build > /dev/null 2>&1
BUILD_RESULT=$?
set -e  # Re-enable exit on error

if [ $BUILD_RESULT -eq 0 ]; then
    success "TypeScript compilation successful"
else
    failure "TypeScript compilation failed"
fi

echo ""
echo "6. Running Integration Tests"
echo "-----------------------------"

if [ "$NEXT_PUBLIC_RENEWABLE_ENABLED" = "true" ]; then
    set +e  # Temporarily disable exit on error for test
    npm test -- tests/integration/renewable-integration.test.ts --passWithNoTests > /dev/null 2>&1
    TEST_RESULT=$?
    set -e  # Re-enable exit on error
    
    if [ $TEST_RESULT -eq 0 ]; then
        success "Integration tests passed"
    else
        warning "Integration tests failed or not found"
    fi
else
    warning "Skipping integration tests (renewable integration disabled)"
fi

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ All validation checks passed!${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Validation passed with warnings${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Validation failed with $FAILED error(s)${NC}"
    echo ""
    echo "Please fix the errors and run validation again."
    exit 1
fi

