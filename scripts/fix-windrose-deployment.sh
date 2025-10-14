#!/bin/bash

echo "============================================================"
echo "🔧 FIXING WINDROSE DEPLOYMENT"
echo "============================================================"

echo ""
echo "📋 Current Status:"
echo ""

# Check if windrose Lambda exists
WINDROSE_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Windrose')].FunctionName" --output text)

if [ -z "$WINDROSE_LAMBDA" ]; then
  echo "❌ Windrose Lambda NOT deployed"
else
  echo "✅ Windrose Lambda found: $WINDROSE_LAMBDA"
fi

# Check orchestrator environment variable
ORCHESTRATOR_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

if [ -n "$ORCHESTRATOR_LAMBDA" ]; then
  echo "✅ Orchestrator found: $ORCHESTRATOR_LAMBDA"
  
  ENV_VAR=$(aws lambda get-function-configuration --function-name "$ORCHESTRATOR_LAMBDA" --query "Environment.Variables.RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME" --output text)
  
  if [ "$ENV_VAR" = "None" ] || [ -z "$ENV_VAR" ]; then
    echo "❌ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME NOT SET in orchestrator"
  else
    echo "✅ RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME: $ENV_VAR"
  fi
else
  echo "❌ Orchestrator NOT found"
fi

echo ""
echo "============================================================"
echo "🚀 SOLUTION"
echo "============================================================"
echo ""
echo "The windrose Lambda needs to be deployed via Amplify sandbox."
echo ""
echo "Run this command to deploy all changes:"
echo ""
echo "  npx ampx sandbox"
echo ""
echo "This will:"
echo "  1. Deploy the windrose Lambda function"
echo "  2. Set the RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME environment variable"
echo "  3. Configure IAM permissions"
echo "  4. Make the complete wind rose flow functional"
echo ""
echo "After deployment completes, test with:"
echo "  node tests/verify-windrose-deployment.js"
echo ""
