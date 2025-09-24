#!/bin/bash

echo "🚀 === DEPLOYING WELL DATA DISCOVERY REGRESSION FIX ==="
echo "📅 Deploy Date: $(date)"
echo "🎯 Target: Enhanced Strands Agent Intent Detection"

# Deploy the Amplify functions using the correct sandbox command
echo "📦 Deploying enhanced agent with fixed intent detection..."
echo "🔧 Using sandbox deployment (agent-fix-lp environment)..."
npx ampx sandbox --identifier agent-fix-lp --once

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎯 Next step: Test the specific prompt in the UI to verify the regression is fixed"
    echo ""
    echo "📋 Test this exact prompt:"
    echo "\"Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.\""
    echo ""
    echo "✅ Expected result: Interactive tabbed component with comprehensive well data discovery visualization"
    echo "❌ Regression result: Simple condensed well list text"
else
    echo "❌ Deployment failed!"
    exit 1
fi

echo "🏁 === DEPLOYMENT COMPLETE ==="
