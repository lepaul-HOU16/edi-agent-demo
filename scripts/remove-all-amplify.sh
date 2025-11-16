#!/bin/bash

# Nuclear option - remove ALL Amplify imports and usage

echo "Removing ALL Amplify usage from codebase..."

# Remove all Amplify imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "/import.*from ['\"']aws-amplify/d" \
  -e "/import.*from ['\"']@aws-amplify/d" \
  -e "/import.*amplify\/data/d" \
  -e "/import.*amplify\/storage/d" \
  -e "/import.*amplify\/auth/d" \
  -e "/import.*amplify\/api/d" \
  {} \;

# Remove generateClient usage
find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "/const.*amplifyClient.*=.*generateClient/d" \
  -e "/const.*client.*=.*generateClient/d" \
  {} \;

# Remove Schema imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" -exec sed -i '' \
  -e "/import.*Schema.*from.*amplify\/data\/resource/d" \
  {} \;

echo "Done removing Amplify imports"
