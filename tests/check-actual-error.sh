#!/bin/bash

# Check actual error from CloudWatch logs

echo "Checking CloudWatch logs for actual error..."
echo ""

# Get orchestrator function name
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text | head -1)

if [ -z "$ORCHESTRATOR" ]; then
    echo "❌ Orchestrator Lambda not found"
    exit 1
fi

echo "Orchestrator: $ORCHESTRATOR"
echo ""
echo "Last 50 log entries (most recent first):"
echo "========================================"
echo ""

aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 30m --format short | tail -50

echo ""
echo "========================================"
echo ""
echo "Looking for errors..."
echo ""

aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 30m --format short | grep -i "error\|fail\|exception" | tail -20
