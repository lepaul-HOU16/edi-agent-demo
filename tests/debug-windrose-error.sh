#!/bin/bash

echo "🔍 Debugging Wind Rose Error"
echo "============================="
echo ""

# Find the orchestrator Lambda
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null)

if [ -z "$ORCHESTRATOR" ]; then
    echo "❌ Could not find orchestrator Lambda"
    echo "Are you in the sandbox environment?"
    exit 1
fi

echo "Found orchestrator: $ORCHESTRATOR"
echo ""
echo "Checking recent logs for errors..."
echo ""

# Get recent logs
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 5m --format short 2>/dev/null | grep -A 5 -B 5 "ERROR\|error\|failed\|Failed" | tail -50

echo ""
echo "============================="
echo "Check for:"
echo "1. Parameter validation errors"
echo "2. Lambda invocation failures"
echo "3. Missing environment variables"
echo "4. Python import errors"
echo ""
echo "To see full logs:"
echo "aws logs tail /aws/lambda/$ORCHESTRATOR --follow"
