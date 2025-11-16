#!/bin/bash

# Deploy frontend to S3 + CloudFront
# This script builds the Vite app and deploys it to S3, then invalidates CloudFront cache

set -e

echo "🚀 Deploying frontend to S3 + CloudFront..."
echo ""

# Get the stack name and environment
STACK_NAME=${STACK_NAME:-"EnergyDataInsightsStack"}
ENVIRONMENT=${ENVIRONMENT:-"development"}

# ============================================================================
# Step 1: Get CDK Outputs
# ============================================================================

echo "1️⃣ Getting CDK stack outputs..."

# Get the S3 bucket name from CDK outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Error: Could not find frontend bucket name in CDK outputs"
  echo "Make sure the CDK stack is deployed first:"
  echo "  cd cdk && cdk deploy"
  exit 1
fi

echo "✅ S3 Bucket: $BUCKET_NAME"

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "⚠️  Warning: CloudFront distribution not found"
  echo "Deployment will continue but cache won't be invalidated"
else
  echo "✅ CloudFront Distribution: $DISTRIBUTION_ID"
fi

# Get API URL (via CloudFront)
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrlViaCloudFront'].OutputValue" \
  --output text 2>/dev/null || echo "")

if [ -z "$API_URL" ]; then
  # Fallback to direct API Gateway URL
  API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
    --output text 2>/dev/null || echo "")
fi

if [ -n "$API_URL" ]; then
  echo "✅ API URL: $API_URL"
  
  # Set environment variable for build
  export VITE_API_URL="$API_URL"
  export NEXT_PUBLIC_API_URL="$API_URL"
else
  echo "⚠️  Warning: API URL not found, using default"
fi

echo ""

# ============================================================================
# Step 2: Build Frontend
# ============================================================================

echo "2️⃣ Building frontend..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Error: Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build complete"
echo ""

# ============================================================================
# Step 3: Upload to S3
# ============================================================================

echo "3️⃣ Uploading to S3..."

# Count files to upload
FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')
echo "📦 Uploading $FILE_COUNT files..."

# Sync all files except index.html with long cache
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Upload HTML files with no-cache (for SPA routing)
find dist -name "*.html" -type f | while read -r file; do
  s3_path="${file#dist/}"
  aws s3 cp "$file" "s3://$BUCKET_NAME/$s3_path" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"
done

echo "✅ Upload complete"
echo ""

# ============================================================================
# Step 4: Invalidate CloudFront Cache
# ============================================================================

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "4️⃣ Invalidating CloudFront cache..."
  
  INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query "Invalidation.Id" \
    --output text)
  
  echo "✅ Invalidation started: $INVALIDATION_ID"
  echo "⏳ Cache invalidation takes 5-10 minutes to complete"
  echo ""
else
  echo "4️⃣ Skipping CloudFront invalidation (no distribution found)"
  echo ""
fi

# ============================================================================
# Step 5: Get URLs and Summary
# ============================================================================

echo "5️⃣ Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get the frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

# Get S3 website URL (fallback)
S3_WEBSITE_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketWebsiteUrl'].OutputValue" \
  --output text 2>/dev/null || echo "")

echo "✅ Frontend deployed successfully!"
echo ""
echo "📍 Access URLs:"
if [ -n "$FRONTEND_URL" ]; then
  echo "   CloudFront: $FRONTEND_URL (recommended)"
fi
if [ -n "$S3_WEBSITE_URL" ]; then
  echo "   S3 Direct:  $S3_WEBSITE_URL (for testing)"
fi
if [ -n "$API_URL" ]; then
  echo "   API:        $API_URL"
fi
echo ""
echo "📊 Deployment Details:"
echo "   Stack:       $STACK_NAME"
echo "   Environment: $ENVIRONMENT"
echo "   S3 Bucket:   $BUCKET_NAME"
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "   CloudFront:  $DISTRIBUTION_ID"
fi
echo "   Files:       $FILE_COUNT"
echo ""
echo "🎉 Deployment complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
