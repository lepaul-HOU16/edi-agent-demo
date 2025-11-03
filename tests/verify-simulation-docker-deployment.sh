#!/bin/bash

echo "🔍 Verifying Simulation Lambda Docker Deployment"
echo "================================================"
echo ""

# Get function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

if [ -z "$FUNCTION_NAME" ]; then
    echo "❌ Simulation Lambda not found"
    exit 1
fi

echo "✅ Found function: $FUNCTION_NAME"
echo ""

# Check deployment configuration
echo "📦 Deployment Configuration:"
aws lambda get-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --query '{PackageType: PackageType, CodeSize: CodeSize, Runtime: Runtime, Timeout: Timeout, MemorySize: MemorySize}' \
    --output json

echo ""
echo "🧪 Testing wind rose generation..."

# Create test payload
cat > /tmp/windrose-test-payload.json <<EOF
{
  "action": "wind_rose",
  "parameters": {
    "project_id": "test-windrose-docker-$(date +%s)",
    "latitude": 35.067482,
    "longitude": -101.395466,
    "wind_speed": 8.5
  }
}
EOF

# Invoke Lambda
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --cli-binary-format raw-in-base64-out \
    --payload file:///tmp/windrose-test-payload.json \
    /tmp/windrose-response.json

echo ""
echo "📊 Response:"
cat /tmp/windrose-response.json | jq '.'

echo ""
echo "🔍 Checking for Plotly data..."
HAS_PLOTLY=$(cat /tmp/windrose-response.json | jq -r '.data.plotlyWindRose != null')

if [ "$HAS_PLOTLY" = "true" ]; then
    echo "✅ Plotly wind rose data found!"
    cat /tmp/windrose-response.json | jq '.data.plotlyWindRose | keys'
else
    echo "❌ No Plotly wind rose data in response"
    echo ""
    echo "Response structure:"
    cat /tmp/windrose-response.json | jq '.data | keys'
fi

# Cleanup
rm -f /tmp/windrose-test-payload.json /tmp/windrose-response.json

echo ""
echo "================================================"
echo "Verification complete"
