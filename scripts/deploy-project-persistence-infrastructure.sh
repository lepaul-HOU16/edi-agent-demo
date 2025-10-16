#!/bin/bash

# Deploy Project Persistence Infrastructure
# This script deploys the DynamoDB table, AWS Location Service, and IAM permissions

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🚀 DEPLOYING PROJECT PERSISTENCE INFRASTRUCTURE"
echo "═══════════════════════════════════════════════════════════"

# Check if sandbox is running
echo ""
echo "📋 Step 1: Checking current deployment status..."
if pgrep -f "ampx sandbox" > /dev/null; then
    echo "⚠️  Sandbox is currently running"
    echo "   Stopping sandbox to apply infrastructure changes..."
    pkill -f "ampx sandbox" || true
    sleep 2
fi

# Deploy infrastructure
echo ""
echo "📋 Step 2: Deploying infrastructure with Amplify..."
echo "   This will create:"
echo "   - DynamoDB table: RenewableSessionContext"
echo "   - AWS Location Service Place Index: RenewableProjectPlaceIndex"
echo "   - IAM permissions for orchestrator Lambda"
echo "   - S3 bucket structure for project data"
echo ""

npx ampx sandbox &
SANDBOX_PID=$!

echo "   Sandbox started with PID: $SANDBOX_PID"
echo "   Waiting for deployment to complete..."
echo "   (This may take 5-10 minutes)"

# Wait for deployment message
timeout 600 bash -c '
while true; do
    if grep -q "Deployed" <(tail -f /dev/null 2>&1); then
        break
    fi
    sleep 5
done
' || echo "   Deployment in progress..."

echo ""
echo "📋 Step 3: Verifying deployment..."
sleep 10

# Run verification tests
echo ""
node tests/test-project-persistence-infrastructure.js

if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ PROJECT PERSISTENCE INFRASTRUCTURE DEPLOYED"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Infrastructure components:"
    echo "  ✅ DynamoDB Session Context Table"
    echo "  ✅ AWS Location Service Place Index"
    echo "  ✅ S3 Bucket Structure"
    echo "  ✅ IAM Permissions"
    echo "  ✅ Environment Variables"
    echo ""
    echo "Next steps:"
    echo "  1. Implement ProjectStore (Task 2)"
    echo "  2. Implement ProjectNameGenerator (Task 3)"
    echo "  3. Implement SessionContextManager (Task 4)"
    echo ""
    echo "Sandbox is running. Press Ctrl+C to stop."
    echo "═══════════════════════════════════════════════════════════"
    
    # Keep sandbox running
    wait $SANDBOX_PID
else
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "❌ DEPLOYMENT VERIFICATION FAILED"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "Some infrastructure components failed to deploy."
    echo "Check the logs above for details."
    echo ""
    echo "Common issues:"
    echo "  - AWS credentials not configured"
    echo "  - Insufficient IAM permissions"
    echo "  - Region mismatch"
    echo ""
    echo "Stopping sandbox..."
    kill $SANDBOX_PID 2>/dev/null || true
    exit 1
fi
