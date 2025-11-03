#!/bin/bash

echo "🔍 Quick Wind Rose Test"
echo "======================="
echo ""

# Test query
echo "Testing: 'show me a wind rose for 35.067482, -101.395466'"
echo ""

# Check if we're in sandbox
if [ -z "$AWS_REGION" ]; then
    echo "❌ Not in sandbox environment"
    echo "Run: npx ampx sandbox"
    exit 1
fi

echo "✅ In sandbox environment"
echo ""

# Open browser to test
echo "📱 Please test in browser:"
echo "   1. Open chat interface"
echo "   2. Enter: show me a wind rose for 35.067482, -101.395466"
echo "   3. Check browser console for:"
echo "      - data.plotlyWindRose (should be object)"
echo "      - data.visualizationUrl (fallback PNG)"
echo "      - Which component renders"
echo ""
echo "Expected: PlotlyWindRose component with interactive chart"
echo "Fallback: PNG image if Plotly data missing"
echo ""
echo "Press Ctrl+C when done testing"

# Keep script running
tail -f /dev/null
