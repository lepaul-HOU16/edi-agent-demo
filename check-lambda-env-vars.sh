#!/bin/bash
# Check what environment variables the deployed Lambda actually has

echo "=== Checking EDIcraft Lambda Environment Variables ==="
echo ""

# Get the Lambda function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraftAgent')].FunctionName" --output text 2>/dev/null | head -1)

if [ -z "$FUNCTION_NAME" ]; then
  echo "❌ Could not find edicraftAgent Lambda function"
  echo ""
  echo "Available functions:"
  aws lambda list-functions --query "Functions[].FunctionName" --output text
  exit 1
fi

echo "Found Lambda: $FUNCTION_NAME"
echo ""

# Get environment variables
echo "Environment Variables:"
aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query "Environment.Variables" \
  --output json | jq '.'

echo ""
echo "=== Checking Required Variables ==="
echo ""

# Check specific required variables
for VAR in BEDROCK_AGENT_ID BEDROCK_AGENT_ALIAS_ID MINECRAFT_RCON_PASSWORD; do
  VALUE=$(aws lambda get-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --query "Environment.Variables.$VAR" \
    --output text 2>/dev/null)
  
  if [ "$VALUE" == "None" ] || [ -z "$VALUE" ]; then
    echo "❌ $VAR: NOT SET or empty"
  else
    echo "✅ $VAR: $VALUE"
  fi
done

echo ""
echo "=== Summary ==="
echo "If any variables show as 'NOT SET', the sandbox needs to redeploy."
echo "Try: Stop sandbox (Ctrl+C) and restart with 'npx ampx sandbox'"
