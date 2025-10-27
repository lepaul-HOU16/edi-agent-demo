#!/bin/bash

echo "=== Strands Agent Deployment Check ==="
echo ""

echo "1. Checking for renewableAgents Lambda function..."
AGENTS_LAMBDA=$(aws lambda list-functions --region us-west-2 --query "Functions[?contains(FunctionName, 'RenewableAgents')].FunctionName" --output text 2>/dev/null)

if [ -z "$AGENTS_LAMBDA" ]; then
  echo "❌ renewableAgents Lambda NOT FOUND"
  echo ""
  echo "This means the sandbox hasn't deployed yet."
  echo ""
  echo "ACTION REQUIRED:"
  echo "1. Stop the current sandbox (Ctrl+C in the terminal where it's running)"
  echo "2. Restart with: npx ampx sandbox"
  echo "3. Wait for 'Deployed' message (5-10 minutes)"
  echo "4. Run this script again"
else
  echo "✅ renewableAgents Lambda FOUND: $AGENTS_LAMBDA"
  echo ""
  
  echo "2. Checking Lambda configuration..."
  aws lambda get-function-configuration \
    --function-name "$AGENTS_LAMBDA" \
    --region us-west-2 \
    --query '{Runtime:Runtime,Timeout:Timeout,Memory:MemorySize,Handler:Handler}' \
    --output table 2>/dev/null
  
  echo ""
  echo "3. Checking environment variables..."
  aws lambda get-function-configuration \
    --function-name "$AGENTS_LAMBDA" \
    --region us-west-2 \
    --query 'Environment.Variables' \
    --output json 2>/dev/null | jq '.'
  
  echo ""
  echo "✅ Deployment looks good! Ready to test."
  echo ""
  echo "Next step: Run tests with:"
  echo "  node tests/test-strands-agents-complete.js"
fi

echo ""
echo "=== End of Check ==="
