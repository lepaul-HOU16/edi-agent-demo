#!/bin/bash

echo "============================================================"
echo "🚀 DEPLOYING WINDROSE WITH LAMBDA LAYER"
echo "============================================================"
echo ""
echo "This will:"
echo "1. Deploy the renewableDemo Lambda Layer (numpy, matplotlib, scipy)"
echo "2. Attach the layer to the windrose Lambda"
echo "3. Set the RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME environment variable"
echo "4. Restore wind rose functionality"
echo ""
echo "⏱️  This will take 5-10 minutes..."
echo ""

# Check if sandbox is running
if pgrep -f "ampx sandbox" > /dev/null; then
  echo "⚠️  Sandbox is already running. Please stop it first (Ctrl+C) and then run:"
  echo "   npx ampx sandbox"
  echo ""
  exit 1
fi

echo "📦 Starting Amplify sandbox deployment..."
echo ""
echo "Run this command:"
echo ""
echo "  npx ampx sandbox"
echo ""
echo "After deployment completes, verify with:"
echo "  bash scripts/test-windrose-after-layer.sh"
echo ""
