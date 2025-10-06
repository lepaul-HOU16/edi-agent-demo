#!/bin/bash

echo "=== Deploying Full Strands Agent with MCP Integration ==="

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it from .env.local.example"
    echo "   cp .env.local.example .env.local"
    echo "   Then edit .env.local with your MCP server configuration"
    exit 1
fi

# Source environment variables
source .env.local

# Check MCP configuration
if [ -z "$MCP_SERVER_URL" ] || [ "$MCP_SERVER_URL" = "https://your-mcp-server-url.com/mcp" ]; then
    echo "⚠️  MCP_SERVER_URL not configured in .env.local"
    echo "   The agent will work but MCP features will be limited"
fi

if [ -z "$MCP_API_KEY" ] || [ "$MCP_API_KEY" = "your-mcp-api-key" ]; then
    echo "⚠️  MCP_API_KEY not configured in .env.local"
    echo "   The agent will work but MCP features will be limited"
fi

echo "📦 Building and deploying..."

# Deploy with Amplify
npx ampx sandbox --stream-function-logs &

# Wait a moment for deployment to start
sleep 5

echo "🚀 Deployment started!"
echo ""
echo "📋 Next steps:"
echo "1. Wait for deployment to complete"
echo "2. Test the agent with: 'list wells' or 'help'"
echo "3. Check browser console for debugging information"
echo "4. If MCP server is configured, test with: node test-mcp-integration.js"
echo ""
echo "🔍 Debugging tips:"
echo "- Open browser developer tools (F12)"
echo "- Check Console tab for detailed logs"
echo "- Look for '=== CHATBOX DEBUG ===' messages"
echo "- Check Lambda logs in the terminal for backend debugging"

# Keep the script running to show logs
wait
