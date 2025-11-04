#!/bin/bash
# Direct test of horizon visualization after deployment

echo "=== Testing Horizon Visualization Directly ==="
echo ""
echo "1. Checking agent status..."
cd edicraft-agent
source venv/bin/activate
agentcore status

echo ""
echo "2. Invoking horizon build..."
agentcore invoke '{"prompt": "Build horizon surface in Minecraft"}' > /tmp/horizon-test-output.json 2>&1

echo ""
echo "3. Response received:"
cat /tmp/horizon-test-output.json | jq -r '.response' 2>/dev/null || cat /tmp/horizon-test-output.json

echo ""
echo "4. Checking CloudWatch logs for blocks placed..."
aws logs tail /aws/bedrock-agentcore/runtimes/edicraft-kl1b6iGNug-DEFAULT --since 1m --format short 2>&1 | grep -i "blocks placed\|blocks_affected\|successful_commands"

echo ""
echo "=== Test Complete ==="
