#!/bin/bash

echo "🔥 FIXING DEPLOYMENT PIPELINE NOW"
echo "=================================="

# Step 1: Kill stale dev server
echo ""
echo "Step 1: Killing stale dev server..."
pkill -f "next dev" || echo "No dev server to kill"

# Step 2: Clear Next.js cache
echo ""
echo "Step 2: Clearing Next.js build cache..."
rm -rf .next
echo "✅ .next cache cleared"

# Step 3: Start Amplify sandbox (this will deploy backend changes)
echo ""
echo "Step 3: Starting Amplify sandbox..."
echo "⚠️  This will take 5-10 minutes to deploy backend changes"
echo "⚠️  Watch for 'Deployed' message before proceeding"
echo ""
echo "Run this command in a separate terminal:"
echo "npx ampx sandbox"
echo ""
echo "After sandbox shows 'Deployed', run:"
echo "npm run dev"
echo ""
echo "Then hard refresh your browser (Cmd+Shift+R)"
