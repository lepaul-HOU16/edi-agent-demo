#!/bin/bash
# Test the deployed EDIcraft agent

echo "=== Testing Deployed EDIcraft Agent ==="
echo ""

cd edicraft-agent
source venv/bin/activate

echo "Test 1: List players"
echo "Command: List players in Minecraft"
echo ""
agentcore invoke '{"prompt": "List players in Minecraft"}' 2>&1 | grep -A 20 "response"

echo ""
echo "================================"
echo ""

echo "Test 2: Build wellbore"
echo "Command: Build wellbore trajectory for WELL-001"
echo ""
agentcore invoke '{"prompt": "Build wellbore trajectory for WELL-001"}' 2>&1 | grep -A 20 "response"

echo ""
echo "=== Test Complete ==="
