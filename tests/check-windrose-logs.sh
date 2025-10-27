#!/bin/bash

echo "🔍 Checking Wind Rose Logs"
echo "=========================="
echo ""

# Step 1: Find orchestrator Lambda
echo "Finding orchestrator Lambda..."
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null | head -1)

if [ -z "$ORCHESTRATOR" ]; then
    echo "❌ Could not find orchestrator Lambda"
    echo ""
    echo "Trying alternative search..."
    aws lambda list-functions --query "Functions[].FunctionName" --output text 2>/dev/null | grep -i orchestrator
    exit 1
fi

echo "✅ Found: $ORCHESTRATOR"
echo ""

# Step 2: Get recent logs
echo "Fetching recent logs (last 5 minutes)..."
echo "Looking for result types..."
echo ""

aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 5m --format short 2>/dev/null | grep -E "Results types|result\.type|DEBUG.*Results|Artifact types" | tail -20

echo ""
echo "=========================="
echo ""
echo "What to look for:"
echo "  - 'Results types: [...]' - Shows what backend returned"
echo "  - 'Artifact types: [...]' - Shows what orchestrator created"
echo ""
echo "If you see a type that's NOT 'wind_rose_analysis', that's the problem!"
echo ""
echo "Full logs command:"
echo "aws logs tail /aws/lambda/$ORCHESTRATOR --follow"
