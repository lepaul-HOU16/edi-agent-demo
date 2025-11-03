#!/bin/bash

# Deploy and Validate NREL Integration
# This script deploys the NREL integration and validates it's working correctly

set -e

echo "🚀 NREL Integration Deployment and Validation"
echo "============================================================"
echo ""

# Step 1: Pre-deployment validation
echo "📋 Step 1: Pre-deployment validation"
echo "------------------------------------------------------------"
node tests/validate-nrel-deployment.js
if [ $? -ne 0 ]; then
  echo "❌ Pre-deployment validation failed. Fix issues before deploying."
  exit 1
fi
echo ""

# Step 2: Check if sandbox is running
echo "📋 Step 2: Checking sandbox status"
echo "------------------------------------------------------------"
LAMBDA_COUNT=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName" --output text 2>/dev/null | wc -w || echo "0")
if [ "$LAMBDA_COUNT" -eq "0" ]; then
  echo "⚠️  No Lambda functions found. Sandbox may not be running."
  echo ""
  echo "Please start the sandbox in another terminal:"
  echo "  npx ampx sandbox"
  echo ""
  echo "Then run this script again."
  exit 1
else
  echo "✅ Found $LAMBDA_COUNT renewable Lambda functions"
fi
echo ""

# Step 3: Check NREL API key configuration
echo "📋 Step 3: Checking NREL API key configuration"
echo "------------------------------------------------------------"

# Get actual Lambda function names
SIMULATION_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text 2>/dev/null)
TERRAIN_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableTerrainTool')].FunctionName" --output text 2>/dev/null)

if [ -z "$SIMULATION_LAMBDA" ]; then
  echo "❌ Simulation Lambda not found"
  exit 1
fi

if [ -z "$TERRAIN_LAMBDA" ]; then
  echo "❌ Terrain Lambda not found"
  exit 1
fi

echo "Checking Simulation Lambda: $SIMULATION_LAMBDA"
SIM_KEY=$(aws lambda get-function-configuration --function-name "$SIMULATION_LAMBDA" --query "Environment.Variables.NREL_API_KEY" --output text 2>/dev/null)

echo "Checking Terrain Lambda: $TERRAIN_LAMBDA"
TERRAIN_KEY=$(aws lambda get-function-configuration --function-name "$TERRAIN_LAMBDA" --query "Environment.Variables.NREL_API_KEY" --output text 2>/dev/null)

if [ "$SIM_KEY" == "None" ] || [ -z "$SIM_KEY" ]; then
  echo "❌ NREL_API_KEY not configured in Simulation Lambda"
  echo ""
  echo "The environment variable is configured in backend.ts but not deployed."
  echo "This means the sandbox needs to be restarted."
  echo ""
  echo "Action required:"
  echo "1. Stop the current sandbox (Ctrl+C)"
  echo "2. Restart: npx ampx sandbox"
  echo "3. Wait for 'Deployed' message (5-10 minutes)"
  echo "4. Run this script again"
  exit 1
fi

if [ "$TERRAIN_KEY" == "None" ] || [ -z "$TERRAIN_KEY" ]; then
  echo "❌ NREL_API_KEY not configured in Terrain Lambda"
  echo ""
  echo "Action required: Restart sandbox (see above)"
  exit 1
fi

echo "✅ NREL_API_KEY configured in Simulation Lambda: ${SIM_KEY:0:8}..."
echo "✅ NREL_API_KEY configured in Terrain Lambda: ${TERRAIN_KEY:0:8}..."
echo ""

# Step 4: Test NREL client
echo "📋 Step 4: Testing NREL Wind Client"
echo "------------------------------------------------------------"
cd amplify/functions/renewableTools
python3 -c "
import sys
sys.path.insert(0, '.')
from nrel_wind_client import NRELWindClient
client = NRELWindClient()
print('✅ NREL Wind Client initialized successfully')
print(f'   API Key: {client.api_key[:8]}...')
print(f'   Base URL: {client.base_url[:50]}...')
" 2>&1
if [ $? -ne 0 ]; then
  echo "❌ NREL Wind Client test failed"
  exit 1
fi
cd ../../..
echo ""

# Step 5: Test simulation integration
echo "📋 Step 5: Testing Simulation NREL Integration"
echo "------------------------------------------------------------"
node tests/test-simulation-nrel-integration.js
if [ $? -ne 0 ]; then
  echo "❌ Simulation integration test failed"
  exit 1
fi
echo ""

# Step 6: Test terrain integration
echo "📋 Step 6: Testing Terrain NREL Integration"
echo "------------------------------------------------------------"
node tests/test-terrain-nrel-integration.js
if [ $? -ne 0 ]; then
  echo "❌ Terrain integration test failed"
  exit 1
fi
echo ""

# Step 7: Test UI data source labels
echo "📋 Step 7: Testing UI Data Source Labels"
echo "------------------------------------------------------------"
node tests/test-nrel-data-source-ui.js
if [ $? -ne 0 ]; then
  echo "❌ UI data source label test failed"
  exit 1
fi
echo ""

# Step 8: Test chain of thought
echo "📋 Step 8: Testing Chain of Thought Integration"
echo "------------------------------------------------------------"
node tests/test-nrel-chain-of-thought.js
if [ $? -ne 0 ]; then
  echo "❌ Chain of thought test failed"
  exit 1
fi
echo ""

# Step 9: End-to-end test
echo "📋 Step 9: Running End-to-End Tests"
echo "------------------------------------------------------------"
node tests/test-nrel-integration-e2e.js
if [ $? -ne 0 ]; then
  echo "❌ End-to-end test failed"
  exit 1
fi
echo ""

# Final summary
echo "============================================================"
echo "✅ NREL Integration Deployment and Validation COMPLETE"
echo "============================================================"
echo ""
echo "All tests passed! NREL integration is working correctly."
echo ""
echo "Summary:"
echo "  ✅ NREL Wind Client configured"
echo "  ✅ NREL API Key deployed to Lambdas"
echo "  ✅ No synthetic wind data in production"
echo "  ✅ Simulation uses real NREL data"
echo "  ✅ Terrain uses real NREL data"
echo "  ✅ UI shows data source labels"
echo "  ✅ Chain of thought shows sub-agent reasoning"
echo "  ✅ End-to-end workflow works"
echo ""
echo "Next Steps:"
echo "  1. Test in UI: Open chat and request wind rose"
echo "  2. Verify 'Data Source: NREL Wind Toolkit' displays"
echo "  3. Get PM approval"
echo ""
