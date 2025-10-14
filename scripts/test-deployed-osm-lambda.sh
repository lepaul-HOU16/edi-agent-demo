#!/bin/bash
# Test the deployed Lambda function to verify OSM integration works

echo "🧪 Testing Deployed OSM Lambda Function"
echo "========================================"
echo ""

# Get the Lambda function name from the stack
FUNCTION_NAME=$(aws lambda list-functions --region us-east-1 --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text | head -1)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Could not find RenewableTerrainTool Lambda function"
    echo "   Make sure the sandbox is deployed"
    exit 1
fi

echo "✅ Found Lambda function: $FUNCTION_NAME"
echo ""

# Create test payload (handler expects parameters nested under 'parameters' key)
TEST_PAYLOAD='{
  "parameters": {
    "latitude": 35.2220,
    "longitude": -101.8313,
    "radius_km": 5.0,
    "project_id": "test-osm-integration"
  }
}'

echo "📡 Invoking Lambda function with test payload..."
echo "   Location: Amarillo, TX (35.2220, -101.8313)"
echo "   Radius: 5km"
echo ""

# Invoke the Lambda function
RESPONSE=$(aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload "$TEST_PAYLOAD" \
  --region us-east-1 \
  --cli-binary-format raw-in-base64-out \
  /tmp/lambda-response.json 2>&1)

INVOKE_STATUS=$?

if [ $INVOKE_STATUS -ne 0 ]; then
    echo "❌ Lambda invocation failed:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Lambda invocation successful"
echo ""

# Parse the response
if [ -f /tmp/lambda-response.json ]; then
    echo "📊 Response Analysis:"
    echo "===================="
    
    # Check for errors
    if grep -q "errorMessage" /tmp/lambda-response.json; then
        echo "❌ Lambda returned an error:"
        cat /tmp/lambda-response.json | jq -r '.errorMessage' 2>/dev/null || cat /tmp/lambda-response.json
        exit 1
    fi
    
    # Extract key metrics
    FEATURE_COUNT=$(cat /tmp/lambda-response.json | jq -r '.geojson.metadata.feature_count // .metadata.feature_count // 0' 2>/dev/null)
    DATA_SOURCE=$(cat /tmp/lambda-response.json | jq -r '.geojson.metadata.source // .metadata.source // "unknown"' 2>/dev/null)
    
    echo "Feature Count: $FEATURE_COUNT"
    echo "Data Source: $DATA_SOURCE"
    echo ""
    
    # Determine success
    if [ "$DATA_SOURCE" = "openstreetmap" ] || [ "$DATA_SOURCE" = "openstreetmap_real" ]; then
        if [ "$FEATURE_COUNT" -gt 10 ]; then
            echo "🎉 SUCCESS: OSM integration is working!"
            echo "   ✅ Real OpenStreetMap data retrieved"
            echo "   ✅ Feature count: $FEATURE_COUNT (expected >10)"
            echo ""
            echo "Full response saved to: /tmp/lambda-response.json"
            exit 0
        else
            echo "⚠️  WARNING: Real OSM data but low feature count"
            echo "   Feature count: $FEATURE_COUNT (expected >10)"
            exit 1
        fi
    elif [ "$DATA_SOURCE" = "synthetic_fallback" ]; then
        echo "❌ FAILURE: Still using synthetic fallback data"
        echo "   This means aiohttp is still not available in Lambda"
        echo ""
        echo "Troubleshooting steps:"
        echo "1. Check Lambda logs:"
        echo "   aws logs tail /aws/lambda/$FUNCTION_NAME --follow --region us-east-1"
        echo ""
        echo "2. Verify layer is attached:"
        echo "   aws lambda get-function --function-name $FUNCTION_NAME --region us-east-1"
        echo ""
        echo "Full response:"
        cat /tmp/lambda-response.json | jq '.' 2>/dev/null || cat /tmp/lambda-response.json
        exit 1
    else
        echo "⚠️  UNKNOWN: Unexpected data source: $DATA_SOURCE"
        echo ""
        echo "Full response:"
        cat /tmp/lambda-response.json | jq '.' 2>/dev/null || cat /tmp/lambda-response.json
        exit 1
    fi
else
    echo "❌ Response file not found"
    exit 1
fi
