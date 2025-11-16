#!/bin/bash

echo "=========================================="
echo "Check Lambda Code Version"
echo "=========================================="
echo ""

LAMBDA_NAME="amplify-digitalassistant--renewableToolslambda2531-0hD8aJyAkObh"

echo "Invoking Lambda to trigger cold start..."
echo ""

# Invoke the Lambda with a test event
aws lambda invoke \
  --function-name "$LAMBDA_NAME" \
  --payload '{"info":{"fieldName":"test"}}' \
  --log-type Tail \
  /dev/null 2>&1 | jq -r '.LogResult' | base64 -d | grep "RENEWABLE TOOLS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NEW CODE v3.0 IS DEPLOYED"
else
    echo ""
    echo "❌ OLD CODE IS STILL RUNNING"
    echo ""
    echo "Full init logs:"
    aws lambda invoke \
      --function-name "$LAMBDA_NAME" \
      --payload '{"info":{"fieldName":"test"}}' \
      --log-type Tail \
      /dev/null 2>&1 | jq -r '.LogResult' | base64 -d
fi

echo ""
