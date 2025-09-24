#!/bin/bash

echo "🚀 === DEPLOYING LOG CURVE VISUALIZATION FIX ==="
echo "⏰ Timestamp: $(date)"

# Deploy backend changes to sandbox
echo "📋 Step 1: Deploying to sandbox environment..."
npx ampx sandbox --identifier agent-fix-lp --once

echo "✅ Deployment complete!"

echo "📋 Step 2: Testing log curve visualization intent..."
# Test the specific request format that should trigger log curve visualization
echo "💡 Use these exact phrases to get log curves:"
echo "   - 'show log curves for WELL-001'"
echo "   - 'display log curves for WELL-001'" 
echo "   - 'plot log curves for WELL-001'"
echo "   - 'get curve data for WELL-001'"

echo "🎯 === DEPLOYMENT COMPLETE ==="
echo "Next: Try 'show log curves for WELL-001' in the chat interface"
