#!/bin/bash

echo "🔍 COMPREHENSIVE DEPLOYMENT TEST"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

# Function to test and report
test_item() {
  local description=$1
  local command=$2
  
  echo -n "Testing: $description... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASS++))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAIL++))
    return 1
  fi
}

echo "📋 STEP 1: Verify CloudFormation Outputs Exist"
echo "================================================"

if [ -f "amplify_outputs.json" ]; then
  echo -e "${GREEN}✅ amplify_outputs.json exists${NC}"
  
  # Check for custom outputs
  if grep -q "custom" amplify_outputs.json; then
    echo -e "${GREEN}✅ Custom outputs section exists${NC}"
    
    # List all custom outputs
    echo ""
    echo "📦 Exported Outputs:"
    cat amplify_outputs.json | grep -A 1 "\"custom\"" | head -30
    echo ""
  else
    echo -e "${RED}❌ No custom outputs found in amplify_outputs.json${NC}"
    echo "   This means CloudFormation outputs were not exported"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ amplify_outputs.json not found${NC}"
  echo "   Run: npx ampx sandbox"
  ((FAIL++))
fi

echo ""
echo "📋 STEP 2: Verify Lambda Functions Exist"
echo "================================================"

# Get all renewable Lambda functions
echo "Searching for deployed Lambda functions..."
FUNCTIONS=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewable') || contains(FunctionName, 'Renewable')].FunctionName" --output text 2>/dev/null)

if [ -z "$FUNCTIONS" ]; then
  echo -e "${RED}❌ No renewable Lambda functions found${NC}"
  echo "   Run: npx ampx sandbox"
  ((FAIL++))
else
  echo -e "${GREEN}✅ Found renewable Lambda functions:${NC}"
  for func in $FUNCTIONS; do
    echo "   - $func"
  done
  echo ""
fi

echo ""
echo "📋 STEP 3: Verify Environment Variables"
echo "================================================"

# Find orchestrator function
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text 2>/dev/null | head -1)

