#!/bin/bash

echo "=========================================="
echo "DEPLOYING SIMULATION LAMBDA FIX"
echo "=========================================="
echo ""
echo "Fixed Issue: IndentationError in handler.py line 312"
echo "- Removed duplicate code block"
echo "- Fixed indentation"
echo ""
echo "Starting sandbox deployment..."
echo "This will take 5-10 minutes..."
echo ""

# Start sandbox (this will rebuild the Docker image with the fixed code)
npx ampx sandbox

