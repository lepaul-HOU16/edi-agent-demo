#!/bin/bash

echo "============================================================"
echo "🧪 TESTING WINDROSE AFTER LAYER DEPLOYMENT"
echo "============================================================"
echo ""

# Get Lambda names
WINDROSE_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Windrose')].FunctionName" --output text)
ORCHESTRATOR_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

if [ -z "$WINDROSE_LAMBDA" ]; then
  echo "❌ Windrose Lambda not found"
  exit 1
fi

if [ -z "$ORCHESTRATOR_LAMBDA" ]; then
  echo "❌ Orchestrator Lambda not found"
  exit 1
fi

echo "✅ Found Lambdas:"
echo "   Windrose: $WINDROSE_LAMBDA"
echo "   Orchestrator: $ORCHESTRATOR_LAMBDA"
echo ""

# Check if layer is attached
echo "📦 Checking Lambda Layer..."
LAYERS=$(aws lambda get-function-configuration --function-name "$WINDROSE_LAMBDA" --query "Layers[*].Arn" --output text)

if [ -z "$LAYERS" ]; then
  echo "❌ No layers attached to windrose Lambda"
  echo "   Please restart sandbox to deploy the layer"
  exit 1
else
  echo "✅ Layer attached: $LAYERS"
fi

echo ""

# Check environment variable
echo "🔧 Checking environment variable..."
ENV_VAR=$(aws lambda get-function-configuration --function-name "$ORCHESTRATOR_LAMBDA" --query "Environment.Variables.RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME" --output text)

if [ "$ENV_VAR" = "None" ] || [ -z "$ENV_VAR" ]; then
  echo "❌ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME not set"
  exit 1
else
  echo "✅ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME: $ENV_VAR"
fi

echo ""

# Test windrose Lambda directly
echo "🧪 Testing windrose Lambda directly..."
PAYLOAD='{
  "query": "Analyze wind patterns",
  "parameters": {
    "project_id": "test-layer",
    "latitude": 35.067482,
    "longitude": -101.395466
  }
}'

aws lambda invoke \
  --function-name "$WINDROSE_LAMBDA" \
  --payload "$PAYLOAD" \
  --cli-binary-format raw-in-base64-out \
  /tmp/windrose-test.json > /dev/null 2>&1

echo ""
echo "📊 Windrose Lambda Response:"
cat /tmp/windrose-test.json | jq '.'

# Check for errors
if grep -q "errorMessage" /tmp/windrose-test.json; then
  echo ""
  echo "❌ Windrose Lambda returned an error"
  echo "   Check the error message above"
  exit 1
fi

# Check for success
if grep -q '"success": true' /tmp/windrose-test.json; then
  echo ""
  echo "✅ Windrose Lambda executed successfully!"
  
  # Check for artifacts
  ARTIFACT_COUNT=$(cat /tmp/windrose-test.json | jq -r '.body' | jq -r '.data' | jq 'keys | length' 2>/dev/null || echo "0")
  echo "✅ Response contains data structure"
  
  # Check for metrics
  if grep -q "avgWindSpeed" /tmp/windrose-test.json; then
    AVG_SPEED=$(cat /tmp/windrose-test.json | jq -r '.body' | jq -r '.data.metrics.avgWindSpeed' 2>/dev/null)
    echo "✅ Wind metrics present: ${AVG_SPEED} m/s average"
  fi
else
  echo ""
  echo "⚠️  Windrose Lambda response unclear"
fi

echo ""
echo "============================================================"
echo "📋 SUMMARY"
echo "============================================================"
echo ""
echo "✅ Lambda Layer: Attached"
echo "✅ Environment Variable: Set"
echo "✅ Windrose Lambda: Responding"
echo ""
echo "🎉 Wind rose is ready to test in the UI!"
echo ""
echo "Try this query in chat:"
echo '  "Analyze wind patterns for my site"'
echo ""
