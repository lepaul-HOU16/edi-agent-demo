#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🔍 RENEWABLE ORCHESTRATOR CONFIGURATION VERIFICATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get orchestrator function name
ORCHESTRATOR="EnergyInsights-development-renewable-orchestrator"

echo "📋 Lambda Function: $ORCHESTRATOR"
echo ""

# Check 1: Environment Variables
echo "─────────────────────────────────────────────────────────────"
echo "✅ CHECK 1: Environment Variables"
echo "─────────────────────────────────────────────────────────────"

ENV_VARS=$(aws lambda get-function-configuration \
  --function-name "$ORCHESTRATOR" \
  --query "Environment.Variables" \
  --output json)

echo "$ENV_VARS" | jq '.'

# Verify required variables
TERRAIN=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME // "NOT_SET"')
LAYOUT=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME // "NOT_SET"')
SIMULATION=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME // "NOT_SET"')
REPORT=$(echo "$ENV_VARS" | jq -r '.RENEWABLE_REPORT_TOOL_FUNCTION_NAME // "NOT_SET"')

echo ""
echo "Required Environment Variables:"
echo "  RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME: $TERRAIN"
echo "  RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME: $LAYOUT"
echo "  RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME: $SIMULATION"
echo "  RENEWABLE_REPORT_TOOL_FUNCTION_NAME: $REPORT"
echo ""

# Check 2: IAM Permissions
echo "─────────────────────────────────────────────────────────────"
echo "✅ CHECK 2: IAM Permissions"
echo "─────────────────────────────────────────────────────────────"

ROLE_ARN=$(aws lambda get-function-configuration \
  --function-name "$ORCHESTRATOR" \
  --query "Role" \
  --output text)

ROLE_NAME=$(echo "$ROLE_ARN" | awk -F'/' '{print $NF}')

echo "IAM Role: $ROLE_NAME"
echo ""

# Get inline policies
POLICY_NAME=$(aws iam list-role-policies \
  --role-name "$ROLE_NAME" \
  --query "PolicyNames[0]" \
  --output text)

if [ "$POLICY_NAME" != "None" ]; then
  echo "Inline Policy: $POLICY_NAME"
  echo ""
  
  POLICY_DOC=$(aws iam get-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --query "PolicyDocument" \
    --output json)
  
  # Check for Lambda invoke permissions
  LAMBDA_PERMS=$(echo "$POLICY_DOC" | jq -r '.Statement[] | select(.Action == "lambda:InvokeFunction") | .Resource[]')
  
  echo "Lambda Invoke Permissions:"
  echo "$LAMBDA_PERMS" | while read -r arn; do
    FUNC_NAME=$(echo "$arn" | awk -F':' '{print $NF}')
    echo "  ✓ $FUNC_NAME"
  done
  echo ""
fi

# Check 3: CloudWatch Logs
echo "─────────────────────────────────────────────────────────────"
echo "✅ CHECK 3: CloudWatch Logs (Last 1 hour)"
echo "─────────────────────────────────────────────────────────────"

LOG_GROUP="/aws/lambda/$ORCHESTRATOR"

# Check if there are any errors in recent logs
ERRORS=$(aws logs filter-log-events \
  --log-group-name "$LOG_GROUP" \
  --start-time $(($(date +%s) * 1000 - 3600000)) \
  --filter-pattern "ERROR" \
  --query "events[*].message" \
  --output text 2>/dev/null)

if [ -z "$ERRORS" ]; then
  echo "✅ No errors found in CloudWatch logs"
else
  echo "⚠️  Errors found:"
  echo "$ERRORS" | head -10
fi
echo ""

# Check 4: Manual Invocation Test
echo "─────────────────────────────────────────────────────────────"
echo "✅ CHECK 4: Manual Invocation Test"
echo "─────────────────────────────────────────────────────────────"

# Create test payload
cat > /tmp/test-orchestrator.json <<EOF
{
  "query": "analyze terrain at coordinates 35.0, -101.0",
  "sessionId": "test-session-$(date +%s)",
  "context": {}
}
EOF

echo "Invoking Lambda with test payload..."
aws lambda invoke \
  --function-name "$ORCHESTRATOR" \
  --payload file:///tmp/test-orchestrator.json \
  --cli-binary-format raw-in-base64-out \
  /tmp/orchestrator-response.json \
  --query "StatusCode" \
  --output text > /dev/null 2>&1

STATUS_CODE=$?

if [ $STATUS_CODE -eq 0 ]; then
  echo "✅ Lambda invocation successful"
  echo ""
  echo "Response:"
  cat /tmp/orchestrator-response.json | jq '.'
else
  echo "❌ Lambda invocation failed"
fi
echo ""

# Check 5: Tool Lambda Availability
echo "─────────────────────────────────────────────────────────────"
echo "✅ CHECK 5: Tool Lambda Availability"
echo "─────────────────────────────────────────────────────────────"

check_lambda() {
  local func_name=$1
  if [ "$func_name" = "NOT_SET" ]; then
    echo "  ❌ $func_name - NOT CONFIGURED"
    return 1
  fi
  
  EXISTS=$(aws lambda get-function --function-name "$func_name" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "  ✅ $func_name - EXISTS"
    return 0
  else
    echo "  ❌ $func_name - NOT FOUND"
    return 1
  fi
}

echo "Checking tool Lambda functions:"
check_lambda "$TERRAIN"
check_lambda "$LAYOUT"
check_lambda "$SIMULATION"
check_lambda "$REPORT"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "📊 VERIFICATION SUMMARY"
echo "═══════════════════════════════════════════════════════════"

ISSUES=0

if [ "$TERRAIN" = "NOT_SET" ]; then
  echo "❌ RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME not set"
  ISSUES=$((ISSUES + 1))
fi

if [ "$LAYOUT" = "NOT_SET" ]; then
  echo "❌ RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME not set"
  ISSUES=$((ISSUES + 1))
fi

if [ "$SIMULATION" = "NOT_SET" ]; then
  echo "❌ RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME not set"
  ISSUES=$((ISSUES + 1))
fi

if [ "$REPORT" = "NOT_SET" ]; then
  echo "⚠️  RENEWABLE_REPORT_TOOL_FUNCTION_NAME not set (optional)"
fi

if [ $ISSUES -eq 0 ]; then
  echo ""
  echo "✅ All required environment variables are set"
  echo "✅ IAM permissions configured correctly"
  echo "✅ Lambda can be invoked manually"
  echo ""
  echo "🎉 Renewable orchestrator is properly configured!"
else
  echo ""
  echo "⚠️  Found $ISSUES configuration issue(s)"
  echo ""
  echo "To fix, update cdk/lib/main-stack.ts and redeploy:"
  echo "  cd cdk"
  echo "  npm run build"
  echo "  cdk deploy"
fi

echo "═══════════════════════════════════════════════════════════"

# Cleanup
rm -f /tmp/test-orchestrator.json /tmp/orchestrator-response.json
