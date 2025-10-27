#!/bin/bash

# Deploy and validate layout optimization persistence fix

set -e

echo "🚀 Deploying Layout Optimization Persistence Fix"
echo "=================================================="
echo ""

# Check if sandbox is running
if pgrep -f "ampx sandbox" > /dev/null; then
    echo "⚠️  Sandbox is already running. Please stop it first (Ctrl+C in the sandbox terminal)"
    echo "   Then run this script again."
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain amplify/) ]]; then
    echo "📝 Uncommitted changes detected in amplify/"
    git status --short amplify/
    echo ""
fi

# Start deployment
echo "📦 Starting sandbox deployment..."
echo "   This will take 5-10 minutes..."
echo ""

# Deploy in background and capture output
npx ampx sandbox --stream-function-logs > /tmp/sandbox-deploy.log 2>&1 &
SANDBOX_PID=$!

echo "   Sandbox PID: $SANDBOX_PID"
echo "   Logs: /tmp/sandbox-deploy.log"
echo ""

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
echo "   (Monitoring logs for 'Deployed' message)"
echo ""

TIMEOUT=600  # 10 minutes
ELAPSED=0
DEPLOYED=false

while [ $ELAPSED -lt $TIMEOUT ]; do
    if grep -q "Deployed" /tmp/sandbox-deploy.log 2>/dev/null; then
        DEPLOYED=true
        break
    fi
    
    if ! kill -0 $SANDBOX_PID 2>/dev/null; then
        echo "❌ Sandbox process died unexpectedly"
        tail -20 /tmp/sandbox-deploy.log
        exit 1
    fi
    
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    
    # Show progress every 30 seconds
    if [ $((ELAPSED % 30)) -eq 0 ]; then
        echo "   Still deploying... ($ELAPSED seconds elapsed)"
    fi
done

if [ "$DEPLOYED" = false ]; then
    echo "❌ Deployment timed out after $TIMEOUT seconds"
    echo "   Check logs: /tmp/sandbox-deploy.log"
    kill $SANDBOX_PID 2>/dev/null || true
    exit 1
fi

echo "✅ Deployment completed!"
echo ""

# Wait a moment for everything to stabilize
echo "⏳ Waiting for services to stabilize..."
sleep 10

# Run validation tests
echo ""
echo "🧪 Running validation tests..."
echo "================================"
echo ""

node tests/validate-layout-optimization-fix.js

VALIDATION_RESULT=$?

if [ $VALIDATION_RESULT -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT AND VALIDATION SUCCESSFUL!"
    echo ""
    echo "The fix is working correctly. You can now:"
    echo "  1. Test in the UI by running terrain analysis followed by layout optimization"
    echo "  2. Keep the sandbox running for further testing"
    echo "  3. Stop the sandbox with: kill $SANDBOX_PID"
    echo ""
    echo "Sandbox is still running (PID: $SANDBOX_PID)"
    echo "Logs: /tmp/sandbox-deploy.log"
else
    echo ""
    echo "❌ VALIDATION FAILED"
    echo ""
    echo "The deployment completed but validation tests failed."
    echo "Check the output above for details."
    echo ""
    echo "Sandbox is still running (PID: $SANDBOX_PID)"
    echo "You can:"
    echo "  1. Investigate the issue"
    echo "  2. Run validation again: node tests/validate-layout-optimization-fix.js"
    echo "  3. Stop the sandbox with: kill $SANDBOX_PID"
    exit 1
fi
