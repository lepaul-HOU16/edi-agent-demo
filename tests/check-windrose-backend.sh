#!/bin/bash

echo "🔍 Checking Wind Rose Backend"
echo "=============================="
echo ""

# Find simulation Lambda
SIMULATION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Simulation') || contains(FunctionName, 'simulation')].FunctionName" --output text 2>/dev/null | head -1)

if [ -z "$SIMULATION" ]; then
    echo "❌ Could not find simulation Lambda"
    exit 1
fi

echo "Found simulation Lambda: $SIMULATION"
echo ""

# Check environment variables
echo "Checking environment variables..."
aws lambda get-function-configuration --function-name "$SIMULATION" --query "Environment.Variables" --output json 2>/dev/null | jq '.'

echo ""
echo "Checking recent errors in logs..."
echo ""

# Get recent logs with errors
aws logs tail "/aws/lambda/$SIMULATION" --since 10m --format short 2>/dev/null | grep -i "error\|exception\|failed\|traceback" | tail -30

echo ""
echo "=============================="
echo "If you see Python errors, the issue is in the backend Lambda"
echo "If you see 'VISUALIZATIONS_AVAILABLE', check if it's True or False"
echo ""
