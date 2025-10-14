#!/bin/bash

# Test script to verify terrain visualization S3 storage
# This script invokes the terrain Lambda and checks if S3 URLs are returned

set -e

echo "🧪 Testing Terrain Visualization S3 Storage"
echo "============================================"
echo ""

# Get the terrain Lambda function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Terrain Lambda function not found"
    exit 1
fi

echo "✅ Found terrain Lambda: $FUNCTION_NAME"
echo ""

# Check environment variables
echo "🔍 Checking S3 configuration..."
S3_BUCKET=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables.RENEWABLE_S3_BUCKET" --output text)
AWS_REGION=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables.RENEWABLE_AWS_REGION" --output text)

echo "   S3 Bucket: $S3_BUCKET"
echo "   AWS Region: $AWS_REGION"
echo ""

if [ -z "$S3_BUCKET" ] || [ "$S3_BUCKET" == "None" ]; then
    echo "⚠️  WARNING: S3 bucket not configured"
    echo "   Visualizations will not be stored"
else
    echo "✅ S3 bucket is configured"
fi
echo ""

# Invoke the terrain Lambda
echo "📍 Invoking terrain analysis..."
PAYLOAD='{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "radius_km": 5,
  "project_id": "test-terrain-'$(date +%s)'"
}'

echo "   Payload: $PAYLOAD"
echo ""

RESPONSE=$(aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/terrain-response.json 2>&1)

echo "📦 Lambda invocation response:"
echo "$RESPONSE"
echo ""

# Check the response
if [ -f /tmp/terrain-response.json ]; then
    echo "📄 Response body:"
    cat /tmp/terrain-response.json | jq '.'
    echo ""
    
    # Check for S3 URLs
    echo "🔍 Checking for S3 URLs..."
    MAP_URL=$(cat /tmp/terrain-response.json | jq -r '.body' | jq -r '.data.mapUrl // empty')
    
    if [ -n "$MAP_URL" ]; then
        echo "✅ Map URL found: $MAP_URL"
        
        # Verify it's an S3 URL
        if [[ $MAP_URL == https://*.s3.*.amazonaws.com/* ]]; then
            echo "✅ URL is a valid S3 URL"
        else
            echo "⚠️  URL is not an S3 URL"
        fi
    else
        echo "⚠️  No map URL in response"
        
        # Check for visualization error
        VIZ_ERROR=$(cat /tmp/terrain-response.json | jq -r '.body' | jq -r '.data.visualizationError // empty')
        if [ -n "$VIZ_ERROR" ]; then
            echo "   Visualization error: $VIZ_ERROR"
        fi
    fi
    echo ""
    
    # Check for inline HTML (should NOT be present)
    echo "🔍 Checking for inline HTML..."
    MAP_HTML=$(cat /tmp/terrain-response.json | jq -r '.body' | jq -r '.data.mapHtml // empty')
    
    if [ -n "$MAP_HTML" ]; then
        echo "❌ FAIL: Inline HTML found in response (size issue!)"
        echo "   HTML length: ${#MAP_HTML} characters"
    else
        echo "✅ PASS: No inline HTML in response (prevents size issues)"
    fi
    echo ""
    
    # Check response size
    RESPONSE_SIZE=$(stat -f%z /tmp/terrain-response.json 2>/dev/null || stat -c%s /tmp/terrain-response.json 2>/dev/null)
    RESPONSE_SIZE_KB=$((RESPONSE_SIZE / 1024))
    echo "📏 Response size: $RESPONSE_SIZE bytes ($RESPONSE_SIZE_KB KB)"
    
    if [ $RESPONSE_SIZE -lt 102400 ]; then
        echo "✅ PASS: Response size is under 100KB limit"
    else
        echo "⚠️  WARNING: Response size exceeds 100KB"
    fi
    
    rm /tmp/terrain-response.json
else
    echo "❌ Response file not found"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ Test complete"