if [ -n "$ORCHESTRATOR" ]; then
  echo -e "${GREEN}✅ Found orchestrator: $ORCHESTRATOR${NC}"
  echo ""
  echo "Checking environment variables..."
  
  ENV_VARS=$(aws lambda get-function-configuration --function-name "$ORCHESTRATOR" --query 'Environment.Variables' --output json 2>/dev/null)
  
  # Check critical environment variables
  REQUIRED_VARS=(
    "RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME"
    "RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME"
    "RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME"
    "RENEWABLE_REPORT_TOOL_FUNCTION_NAME"
    "RENEWABLE_AGENTS_FUNCTION_NAME"
    "RENEWABLE_S3_BUCKET"
    "SESSION_CONTEXT_TABLE"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if echo "$ENV_VARS" | grep -q "\"$var\""; then
      VALUE=$(echo "$ENV_VARS" | grep "\"$var\"" | cut -d'"' -f4)
      if [ "$VALUE" != "None" ] && [ -n "$VALUE" ]; then
        echo -e "   ${GREEN}✅ $var${NC} = $VALUE"
        ((PASS++))
      else
        echo -e "   ${RED}❌ $var${NC} = None or empty"
        ((FAIL++))
      fi
    else
      echo -e "   ${RED}❌ $var${NC} = NOT SET"
      ((FAIL++))
    fi
  done
else
  echo -e "${RED}❌ Orchestrator function not found${NC}"
  ((FAIL++))
fi

echo ""
echo "📋 STEP 4: Verify Agent Function Environment Variables"
echo "================================================"

# Find agent function
AGENT=$(aws lambda list-functions --query "Functions[?FunctionName=='agent' || contains(FunctionName, 'agent-')].FunctionName" --output text 2>/dev/null | head -1)

if [ -n "$AGENT" ]; then
  echo -e "${GREEN}✅ Found agent function: $AGENT${NC}"
  echo ""
  
  AGENT_ENV=$(aws lambda get-function-configuration --function-name "$AGENT" --query 'Environment.Variables' --output json 2>/dev/null)
  
  # Check that these are NOT hardcoded
  AGENT_VARS=(
    "S3_BUCKET"
    "RENEWABLE_ORCHESTRATOR_FUNCTION_NAME"
    "NEXT_PUBLIC_RENEWABLE_S3_BUCKET"
  )
  
  for var in "${AGENT_VARS[@]}"; do
    if echo "$AGENT_ENV" | grep -q "\"$var\""; then
      VALUE=$(echo "$AGENT_ENV" | grep "\"$var\"" | cut -d'"' -f4)
      
      # Check if it's a hardcoded old value
      if [[ "$VALUE" == *"amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd"* ]]; then
        echo -e "   ${RED}❌ $var${NC} = HARDCODED OLD VALUE"
        echo "      Value: $VALUE"
        ((FAIL++))
      elif [[ "$VALUE" == *"renewable-energy-artifacts-484907533441"* ]]; then
        echo -e "   ${RED}❌ $var${NC} = HARDCODED OLD VALUE"
        echo "      Value: $VALUE"
        ((FAIL++))
      else
        echo -e "   ${GREEN}✅ $var${NC} = $VALUE"
        ((PASS++))
      fi
    else
      echo -e "   ${YELLOW}⚠️  $var${NC} = NOT SET (may use fallback)"
    fi
  done
else
  echo -e "${RED}❌ Agent function not found${NC}"
  ((FAIL++))
fi

echo ""
echo "📋 STEP 5: Test Lambda Invocation"
echo "================================================"

if [ -n "$ORCHESTRATOR" ]; then
  echo "Testing orchestrator invocation..."
  
  TEST_PAYLOAD='{"action":"terrain_query","parameters":{"latitude":35.0,"longitude":-101.0,"radius_km":5}}'
  
  RESULT=$(aws lambda invoke \
    --function-name "$ORCHESTRATOR" \
    --payload "$TEST_PAYLOAD" \
    --cli-binary-format raw-in-base64-out \
    /tmp/lambda-test-output.json 2>&1)
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda invocation successful${NC}"
    
    # Check response
    if [ -f "/tmp/lambda-test-output.json" ]; then
      if grep -q "error" /tmp/lambda-test-output.json; then
        echo -e "${RED}❌ Lambda returned error:${NC}"
        cat /tmp/lambda-test-output.json | head -20
        ((FAIL++))
      else
        echo -e "${GREEN}✅ Lambda returned success${NC}"
        ((PASS++))
      fi
    fi
  else
    echo -e "${RED}❌ Lambda invocation failed${NC}"
    echo "$RESULT"
    ((FAIL++))
  fi
else
  echo -e "${YELLOW}⚠️  Skipping - orchestrator not found${NC}"
fi

echo ""
echo "📋 STEP 6: Check S3 Bucket Access"
echo "================================================"

if [ -n "$ORCHESTRATOR" ]; then
  BUCKET=$(echo "$ENV_VARS" | grep "RENEWABLE_S3_BUCKET" | cut -d'"' -f4)
  
  if [ -n "$BUCKET" ] && [ "$BUCKET" != "None" ]; then
    echo "Testing S3 bucket access: $BUCKET"
    
    if aws s3 ls "s3://$BUCKET" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ S3 bucket accessible${NC}"
      ((PASS++))
    else
      echo -e "${RED}❌ S3 bucket not accessible${NC}"
      ((FAIL++))
    fi
  else
    echo -e "${YELLOW}⚠️  No S3 bucket configured${NC}"
  fi
fi

echo ""
echo "📋 STEP 7: Check for Hardcoded Values in Logs"
echo "================================================"

if [ -n "$ORCHESTRATOR" ]; then
  echo "Checking recent CloudWatch logs for hardcoded values..."
  
  LOG_GROUP="/aws/lambda/$ORCHESTRATOR"
  
  # Get recent logs
  RECENT_LOGS=$(aws logs tail "$LOG_GROUP" --since 10m --format short 2>/dev/null | head -50)
  
  if [ -n "$RECENT_LOGS" ]; then
    # Check for old hardcoded bucket names
    if echo "$RECENT_LOGS" | grep -q "amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy"; then
      echo -e "${RED}❌ Found OLD hardcoded bucket name in logs${NC}"
      echo "   This means Lambda is using fallback values!"
      ((FAIL++))
    elif echo "$RECENT_LOGS" | grep -q "renewable-energy-artifacts-484907533441"; then
      echo -e "${RED}❌ Found OLD hardcoded bucket name in logs${NC}"
      echo "   This means Lambda is using fallback values!"
      ((FAIL++))
    else
      echo -e "${GREEN}✅ No hardcoded bucket names in recent logs${NC}"
      ((PASS++))
    fi
    
    # Check for old function names
    if echo "$RECENT_LOGS" | grep -q "amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd"; then
      echo -e "${RED}❌ Found OLD hardcoded function name in logs${NC}"
      ((FAIL++))
    else
      echo -e "${GREEN}✅ No hardcoded function names in recent logs${NC}"
      ((PASS++))
    fi
  else
    echo -e "${YELLOW}⚠️  No recent logs found (function may not have been invoked)${NC}"
  fi
fi

echo ""
echo "📋 STEP 8: Frontend Integration Check"
echo "================================================"

echo "Checking if frontend can access outputs..."

if [ -f "amplify_outputs.json" ]; then
  # Check if custom outputs are accessible
  CUSTOM_OUTPUTS=$(cat amplify_outputs.json | grep -c "RenewableOrchestratorFunctionName\|RenewableTerrainToolFunctionName\|RenewableLayoutToolFunctionName" 2>/dev/null || echo "0")
  
  if [ "$CUSTOM_OUTPUTS" -gt 0 ]; then
    echo -e "${GREEN}✅ Frontend can access CloudFormation outputs${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ Frontend cannot access CloudFormation outputs${NC}"
    echo "   Custom outputs not found in amplify_outputs.json"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ amplify_outputs.json not found${NC}"
  ((FAIL++))
fi

echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo ""
  echo "🎉 Deployment is working correctly!"
  echo ""
  echo "Next steps:"
  echo "1. Open your frontend in browser"
  echo "2. Try a renewable energy query"
  echo "3. Check browser console for function names being used"
  echo "4. Verify artifacts render correctly"
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Issues found:"
  echo "- Check that sandbox is running: npx ampx sandbox"
  echo "- Verify deployment completed successfully"
  echo "- Check CloudWatch logs for errors"
  echo ""
  echo "If environment variables are missing:"
  echo "1. Stop sandbox (Ctrl+C)"
  echo "2. Restart: npx ampx sandbox"
  echo "3. Wait for 'Deployed' message"
  echo "4. Run this test again"
  exit 1
fi
