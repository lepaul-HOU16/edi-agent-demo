#!/bin/bash
# Test the deployed Python agent directly to check for welcome messages

echo "=== Testing EDIcraft Python Agent (Bedrock AgentCore) ==="
echo ""

cd edicraft-agent

# Activate virtual environment
source venv/bin/activate

echo "Test 1: Build wellbore command"
echo "-------------------------------"
agentcore invoke '{"prompt": "Build wellbore trajectory for WELL-001"}' | tee /tmp/edicraft-test1.json
echo ""

# Check for unwanted welcome message
if grep -qi "ready to help you\|what would you like\|welcome to edicraft\|getting started" /tmp/edicraft-test1.json; then
  echo "❌ FAIL: Unwanted welcome message detected in response"
else
  echo "✅ PASS: No welcome message detected"
fi

echo ""
echo "Test 2: List players command"
echo "-----------------------------"
agentcore invoke '{"prompt": "List players"}' | tee /tmp/edicraft-test2.json
echo ""

# Check for unwanted welcome message
if grep -qi "ready to help you\|what would you like\|welcome to edicraft\|getting started" /tmp/edicraft-test2.json; then
  echo "❌ FAIL: Unwanted welcome message detected in response"
else
  echo "✅ PASS: No welcome message detected"
fi

echo ""
echo "Test 3: Search wellbores command"
echo "---------------------------------"
agentcore invoke '{"prompt": "Search for wellbores"}' | tee /tmp/edicraft-test3.json
echo ""

# Check for unwanted welcome message
if grep -qi "ready to help you\|what would you like\|welcome to edicraft\|getting started" /tmp/edicraft-test3.json; then
  echo "❌ FAIL: Unwanted welcome message detected in response"
else
  echo "✅ PASS: No welcome message detected"
fi

echo ""
echo "=== Test Complete ==="
