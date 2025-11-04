#!/bin/bash
# Verification script to check if horizon fixes are deployed

echo "=========================================="
echo "HORIZON DEPLOYMENT VERIFICATION"
echo "=========================================="
echo ""

# Check 1: Verify only one horizon_success method exists
echo "✓ Checking response_templates.py..."
horizon_count=$(grep -c "def horizon_success" edicraft-agent/tools/response_templates.py)
if [ "$horizon_count" -eq 1 ]; then
    echo "  ✅ Only 1 horizon_success method found (correct)"
else
    echo "  ❌ Found $horizon_count horizon_success methods (should be 1)"
fi

# Check 2: Verify Minecraft-space gap filling exists
echo ""
echo "✓ Checking horizon_tools.py for gap filling..."
if grep -q "CRITICAL: Fill gaps in Minecraft space" edicraft-agent/tools/horizon_tools.py; then
    echo "  ✅ Minecraft-space gap filling code present"
else
    echo "  ❌ Gap filling code NOT found"
fi

# Check 3: Verify rich response message
echo ""
echo "✓ Checking for rich OSDU response..."
if grep -q "🌍 OSDU Data Integration" edicraft-agent/tools/response_templates.py; then
    echo "  ✅ Rich OSDU integration message present"
else
    echo "  ❌ Rich response message NOT found"
fi

# Check 4: Verify interpolation density
echo ""
echo "✓ Checking interpolation density..."
if grep -q "int(segment_length \* 5)" edicraft-agent/tools/horizon_tools.py; then
    echo "  ✅ 5 points/unit interpolation configured"
else
    echo "  ❌ Interpolation density not correct"
fi

echo ""
echo "=========================================="
echo "DEPLOYMENT STATUS"
echo "=========================================="
echo ""
echo "If all checks pass above, the CODE is correct."
echo ""
echo "If horizon is still gappy after deployment:"
echo "1. Stop the agentcore process completely"
echo "2. Clear any Python cache: rm -rf edicraft-agent/**/__pycache__"
echo "3. Restart agentcore"
echo "4. Test again"
echo ""
echo "The agentcore MUST reload the Python modules!"
echo "=========================================="
