#!/bin/bash

echo "============================================================"
echo "🔍 DIAGNOSING CURRENT DEPLOYMENT STATE"
echo "============================================================"
echo ""

# Check if sandbox is running
echo "1. Checking if sandbox is running..."
if pgrep -f "ampx sandbox" > /dev/null; then
  echo "   ✅ Sandbox is running"
else
  echo "   ❌ Sandbox is NOT running"
  echo "   → You need to start it: npx ampx sandbox"
fi

echo ""

# Check Lambda versions
echo "2. Checking Lambda deployment times..."
echo ""

WINDROSE=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Windrose')].FunctionName" --output text)
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)
AGENT=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'lightweightAgent')].FunctionName" --output text | head -1)

if [ -n "$WINDROSE" ]; then
  WINDROSE_TIME=$(aws lambda get-function --function-name "$WINDROSE" --query "Configuration.LastModified" --output text)
  echo "   Windrose Lambda: $WINDROSE"
  echo "   Last Modified: $WINDROSE_TIME"
  
  # Check for layer
  LAYERS=$(aws lambda get-function-configuration --function-name "$WINDROSE" --query "Layers[*].Arn" --output text)
  if [ -z "$LAYERS" ]; then
    echo "   ❌ NO LAYER ATTACHED"
  else
    echo "   ✅ Layer attached: $(echo $LAYERS | cut -d: -f7-8)"
  fi
else
  echo "   ❌ Windrose Lambda not found"
fi

echo ""

if [ -n "$ORCHESTRATOR" ]; then
  ORCH_TIME=$(aws lambda get-function --function-name "$ORCHESTRATOR" --query "Configuration.LastModified" --output text)
  echo "   Orchestrator Lambda: $ORCHESTRATOR"
  echo "   Last Modified: $ORCH_TIME"
  
  # Check env var
  ENV_VAR=$(aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query "Environment.Variables.RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME" --output text)
  if [ "$ENV_VAR" = "None" ] || [ -z "$ENV_VAR" ]; then
    echo "   ❌ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME not set"
  else
    echo "   ✅ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME set"
  fi
else
  echo "   ❌ Orchestrator Lambda not found"
fi

echo ""

if [ -n "$AGENT" ]; then
  AGENT_TIME=$(aws lambda get-function --function-name "$AGENT" --query "Configuration.LastModified" --output text)
  echo "   Agent Lambda: $AGENT"
  echo "   Last Modified: $AGENT_TIME"
else
  echo "   ❌ Agent Lambda not found"
fi

echo ""
echo "============================================================"
echo "3. Testing windrose Lambda directly..."
echo "============================================================"
echo ""

if [ -n "$WINDROSE" ]; then
  PAYLOAD='{"query":"test","parameters":{"project_id":"test"}}'
  
  aws lambda invoke \
    --function-name "$WINDROSE" \
    --payload "$PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/windrose-direct-test.json > /dev/null 2>&1
  
  if grep -q "errorMessage" /tmp/windrose-direct-test.json; then
    echo "❌ Windrose Lambda ERROR:"
    cat /tmp/windrose-direct-test.json | jq -r '.errorMessage'
    echo ""
    echo "This is why you're getting text-only responses!"
  elif grep -q '"success": true' /tmp/windrose-direct-test.json; then
    echo "✅ Windrose Lambda works!"
    echo ""
    cat /tmp/windrose-direct-test.json | jq '.'
  else
    echo "⚠️  Unclear response:"
    cat /tmp/windrose-direct-test.json
  fi
fi

echo ""
echo "============================================================"
echo "📋 DIAGNOSIS SUMMARY"
echo "============================================================"
echo ""

if [ -z "$LAYERS" ]; then
  echo "❌ PROBLEM: Windrose Lambda has NO LAYER"
  echo "   → Lambda will fail with ImportModuleError"
  echo "   → This causes text-only responses"
  echo ""
  echo "FIX: Restart sandbox to deploy the layer"
  echo "   npx ampx sandbox"
elif grep -q "ImportModuleError" /tmp/windrose-direct-test.json 2>/dev/null; then
  echo "❌ PROBLEM: Windrose Lambda has ImportModuleError"
  echo "   → Layer may not be deployed yet"
  echo "   → Or layer doesn't contain numpy/matplotlib"
  echo ""
  echo "FIX: Restart sandbox to deploy the layer"
  echo "   npx ampx sandbox"
elif grep -q '"success": true' /tmp/windrose-direct-test.json 2>/dev/null; then
  echo "✅ Windrose Lambda works correctly!"
  echo ""
  echo "If you're still seeing text-only responses, the issue is:"
  echo "   1. Browser cache (hard refresh: Cmd+Shift+R)"
  echo "   2. Old agent version still running"
  echo "   3. Query not routing to renewable agent"
else
  echo "⚠️  Unable to determine issue"
  echo "   Check logs manually"
fi

echo ""
