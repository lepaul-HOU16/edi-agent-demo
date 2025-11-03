#!/bin/bash

# Debug Deployment Status
# Check if changes are actually deployed

echo "=================================="
echo "DEPLOYMENT STATUS CHECK"
echo "=================================="
echo ""

# 1. Check if sandbox is running
echo "1. Checking for running sandbox process..."
if pgrep -f "ampx sandbox" > /dev/null; then
    echo "✅ Sandbox process is running"
else
    echo "❌ Sandbox process NOT running"
    echo "   Run: npx ampx sandbox"
fi
echo ""

# 2. List all renewable Lambda functions
echo "2. Listing renewable Lambda functions..."
aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewable') || contains(FunctionName, 'Renewable')].{Name:FunctionName, Runtime:Runtime, Updated:LastModified}" --output table
echo ""

# 3. Check orchestrator Lambda
echo "3. Checking orchestrator Lambda..."
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator') || contains(FunctionName, 'RenewableOrchestrator')].FunctionName" --output text | head -1)

if [ -n "$ORCHESTRATOR" ]; then
    echo "Found: $ORCHESTRATOR"
    echo ""
    echo "Last Modified:"
    aws lambda get-function --function-name "$ORCHESTRATOR" --query "Configuration.LastModified" --output text
    echo ""
    echo "Environment Variables:"
    aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query "Environment.Variables" --output json
else
    echo "❌ Orchestrator Lambda NOT FOUND"
fi
echo ""

# 4. Check simulation Lambda
echo "4. Checking simulation Lambda..."
SIMULATION=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'simulation') || contains(FunctionName, 'Simulation')].FunctionName" --output text | head -1)

if [ -n "$SIMULATION" ]; then
    echo "Found: $SIMULATION"
    echo ""
    echo "Last Modified:"
    aws lambda get-function --function-name "$SIMULATION" --query "Configuration.LastModified" --output text
    echo ""
    echo "Runtime:"
    aws lambda get-function-configuration --function-name "$SIMULATION" --query "Runtime" --output text
    echo ""
    echo "Timeout:"
    aws lambda get-function-configuration --function-name "$SIMULATION" --query "Timeout" --output text
    echo ""
    echo "Memory:"
    aws lambda get-function-configuration --function-name "$SIMULATION" --query "MemorySize" --output text
else
    echo "❌ Simulation Lambda NOT FOUND"
fi
echo ""

# 5. Check recent CloudWatch logs for orchestrator
echo "5. Recent orchestrator logs (last 5 minutes)..."
if [ -n "$ORCHESTRATOR" ]; then
    LOG_GROUP="/aws/lambda/$ORCHESTRATOR"
    echo "Log group: $LOG_GROUP"
    echo ""
    aws logs tail "$LOG_GROUP" --since 5m --format short 2>/dev/null | tail -20
else
    echo "❌ Cannot check logs - orchestrator not found"
fi
echo ""

# 6. Check recent CloudWatch logs for simulation
echo "6. Recent simulation logs (last 5 minutes)..."
if [ -n "$SIMULATION" ]; then
    LOG_GROUP="/aws/lambda/$SIMULATION"
    echo "Log group: $LOG_GROUP"
    echo ""
    aws logs tail "$LOG_GROUP" --since 5m --format short 2>/dev/null | tail -20
else
    echo "❌ Cannot check logs - simulation not found"
fi
echo ""

# 7. Check frontend build
echo "7. Checking frontend build..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Next.js build exists"
    echo "Build ID: $(cat .next/BUILD_ID)"
else
    echo "❌ No Next.js build found"
    echo "   Run: npm run build"
fi
echo ""

# 8. Check if dev server is running
echo "8. Checking for dev server..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Dev server running on port 3000"
else
    echo "❌ Dev server NOT running"
    echo "   Run: npm run dev"
fi
echo ""

echo "=================================="
echo "SUMMARY"
echo "=================================="
echo ""
echo "To fix deployment issues:"
echo "1. Stop sandbox (Ctrl+C)"
echo "2. Restart: npx ampx sandbox"
echo "3. Wait for 'Deployed' message"
echo "4. Restart dev server: npm run dev"
echo ""
