#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "✅ STREAMING MESSAGE CLEANUP VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

TABLE_NAME="ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE"
TEST_SESSION="verify-cleanup-$(date +%s)"
STREAMING_ID="streaming-$TEST_SESSION"

echo "📝 Step 1: Creating test streaming message..."
aws dynamodb put-item \
  --table-name "$TABLE_NAME" \
  --item '{
    "id": {"S": "'"$STREAMING_ID"'"},
    "role": {"S": "ai-stream"},
    "thoughtSteps": {"L": [
      {"M": {
        "step": {"N": "1"},
        "action": {"S": "Test step"},
        "status": {"S": "in_progress"},
        "timestamp": {"S": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}
      }}
    ]},
    "owner": {"S": "test-user"},
    "createdAt": {"S": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"},
    "updatedAt": {"S": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}
  }' > /dev/null 2>&1

echo "✅ Created streaming message: $STREAMING_ID"
echo ""

echo "📝 Step 2: Verifying message exists..."
ITEM=$(aws dynamodb get-item \
  --table-name "$TABLE_NAME" \
  --key '{"id": {"S": "'"$STREAMING_ID"'"}}' \
  --query 'Item.id.S' \
  --output text 2>/dev/null)

if [ "$ITEM" = "$STREAMING_ID" ]; then
  echo "✅ Streaming message exists in DynamoDB"
else
  echo "❌ Failed to create streaming message"
  exit 1
fi
echo ""

echo "📝 Step 3: Invoking orchestrator to trigger cleanup..."
aws lambda invoke \
  --function-name EnergyInsights-development-renewable-orchestrator \
  --cli-binary-format raw-in-base64-out \
  --payload '{"query":"analyze terrain at 32.7767, -96.7970","sessionId":"'"$TEST_SESSION"'","userId":"test-user","context":{}}' \
  response-verify.json > /dev/null 2>&1

echo "✅ Orchestrator invoked"
echo ""

echo "📝 Step 4: Waiting for cleanup to complete..."
sleep 3
echo ""

echo "📝 Step 5: Verifying message was deleted..."
ITEM_AFTER=$(aws dynamodb get-item \
  --table-name "$TABLE_NAME" \
  --key '{"id": {"S": "'"$STREAMING_ID"'"}}' \
  --query 'Item.id.S' \
  --output text 2>/dev/null)

if [ "$ITEM_AFTER" = "None" ] || [ -z "$ITEM_AFTER" ]; then
  echo "✅ Streaming message successfully deleted!"
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ CLEANUP IS WORKING CORRECTLY"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "✅ Streaming messages are cleaned up after query completion"
  echo "✅ No stale thought steps will appear on next query"
  echo "✅ Task 7 implementation is complete and verified"
else
  echo "❌ Streaming message still exists: $ITEM_AFTER"
  echo "❌ Cleanup may not be working correctly"
  exit 1
fi
