#!/bin/bash

# Quick Fix: Update Lambda Environment Variables Directly
# This bypasses the deployment and directly updates the running Lambda

echo "🔧 Quick Fix: Updating Lambda environment variables directly..."
echo ""

# Get the latest Lambda function name
FUNCTION_NAME=$(aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `lightweightAgent`)] | sort_by(@, &LastModified)[-1].FunctionName' \
  --output text)

echo "📍 Found Lambda: $FUNCTION_NAME"
echo ""

# Get current environment variables
echo "📥 Fetching current environment variables..."
CURRENT_ENV=$(aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Environment.Variables' \
  --output json)

# Update the renewable variables
echo "🔄 Updating renewable energy variables..."
UPDATED_ENV=$(echo "$CURRENT_ENV" | python3 -c "
import sys, json
env = json.load(sys.stdin)
env['NEXT_PUBLIC_RENEWABLE_ENABLED'] = 'true'
env['NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT'] = 'arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o'
env['NEXT_PUBLIC_RENEWABLE_S3_BUCKET'] = 'renewable-energy-artifacts-484907533441'
env['NEXT_PUBLIC_RENEWABLE_REGION'] = 'us-east-1'
print(json.dumps({'Variables': env}))
")

# Apply the update
aws lambda update-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --environment "$UPDATED_ENV" \
  > /dev/null

echo "✅ Environment variables updated!"
echo ""

# Verify
echo "🔍 Verifying update..."
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query 'Environment.Variables.NEXT_PUBLIC_RENEWABLE_ENABLED' \
  --output text

echo ""
echo "✅ Done! Renewable features should now be enabled."
echo ""
echo "🧪 Test with a renewable query in the chat interface:"
echo "   'Analyze wind farm potential at coordinates 35.067482, -101.395466'"
