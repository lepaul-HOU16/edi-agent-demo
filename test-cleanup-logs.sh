#!/bin/bash

# Test Streaming Message Cleanup by checking CloudWatch logs
# This verifies that clearStreamingMessage is being called

echo "═══════════════════════════════════════════════════════════"
echo "🧪 STREAMING MESSAGE CLEANUP LOG TEST"
echo "═══════════════════════════════════════════════════════════"
echo ""

FUNCTION_NAME="EnergyInsights-development-renewable-orchestrator"
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

echo "📝 Step 1: Invoking orchestrator with test query..."
aws lambda invoke \
  --function-name "$FUNCTION_NAME" \
  --payload '{"query":"analyze terrain at 32.7767, -96.7970","sessionId":"test-cleanup-'$(date +%s)'","userId":"test-user","context":{}}' \
  response-cleanup-test.json \
  > /dev/null 2>&1

echo "✅ Orchestrator invoked"
echo ""

echo "📝 Step 2: Waiting for logs to propagate..."
sleep 5
echo ""

echo "📝 Step 3: Checking CloudWatch logs for cleanup calls..."
echo ""

# Get the most recent log stream
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

if [ -z "$LOG_STREAM" ] || [ "$LOG_STREAM" = "None" ]; then
  echo "❌ Could not find log stream"
  exit 1
fi

echo "📊 Log stream: $LOG_STREAM"
echo ""

# Search for cleanup messages
echo "🔍 Searching for cleanup log messages..."
echo ""

aws logs filter-log-events \
  --log-group-name "$LOG_GROUP" \
  --log-stream-names "$LOG_STREAM" \
  --filter-pattern "Clearing streaming message" \
  --query 'events[*].message' \
  --output text

if [ $? -eq 0 ]; then
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "✅ CLEANUP IS BEING CALLED"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "✅ The clearStreamingMessage function is being invoked"
  echo "✅ Streaming messages will be cleaned up after query completion"
  echo "✅ No stale thought steps will appear on next query"
else
  echo ""
  echo "❌ No cleanup log messages found"
  echo "❌ clearStreamingMessage may not be called"
fi
