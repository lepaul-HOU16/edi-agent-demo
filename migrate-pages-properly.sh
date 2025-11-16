#!/bin/bash

# This script properly migrates CatalogPage and ChatPage from Next.js+Amplify to Vite+REST
# It ONLY changes the necessary imports and API calls, preserving the DOM structure

echo "🔄 Starting proper migration of CatalogPage and ChatPage..."

# Backup current versions
cp src/pages/CatalogPage.tsx src/pages/CatalogPage.tsx.backup
cp src/pages/ChatPage.tsx src/pages/ChatPage.tsx.backup
echo "✅ Backed up current versions"

# Copy original files
cp /tmp/catalog-original.tsx src/pages/CatalogPage.tsx
cp /tmp/chat-original.tsx src/pages/ChatPage.tsx
echo "✅ Restored original files"

# Now apply ONLY the necessary migrations

# 1. Remove 'use client' directive
sed -i '' "1s/'use client';//" src/pages/CatalogPage.tsx
sed -i '' "1s/'use client';//" src/pages/ChatPage.tsx
echo "✅ Removed 'use client' directives"

# 2. Fix imports - replace Next.js with React Router
sed -i '' 's|from "next/navigation"|from "react-router-dom"|g' src/pages/CatalogPage.tsx
sed -i '' 's|from "next/navigation"|from "react-router-dom"|g' src/pages/ChatPage.tsx
sed -i '' 's|useRouter|useNavigate|g' src/pages/CatalogPage.tsx
sed -i '' 's|useRouter|useNavigate|g' src/pages/ChatPage.tsx
echo "✅ Fixed navigation imports"

# 3. Fix Amplify imports - remove generateClient
sed -i '' '/import.*generateClient.*from.*aws-amplify/d' src/pages/CatalogPage.tsx
sed -i '' '/import.*generateClient.*from.*aws-amplify/d' src/pages/ChatPage.tsx
sed -i '' '/import.*Schema.*from.*amplify\/data/d' src/pages/CatalogPage.tsx
sed -i '' '/import.*Schema.*from.*amplify\/data/d' src/pages/ChatPage.tsx
echo "✅ Removed Amplify imports"

# 4. Fix path imports (../ to @/)
sed -i '' 's|from.*"\.\./\.\./\.\./utils/|from "@/utils/|g' src/pages/CatalogPage.tsx
sed -i '' 's|from.*"\.\./\.\./\.\./components/|from "@/components/|g' src/pages/CatalogPage.tsx
sed -i '' 's|from.*"\.\./\.\./\.\./services/|from "@/services/|g' src/pages/CatalogPage.tsx
echo "✅ Fixed import paths"

echo "✅ Migration complete!"
echo ""
echo "⚠️  Manual steps still needed:"
echo "1. Replace amplifyClient usage with REST API calls"
echo "2. Replace sendMessage from amplifyUtils with REST API"
echo "3. Test the pages"
