#!/bin/bash
# Diagnostic script for MCP server issues

echo "============================================================"
echo "MCP SERVER DIAGNOSTIC"
echo "============================================================"

echo ""
echo "1. Checking MCP Configuration..."
if [ -f ".kiro/settings/mcp.json" ]; then
    echo "   ✓ MCP config file exists"
    if grep -q "petrophysical-analysis" .kiro/settings/mcp.json; then
        echo "   ✓ petrophysical-analysis server configured"
    else
        echo "   ✗ petrophysical-analysis server NOT found in config"
    fi
else
    echo "   ✗ MCP config file not found"
fi

echo ""
echo "2. Checking Python Dependencies..."
python3 -c "import pandas, numpy, mcp, boto3; print('   ✓ All dependencies installed')" 2>/dev/null || echo "   ✗ Missing dependencies"

echo ""
echo "3. Checking MCP Server Script..."
if [ -f "scripts/mcp-well-data-server.py" ]; then
    echo "   ✓ MCP server script exists"
    if python3 -m py_compile scripts/mcp-well-data-server.py 2>/dev/null; then
        echo "   ✓ Script syntax is valid"
    else
        echo "   ✗ Script has syntax errors"
    fi
else
    echo "   ✗ MCP server script not found"
fi

echo ""
echo "4. Checking AWS Credentials..."
if aws sts get-caller-identity &>/dev/null; then
    echo "   ✓ AWS credentials configured"
    aws sts get-caller-identity --query 'Account' --output text | xargs -I {} echo "   ℹ️  Account: {}"
else
    echo "   ✗ AWS credentials not configured"
fi

echo ""
echo "5. Checking S3 Bucket Access..."
BUCKET="amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m"
if aws s3 ls "s3://$BUCKET/global/well-data/" &>/dev/null; then
    COUNT=$(aws s3 ls "s3://$BUCKET/global/well-data/" | grep ".las" | wc -l | xargs)
    echo "   ✓ S3 bucket accessible"
    echo "   ℹ️  Found $COUNT .las files"
else
    echo "   ✗ Cannot access S3 bucket"
fi

echo ""
echo "6. Testing MCP Server Directly..."
if python3 tests/test-mcp-server-direct.py &>/dev/null; then
    echo "   ✓ MCP server can start and load data"
else
    echo "   ✗ MCP server test failed"
fi

echo ""
echo "============================================================"
echo "DIAGNOSIS COMPLETE"
echo "============================================================"

echo ""
echo "📋 Common Issues and Solutions:"
echo ""
echo "Issue: 'MCP server not running'"
echo "Solution: Kiro needs to reload MCP configuration"
echo "  → Open Command Palette (Cmd+Shift+P)"
echo "  → Search for 'MCP'"
echo "  → Select 'Reconnect MCP Servers' or 'Reload MCP Configuration'"
echo ""
echo "Issue: 'No valid data returned'"
echo "Solution: MCP server may not be registered with Kiro yet"
echo "  → Check Kiro's MCP Server view in the sidebar"
echo "  → Verify 'petrophysical-analysis' server is listed"
echo "  → Click reconnect if needed"
echo ""
echo "Issue: 'AWS credentials not configured'"
echo "Solution: Configure AWS credentials"
echo "  → Run: aws configure"
echo "  → Or set environment variables"
echo ""
echo "============================================================"
