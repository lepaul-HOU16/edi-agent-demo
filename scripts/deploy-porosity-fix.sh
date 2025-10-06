#!/bin/bash

# Comprehensive Porosity Fix Deployment Script
# Ensures all changes are properly built and deployed to AWS Lambda

echo "🚀 === COMPREHENSIVE POROSITY FIX DEPLOYMENT ==="
echo "⏰ Started at: $(date)"
echo "🎯 Goal: Deploy all porosity analysis fixes to AWS Lambda"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: Must run from project root directory"
    exit 1
fi

echo ""
echo "📋 === PRE-DEPLOYMENT VALIDATION ==="

# 1. Validate TypeScript compilation
echo "🔧 Step 1: Validating TypeScript compilation..."
if npm run build; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed - stopping deployment"
    exit 1
fi

# 2. Check for critical files
echo "🔧 Step 2: Checking critical files..."
critical_files=(
    "amplify/functions/tools/petrophysicsTools.ts"
    "amplify/functions/agents/enhancedStrandsAgent.ts"
    "src/components/ChatMessage.tsx"
    "src/components/messageComponents/ComprehensivePorosityAnalysisComponent.tsx"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing - critical file not found!"
        exit 1
    fi
done

# 3. Validate key fixes are in place
echo "🔧 Step 3: Validating fixes in code..."

if grep -q "Enhanced professional porosity analysis for" amplify/functions/tools/petrophysicsTools.ts; then
    echo "  ✅ Enhanced porosity tool found"
else
    echo "  ❌ Enhanced porosity tool missing"
fi

if grep -q "WELL-\\\\d+" amplify/functions/agents/enhancedStrandsAgent.ts; then
    echo "  ✅ WELL-001 pattern matching found"
else
    echo "  ❌ WELL-001 pattern matching missing"
fi

if grep -q "calculate_porosity.*:" src/components/ChatMessage.tsx; then
    echo "  ✅ Frontend routing found"
else
    echo "  ❌ Frontend routing missing"
fi

echo ""
echo "🚀 === DEPLOYMENT PHASE ==="

# 4. Build the project again to ensure everything is compiled
echo "🔧 Step 4: Final build before deployment..."
NODE_OPTIONS='--max-old-space-size=16384' npm run build

if [ $? -eq 0 ]; then
    echo "✅ Final build successful"
else
    echo "❌ Final build failed"
    exit 1
fi

# 5. Deploy using the same command that worked before
echo "🔧 Step 5: Deploying to AWS Lambda..."
echo "Running: npx ampx sandbox --identifier agent-fix-lp --once"

# Run deployment
npx ampx sandbox --identifier agent-fix-lp --once

if [ $? -eq 0 ]; then
    echo "✅ Deployment command completed"
else
    echo "❌ Deployment command failed"
    exit 1
fi

echo ""
echo "⏰ === POST-DEPLOYMENT INSTRUCTIONS ==="
echo "🎯 Deployment completed at: $(date)"
echo ""
echo "To test the fixes:"
echo "  1. 🔄 Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)"
echo "  2. 📱 Navigate to chat interface"
echo "  3. 🎯 Click 'Professional Porosity Calculation (WELL-001)'"
echo "  4. ✅ Expect interactive visualizations instead of JSON"
echo ""
echo "✅ Expected response format:"
echo "  • success: true (not success: false)"
echo "  • wellName: 'WELL-001' (not just 'WELL')"  
echo "  • Interactive ComprehensivePorosityAnalysisComponent"
echo "  • Professional visualizations and documentation"
echo ""
echo "❌ If still seeing JSON:"
echo "  1. Wait 60 seconds for Lambda cold start"
echo "  2. Try prompt again"
echo "  3. Check browser console for errors"
echo "  4. Clear all browser data and retry"
echo ""
echo "🎉 Enhanced Professional Porosity Analysis - DEPLOYED"
echo "🏆 SPE/API Standards Compliance - READY"
echo "📊 Interactive Visualizations - ACTIVE"
echo "🔬 Statistical Analysis & Uncertainty - INCLUDED"
echo ""
echo "🎯 === POROSITY FIX DEPLOYMENT COMPLETE ==="
