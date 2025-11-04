#!/bin/bash

# OSDU Search Integration Deployment Validation Script
# This script checks if all components are properly deployed

echo "🔍 OSDU Search Integration Deployment Validation"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0

# Function to check and report
check_item() {
  local description=$1
  local status=$2
  local details=$3
  
  if [ "$status" = "pass" ]; then
    echo -e "${GREEN}✅${NC} $description"
    [ -n "$details" ] && echo "   $details"
    ((PASSED++))
  elif [ "$status" = "fail" ]; then
    echo -e "${RED}❌${NC} $description"
    [ -n "$details" ] && echo "   $details"
    ((FAILED++))
  else
    echo -e "${YELLOW}⚠️${NC} $description"
    [ -n "$details" ] && echo "   $details"
    ((WARNINGS++))
  fi
}

echo "1. Checking Backend Files"
echo "=========================="
echo ""

# Check osduProxy Lambda function
if [ -f "amplify/functions/osduProxy/handler.ts" ]; then
  check_item "osduProxy Lambda handler exists" "pass"
else
  check_item "osduProxy Lambda handler exists" "fail" "File not found: amplify/functions/osduProxy/handler.ts"
fi

if [ -f "amplify/functions/osduProxy/resource.ts" ]; then
  check_item "osduProxy Lambda resource exists" "pass"
else
  check_item "osduProxy Lambda resource exists" "fail" "File not found: amplify/functions/osduProxy/resource.ts"
fi

# Check backend.ts registration
if grep -q "osduProxyFunction" amplify/backend.ts; then
  check_item "osduProxyFunction registered in backend.ts" "pass"
else
  check_item "osduProxyFunction registered in backend.ts" "fail" "Not found in amplify/backend.ts"
fi

# Check data schema
if grep -q "osduSearch" amplify/data/resource.ts; then
  check_item "osduSearch query defined in schema" "pass"
else
  check_item "osduSearch query defined in schema" "fail" "Not found in amplify/data/resource.ts"
fi

echo ""
echo "2. Checking Frontend Files"
echo "==========================="
echo ""

# Check catalog page integration
if grep -q "detectSearchIntent" src/app/catalog/page.tsx; then
  check_item "Intent detection implemented" "pass"
else
  check_item "Intent detection implemented" "fail" "detectSearchIntent not found in catalog page"
fi

if grep -q "osduSearch" src/app/catalog/page.tsx; then
  check_item "OSDU query execution integrated" "pass"
else
  check_item "OSDU query execution integrated" "fail" "osduSearch not found in catalog page"
fi

if grep -q "OSDU Search Results" src/app/catalog/page.tsx; then
  check_item "OSDU response formatting implemented" "pass"
else
  check_item "OSDU response formatting implemented" "fail" "OSDU formatting not found"
fi

echo ""
echo "3. Checking Environment Configuration"
echo "======================================"
echo ""

# Check .env.local.example
if [ -f ".env.local.example" ]; then
  if grep -q "OSDU_API_KEY" .env.local.example; then
    check_item ".env.local.example has OSDU_API_KEY" "pass"
  else
    check_item ".env.local.example has OSDU_API_KEY" "warn" "Add OSDU_API_KEY placeholder"
  fi
else
  check_item ".env.local.example exists" "warn" "File not found"
fi

# Check .gitignore
if grep -q ".env.local" .gitignore; then
  check_item ".env.local in .gitignore" "pass"
else
  check_item ".env.local in .gitignore" "fail" "Add .env.local to .gitignore"
fi

echo ""
echo "4. Checking Test Files"
echo "======================"
echo ""

if [ -f "tests/test-osdu-search-e2e.js" ]; then
  check_item "End-to-end test exists" "pass"
else
  check_item "End-to-end test exists" "fail" "File not found: tests/test-osdu-search-e2e.js"
fi

if [ -f "tests/test-osdu-browser-manual.md" ]; then
  check_item "Manual test guide exists" "pass"
else
  check_item "Manual test guide exists" "fail" "File not found: tests/test-osdu-browser-manual.md"
fi

echo ""
echo "5. Checking Deployed Resources (if sandbox running)"
echo "===================================================="
echo ""

# Check if AWS CLI is available
if command -v aws &> /dev/null; then
  # Try to find osduProxy Lambda
  OSDU_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'osduProxy')].FunctionName" --output text 2>/dev/null)
  
  if [ -n "$OSDU_LAMBDA" ]; then
    check_item "osduProxy Lambda deployed" "pass" "Function: $OSDU_LAMBDA"
    
    # Check environment variables
    ENV_VARS=$(aws lambda get-function-configuration --function-name "$OSDU_LAMBDA" --query "Environment.Variables" --output json 2>/dev/null)
    
    if echo "$ENV_VARS" | grep -q "OSDU_API_KEY"; then
      check_item "OSDU_API_KEY environment variable set" "pass"
    else
      check_item "OSDU_API_KEY environment variable set" "warn" "Set via: aws lambda update-function-configuration"
    fi
    
    if echo "$ENV_VARS" | grep -q "OSDU_API_URL"; then
      check_item "OSDU_API_URL environment variable set" "pass"
    else
      check_item "OSDU_API_URL environment variable set" "warn" "Should be set in resource.ts"
    fi
  else
    check_item "osduProxy Lambda deployed" "warn" "Not found - sandbox may not be running"
  fi
else
  check_item "AWS CLI available" "warn" "Install AWS CLI to check deployed resources"
fi

echo ""
echo "=================================================="
echo "📊 Validation Summary"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
if [ $TOTAL -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")
  echo "Success Rate: $SUCCESS_RATE%"
  echo ""
fi

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All critical checks passed!${NC}"
  echo ""
  
  if [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Some warnings detected. Review above for details."
    echo ""
  fi
  
  echo "Next Steps:"
  echo "1. Ensure sandbox is running: npx ampx sandbox"
  echo "2. Set OSDU_API_KEY in Lambda environment if not set"
  echo "3. Run end-to-end test: node tests/test-osdu-search-e2e.js"
  echo "4. Test in browser using: tests/test-osdu-browser-manual.md"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some checks failed. Review above for details.${NC}"
  echo ""
  echo "Fix the failed items before deploying."
  echo ""
  exit 1
fi
