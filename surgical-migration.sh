#!/bin/bash

echo "🔄 Performing surgical migration - preserving DOM structure..."

# Get original file
git show 02702d1:"src/app/catalog/page.tsx" > src/pages/CatalogPage.tsx.new

# 1. Remove 'use client'
sed -i '' "1s/'use client';//" src/pages/CatalogPage.tsx.new

# 2. Fix imports - ONLY navigation
sed -i '' 's|from "next/navigation"|from "react-router-dom"|g' src/pages/CatalogPage.tsx.new

# 3. Fix relative imports to absolute
sed -i '' 's|from "\.\./\.\./\.\./|from "@/|g' src/pages/CatalogPage.tsx.new

# 4. Remove Amplify imports but keep the code structure
sed -i '' '/import.*generateClient.*from.*aws-amplify/d' src/pages/CatalogPage.tsx.new
sed -i '' '/import.*Schema.*from.*amplify\/data/d' src/pages/CatalogPage.tsx.new

# 5. Comment out amplifyClient initialization (don't remove it)
sed -i '' 's|const amplifyClient = React.useMemo|// const amplifyClient = React.useMemo|' src/pages/CatalogPage.tsx.new
sed -i '' 's|generateClient<Schema>()|null // generateClient removed|' src/pages/CatalogPage.tsx.new

# 6. Fix Schema types
sed -i '' 's|Schema\["ChatSession"\]\["createType"\]|any|g' src/pages/CatalogPage.tsx.new

# Replace current file
mv src/pages/CatalogPage.tsx src/pages/CatalogPage.tsx.broken
mv src/pages/CatalogPage.tsx.new src/pages/CatalogPage.tsx

echo "✅ Surgical migration complete"
echo "⚠️  The file will have some API calls that need REST implementation"
echo "⚠️  But the DOM structure is preserved"
