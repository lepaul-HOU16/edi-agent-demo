#!/bin/bash

echo "🔍 Checking EDIcraft Lambda logs..."
echo ""

# Get logs from the last 5 minutes
aws logs tail /aws/lambda/EnergyInsights-development-chat \
  --since 5m \
  --format short \
  --follow &

# Store the PID so we can kill it later
TAIL_PID=$!

echo ""
echo "📊 Watching logs... (Press Ctrl+C to stop)"
echo ""
echo "Now click the 'Clear Minecraft Environment' button in your browser"
echo ""

# Wait for user to press Ctrl+C
wait $TAIL_PID
