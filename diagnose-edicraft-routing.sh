#!/bin/bash

echo "=== EDIcraft Agent Routing Diagnostic ==="
echo ""

# Check if sandbox is running
echo "1. Checking sandbox status..."
if ps aux | grep "ampx sandbox" | grep -v grep > /dev/null; then
    echo "   ✅ Sandbox is running"
else
    echo "   ❌ Sandbox is NOT running"
    echo "   Run: npx ampx sandbox"
    exit 1
fi

echo ""
echo "2. Checking deployed Lambda functions..."
AGENT_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'agentlambda')].FunctionName" --output text | head -1)
EDICRAFT_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text | head -1)

if [ -n "$AGENT_LAMBDA" ]; then
    echo "   ✅ Agent Lambda found: $AGENT_LAMBDA"
else
    echo "   ❌ Agent Lambda NOT found"
fi

if [ -n "$EDICRAFT_LAMBDA" ]; then
    echo "   ✅ EDIcraft Lambda found: $EDICRAFT_LAMBDA"
else
    echo "   ❌ EDIcraft Lambda NOT found"
fi

echo ""
echo "3. Next steps to test:"
echo "   a. Open your browser to the chat interface"
echo "   b. Select 'EDIcraft' from the agent switcher"
echo "   c. Send message: 'get a well log from well001 and show it in minecraft'"
echo "   d. Open browser console (F12) and look for:"
echo "      - 'Agent selection changed to: edicraft'"
echo "      - 'agentType: edicraft'"
echo ""
echo "4. To check logs after testing:"
echo "   aws logs tail /aws/lambda/$AGENT_LAMBDA --follow"
echo ""
echo "5. Look for these log messages:"
echo "   - '🔀 AgentRouter: Session context:' (should show selectedAgent: 'edicraft')"
echo "   - '✅ AgentRouter: Explicit agent selection' (confirms EDIcraft selected)"
echo "   - '🎮 Routing to EDIcraft Agent' (confirms routing happened)"
echo ""
