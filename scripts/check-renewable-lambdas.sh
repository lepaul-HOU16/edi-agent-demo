#!/bin/bash

echo "🔍 Checking Renewable Energy Lambda Functions"
echo "=============================================="
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

echo "📋 Listing Lambda functions with 'renewable' in the name:"
echo ""

aws lambda list-functions \
  --query 'Functions[?contains(FunctionName, `renewable`) || contains(FunctionName, `Renewable`)].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout,LastModified:LastModified}' \
  --output table

echo ""
echo "🔍 Checking specific functions:"
echo ""

functions=(
  "renewableOrchestrator"
  "renewableTerrainTool"
  "renewableLayoutTool"
  "renewableSimulationTool"
  "renewableReportTool"
  "renewableAgentCoreProxy"
)

for func in "${functions[@]}"; do
  if aws lambda get-function --function-name "$func" &> /dev/null; then
    echo "✅ $func - EXISTS"
    
    # Get function ARN
    arn=$(aws lambda get-function --function-name "$func" --query 'Configuration.FunctionArn' --output text)
    echo "   ARN: $arn"
    
  else
    echo "❌ $func - NOT FOUND"
  fi
done

echo ""
echo "💡 To deploy the Lambda functions, run:"
echo "   npx ampx sandbox"
echo ""
echo "💡 To test a function, run:"
echo "   aws lambda invoke --function-name renewableOrchestrator \\"
echo "     --payload '{\"query\":\"Analyze terrain at 35.067482, -101.395466\",\"userId\":\"test\",\"sessionId\":\"test\"}' \\"
echo "     response.json"
