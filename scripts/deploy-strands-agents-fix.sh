#!/bin/bash

# Deploy Strands Agent Fix
# This script deploys the fixed Strands Agent Lambda function

set -e

echo "🚀 Deploying Strands Agent Fix"
echo "================================"
echo ""

# Check if sandbox is running
if ! pgrep -f "ampx sandbox" > /dev/null; then
    echo "⚠️  Amplify sandbox is not running"
    echo "   Starting sandbox..."
    npx ampx sandbox &
    SANDBOX_PID=$!
    echo "   Sandbox PID: $SANDBOX_PID"
    echo "   Waiting for deployment to complete (this may take 10-15 minutes)..."
    echo ""
    
    # Wait for sandbox to be ready
    sleep 60
    
    # Monitor logs
    echo "📋 Monitoring deployment logs..."
    tail -f ~/.amplify/logs/sandbox.log 2>/dev/null &
    TAIL_PID=$!
    
    # Wait for deployment
    while true; do
        if aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text 2>/dev/null | grep -q "RenewableAgentsFunction"; then
            echo "✅ Lambda function deployed successfully"
            kill $TAIL_PID 2>/dev/null || true
            break
        fi
        echo "   Still deploying..."
        sleep 30
    done
else
    echo "✅ Amplify sandbox is already running"
    echo "   The changes will be deployed automatically"
    echo "   Waiting for Docker image build and deployment..."
    echo ""
    
    # Wait a bit for the deployment to start
    sleep 10
fi

echo ""
echo "⏳ Waiting for Lambda function to be available..."
echo ""

# Wait for function to be available
MAX_WAIT=900  # 15 minutes
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if aws lambda get-function --function-name $(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text 2>/dev/null | head -1) 2>/dev/null > /dev/null; then
        echo "✅ Lambda function is available"
        break
    fi
    echo "   Waiting... ($ELAPSED/$MAX_WAIT seconds)"
    sleep 30
    ELAPSED=$((ELAPSED + 30))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "❌ Timeout waiting for Lambda function"
    exit 1
fi

echo ""
echo "🧪 Testing deployment..."
echo ""

# Run test
node tests/test-strands-agent-deployment.js

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Check CloudWatch logs for any errors"
echo "   2. Test with actual user queries"
echo "   3. Monitor performance and cold start times"
echo ""
