#!/bin/bash

echo "🔍 Diagnosing Terrain Analysis Timeout"
echo "======================================="
echo ""

# Get the renewable orchestrator function name
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

if [ -z "$ORCHESTRATOR" ]; then
    echo "❌ Orchestrator function not found"
    exit 1
fi

echo "✅ Found orchestrator: $ORCHESTRATOR"
echo ""

# Get the terrain tool function name
TERRAIN=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrain')].FunctionName" --output text)

if [ -z "$TERRAIN" ]; then
    echo "❌ Terrain function not found"
    exit 1
fi

echo "✅ Found terrain function: $TERRAIN"
echo ""

# Check recent logs for orchestrator
echo "📋 Recent Orchestrator Logs (last 5 minutes):"
echo "---------------------------------------------"
START_TIME=$(date -u -v-5M +%s)000 2>/dev/null || START_TIME=$(date -u -d '5 minutes ago' +%s)000

aws logs filter-log-events \
    --log-group-name "/aws/lambda/$ORCHESTRATOR" \
    --start-time "$START_TIME" \
    --query 'events[*].message' \
    --output text | tail -50

echo ""
echo ""

# Check recent logs for terrain tool
echo "📋 Recent Terrain Tool Logs (last 5 minutes):"
echo "---------------------------------------------"

aws logs filter-log-events \
    --log-group-name "/aws/lambda/$TERRAIN" \
    --start-time "$START_TIME" \
    --query 'events[*].message' \
    --output text | tail -50

echo ""
echo ""

# Check function configurations
echo "⚙️  Orchestrator Configuration:"
echo "------------------------------"
aws lambda get-function-configuration \
    --function-name "$ORCHESTRATOR" \
    --query '{Timeout: Timeout, Memory: MemorySize, Runtime: Runtime}' \
    --output json

echo ""

echo "⚙️  Terrain Tool Configuration:"
echo "------------------------------"
aws lambda get-function-configuration \
    --function-name "$TERRAIN" \
    --query '{Timeout: Timeout, Memory: MemorySize, Runtime: Runtime}' \
    --output json

echo ""
echo ""

echo "🔍 Checking for timeout errors:"
echo "-------------------------------"
aws logs filter-log-events \
    --log-group-name "/aws/lambda/$ORCHESTRATOR" \
    --start-time "$START_TIME" \
    --filter-pattern "Task timed out" \
    --query 'events[*].message' \
    --output text

echo ""

echo "🔍 Checking for memory errors:"
echo "------------------------------"
aws logs filter-log-events \
    --log-group-name "/aws/lambda/$ORCHESTRATOR" \
    --start-time "$START_TIME" \
    --filter-pattern "Memory" \
    --query 'events[*].message' \
    --output text

echo ""
echo "✅ Diagnosis complete"
