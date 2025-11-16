#!/bin/bash

# Test CloudFront Distribution Setup
# Verifies that CloudFront is properly configured with both S3 and API Gateway origins

set -e

echo "🧪 Testing CloudFront Distribution Setup..."
echo ""

# Get stack name
STACK_NAME=${STACK_NAME:-"EnergyDataInsightsStack"}

# Get CloudFront distribution ID
echo "1️⃣ Getting CloudFront distribution ID..."
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "❌ Error: CloudFront distribution not found"
  exit 1
fi

echo "✅ Distribution ID: $DISTRIBUTION_ID"
echo ""

# Get CloudFront domain
echo "2️⃣ Getting CloudFront domain..."
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" \
  --output text)

echo "✅ CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo ""

# Get distribution configuration
echo "3️⃣ Checking distribution configuration..."
DISTRIBUTION_CONFIG=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID")

# Check origins
echo "📍 Checking origins..."
ORIGINS=$(echo "$DISTRIBUTION_CONFIG" | jq -r '.Distribution.DistributionConfig.Origins.Items[] | "\(.Id): \(.DomainName)"')
echo "$ORIGINS"
echo ""

# Verify S3 origin exists
S3_ORIGIN=$(echo "$ORIGINS" | grep -i "s3" || true)
if [ -z "$S3_ORIGIN" ]; then
  echo "⚠️  Warning: S3 origin not found"
else
  echo "✅ S3 origin configured"
fi

# Verify API Gateway origin exists
API_ORIGIN=$(echo "$ORIGINS" | grep -i "execute-api" || true)
if [ -z "$API_ORIGIN" ]; then
  echo "⚠️  Warning: API Gateway origin not found"
else
  echo "✅ API Gateway origin configured"
fi
echo ""

# Check cache behaviors
echo "4️⃣ Checking cache behaviors..."
BEHAVIORS=$(echo "$DISTRIBUTION_CONFIG" | jq -r '.Distribution.DistributionConfig.CacheBehaviors.Items[]? | "Path: \(.PathPattern), Origin: \(.TargetOriginId)"')

if [ -z "$BEHAVIORS" ]; then
  echo "⚠️  No additional cache behaviors configured"
else
  echo "$BEHAVIORS"
  
  # Check for /api/* behavior
  API_BEHAVIOR=$(echo "$BEHAVIORS" | grep "/api/\*" || true)
  if [ -z "$API_BEHAVIOR" ]; then
    echo "⚠️  Warning: /api/* behavior not found"
  else
    echo "✅ /api/* behavior configured"
  fi
fi
echo ""

# Check error responses
echo "5️⃣ Checking error responses (SPA routing)..."
ERROR_RESPONSES=$(echo "$DISTRIBUTION_CONFIG" | jq -r '.Distribution.DistributionConfig.CustomErrorResponses.Items[]? | "HTTP \(.ErrorCode) → \(.ResponseCode) (\(.ResponsePagePath))"')

if [ -z "$ERROR_RESPONSES" ]; then
  echo "⚠️  No custom error responses configured"
else
  echo "$ERROR_RESPONSES"
  
  # Check for 404 → 200 redirect
  ERROR_404=$(echo "$ERROR_RESPONSES" | grep "404" || true)
  if [ -z "$ERROR_404" ]; then
    echo "⚠️  Warning: 404 error response not configured"
  else
    echo "✅ 404 error response configured for SPA routing"
  fi
fi
echo ""

# Test static file access
echo "6️⃣ Testing static file access..."
STATIC_URL="https://$CLOUDFRONT_DOMAIN/"
STATIC_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$STATIC_URL" || echo "000")

if [ "$STATIC_RESPONSE" = "200" ]; then
  echo "✅ Static files accessible (HTTP $STATIC_RESPONSE)"
elif [ "$STATIC_RESPONSE" = "403" ] || [ "$STATIC_RESPONSE" = "404" ]; then
  echo "⚠️  Static files not yet deployed (HTTP $STATIC_RESPONSE)"
  echo "   Run: npm run build && ./scripts/deploy-frontend.sh"
else
  echo "❌ Error accessing static files (HTTP $STATIC_RESPONSE)"
fi
echo ""

# Test API access through CloudFront
echo "7️⃣ Testing API access through CloudFront..."
API_URL="https://$CLOUDFRONT_DOMAIN/api/health"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL" || echo "000")

if [ "$API_RESPONSE" = "200" ]; then
  echo "✅ API accessible through CloudFront (HTTP $API_RESPONSE)"
elif [ "$API_RESPONSE" = "401" ] || [ "$API_RESPONSE" = "403" ]; then
  echo "✅ API accessible but requires authentication (HTTP $API_RESPONSE)"
else
  echo "⚠️  API not accessible (HTTP $API_RESPONSE)"
  echo "   This is expected if the stack hasn't been deployed yet"
fi
echo ""

# Get frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)

echo "📊 Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Distribution ID: $DISTRIBUTION_ID"
echo "CloudFront URL:  $FRONTEND_URL"
echo "API via CF:      https://$CLOUDFRONT_DOMAIN/api"
echo ""
echo "Next steps:"
echo "1. Deploy frontend: npm run build && ./scripts/deploy-frontend.sh"
echo "2. Access app:      $FRONTEND_URL"
echo "3. Test API:        https://$CLOUDFRONT_DOMAIN/api/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
