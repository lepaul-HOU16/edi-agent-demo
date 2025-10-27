#!/bin/bash

# Strands Agent Deployment Fix Script
# This script ensures the Strands Agent Lambda deploys successfully

set -e

echo "🚀 Starting Strands Agent Deployment Fix"
echo "=========================================="

# Step 1: Verify Docker is running
echo ""
echo "📦 Step 1: Verifying Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ ERROR: Docker is not running. Please start Docker Desktop."
    exit 1
fi
echo "✅ Docker is running"

# Step 2: Pre-build the Docker image locally to catch any issues
echo ""
echo "🔨 Step 2: Pre-building Docker image locally..."
echo "This ensures the image builds successfully before Amplify tries..."
docker build --platform linux/amd64 \
    -t strands-agent-test \
    amplify/functions/renewableAgents \
    2>&1 | tail -20

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ ERROR: Docker build failed. Check the output above."
    exit 1
fi

# Step 3: Check if sandbox is already running
echo ""
echo "🔍 Step 3: Checking for existing sandbox..."
SANDBOX_PID=$(ps aux | grep "ampx sandbox" | grep -v grep | awk '{print $2}' | head -1)
if [ ! -z "$SANDBOX_PID" ]; then
    echo "⚠️  Sandbox is already running (PID: $SANDBOX_PID)"
    echo "   Killing existing sandbox..."
    kill $SANDBOX_PID
    sleep 3
fi
echo "✅ No existing sandbox running"

# Step 4: Clean up any stale CloudFormation stacks
echo ""
echo "🧹 Step 4: Checking for stale CloudFormation stacks..."
STALE_STACKS=$(aws cloudformation list-stacks \
    --stack-status-filter CREATE_FAILED UPDATE_FAILED ROLLBACK_COMPLETE \
    --query "StackSummaries[?contains(StackName, 'amplify')].StackName" \
    --output text 2>/dev/null || echo "")

if [ ! -z "$STALE_STACKS" ]; then
    echo "⚠️  Found stale stacks: $STALE_STACKS"
    echo "   These may need manual cleanup if deployment fails"
else
    echo "✅ No stale stacks found"
fi

# Step 5: Start sandbox with streaming logs
echo ""
echo "🚀 Step 5: Starting Amplify sandbox..."
echo "=========================================="
echo ""
echo "⏳ This will take 10-15 minutes for Docker image build and deployment"
echo "   Watch for these milestones:"
echo "   1. 'Building Docker image...' (5-7 minutes)"
echo "   2. 'Pushing to ECR...' (2-3 minutes)"
echo "   3. 'Deploying Lambda...' (3-5 minutes)"
echo "   4. 'Deployed' (SUCCESS!)"
echo ""
echo "Press Ctrl+C to cancel (but give it time!)"
echo ""

# Start sandbox with function logs
npx ampx sandbox --stream-function-logs

