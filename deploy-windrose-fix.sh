#!/bin/bash

echo "=========================================="
echo "DEPLOYING WIND ROSE FIX"
echo "=========================================="
echo ""
echo "Root Cause: Runtime.InvalidEntrypoint"
echo "Fix: Corrected Dockerfile to place all files in same directory"
echo ""
echo "Changes:"
echo "1. Removed handler.py subdirectory path"
echo "2. Removed sys.path manipulation in handler.py"
echo "3. All imports now work from same directory"
echo ""
echo "=========================================="
echo ""

# Kill any existing sandbox
echo "🛑 Stopping existing sandbox..."
pkill -f "ampx sandbox" 2>/dev/null || true
sleep 2

echo ""
echo "🚀 Starting sandbox deployment..."
echo "⏰ This will take 5-10 minutes to rebuild Docker image..."
echo ""

npx ampx sandbox --stream-function-logs
