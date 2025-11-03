#!/bin/bash

# Fix Docker builder and deploy
# This ensures we use the legacy Docker builder, not buildx

set -e

echo "=========================================="
echo "Fixing Docker Builder Configuration"
echo "=========================================="

# Check current builder
echo "Current Docker builder:"
docker buildx ls

# Set default builder to 'default' (legacy builder)
echo ""
echo "Setting Docker builder to 'default' (legacy, non-buildx)..."
export DOCKER_BUILDKIT=0
docker buildx use default 2>/dev/null || echo "Already using default builder"

echo ""
echo "✅ Docker builder configured"
echo ""

# Now run the workshop deployment
echo "=========================================="
echo "Running Deployment"
echo "=========================================="
echo ""

cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/agent_core/02_host_local_tools_to_lambda_gateway

# Set environment variable to disable buildkit
export DOCKER_BUILDKIT=0

# Run Python deployment from this directory
python3 ../../../../scripts/deploy-using-workshop-utils.py

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
