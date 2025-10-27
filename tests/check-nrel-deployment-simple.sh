#!/bin/bash

# Simple NREL Deployment Status Check using AWS CLI

echo "🔍 Checking NREL Deployment Status"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found"
  echo "   Install AWS CLI: https://aws.amazon.com/cli/"
  exit 1
fi

# Get Lambda functions
echo "📦 Finding renewable Lambda functions..."
LAMBDAS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName" --output text 2>/dev/null)

if [ -z "$LAMBDAS" ]; then
  echo "❌ No renewable Lambda functions found"
  echo "   Sandbox may not be running"
  echo ""
  echo "   Action: Start sandbox with: npx ampx sandbox"
  exit 1
fi

echo "✅ Found renewable Lambda functions"
echo ""

# Check Simulation Lambda
echo "📋 Checking Simulation Lambda..."
SIM_LAMBDA=$(echo "$LAMBDAS" | tr ' ' '\n' | grep -i "Simulation" | head -1)
if [ -z "$SIM_LAMBDA" ]; then
  echo "❌ Simulation Lambda not found"
  exit 1
fi

echo "   Function: $SIM_LAMBDA"
SIM_KEY=$(aws lambda get-function-configuration --function-name "$SIM_LAMBDA" --query "Environment.Variables.NREL_API_KEY" --output text 2>/dev/null)

if [ "$SIM_KEY" == "None" ] || [ -z "$SIM_KEY" ]; then
  echo "   ❌ NREL_API_KEY: NOT DEPLOYED"
  NEEDS_DEPLOYMENT=true
else
  echo "   ✅ NREL_API_KEY: ${SIM_KEY:0:8}..."
fi
echo ""

# Check Terrain Lambda
echo "📋 Checking Terrain Lambda..."
TERRAIN_LAMBDA=$(echo "$LAMBDAS" | tr ' ' '\n' | grep -i "Terrain" | head -1)
if [ -z "$TERRAIN_LAMBDA" ]; then
  echo "❌ Terrain Lambda not found"
  exit 1
fi

echo "   Function: $TERRAIN_LAMBDA"
TERRAIN_KEY=$(aws lambda get-function-configuration --function-name "$TERRAIN_LAMBDA" --query "Environment.Variables.NREL_API_KEY" --output text 2>/dev/null)

if [ "$TERRAIN_KEY" == "None" ] || [ -z "$TERRAIN_KEY" ]; then
  echo "   ❌ NREL_API_KEY: NOT DEPLOYED"
  NEEDS_DEPLOYMENT=true
else
  echo "   ✅ NREL_API_KEY: ${TERRAIN_KEY:0:8}..."
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$NEEDS_DEPLOYMENT" == "true" ]; then
  echo "❌ DEPLOYMENT REQUIRED"
  echo ""
  echo "The NREL_API_KEY is configured in backend.ts but not deployed."
  echo ""
  echo "Required Actions:"
  echo "  1. Stop the current sandbox (Ctrl+C in the terminal running sandbox)"
  echo "  2. Restart sandbox: npx ampx sandbox"
  echo "  3. Wait for 'Deployed' message (5-10 minutes)"
  echo "  4. Run this script again to verify"
  echo ""
  echo "After deployment, run:"
  echo "  bash tests/deploy-and-validate-nrel.sh"
  echo ""
  exit 1
else
  echo "✅ DEPLOYMENT COMPLETE"
  echo ""
  echo "NREL_API_KEY is deployed to all required Lambda functions."
  echo ""
  echo "Next Steps:"
  echo "  1. Run full validation: bash tests/deploy-and-validate-nrel.sh"
  echo "  2. Test in UI: Request wind rose analysis"
  echo "  3. Verify 'Data Source: NREL Wind Toolkit' displays"
  echo ""
  exit 0
fi
