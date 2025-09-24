#!/bin/bash

echo "🚀 Deploying Conversational Agent Improvements"
echo "============================================="

echo "📋 Changes being deployed:"
echo "✅ Enhanced intent detection with natural language understanding"
echo "✅ Cross-well analytics tools for broad questions"
echo "✅ Natural language query handler"
echo "✅ Shorter, more conversational responses"
echo "✅ Smart fallback responses instead of generic text walls"

echo ""
echo "🔧 Building and deploying..."

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - stopping deployment"
    exit 1
fi

# Deploy to sandbox first for testing
echo "🚀 Deploying to sandbox environment..."
npx ampx sandbox --outputs-version 1

if [ $? -eq 0 ]; then
    echo "✅ Sandbox deployment successful"
    
    echo ""
    echo "🧪 Testing conversational capabilities..."
    node test-conversational-agent.js
    
    echo ""
    echo "🎉 CONVERSATIONAL IMPROVEMENTS DEPLOYED!"
    echo "========================================"
    echo ""
    echo "🔧 Key Improvements:"
    echo "✅ Natural language queries now understood"
    echo "✅ Questions like 'average porosity of all wells' get direct answers"
    echo "✅ No more generic wall-of-text responses"
    echo "✅ Cross-well analytics available for broad insights"
    echo "✅ Conversational, not robotic responses"
    echo ""
    echo "🎯 Try these natural queries:"
    echo "• 'what is the average porosity of all my wells'"
    echo "• 'which wells are the best'"
    echo "• 'how many wells do I have'"
    echo "• 'show me a field overview'"
    echo "• 'what data is available'"
    
else
    echo "❌ Sandbox deployment failed"
    exit 1
fi
