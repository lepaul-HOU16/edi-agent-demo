#!/bin/bash

# Fix all pages by removing Next.js and Amplify dependencies

for file in src/pages/*.tsx; do
  echo "Processing $file..."
  
  # Replace next/router with react-router-dom
  sed -i '' "s/import router from 'next\/router';//g" "$file"
  sed -i '' "s/from 'next\/navigation'/from 'react-router-dom'/g" "$file"
  sed -i '' "s/useRouter/useNavigate/g" "$file"
  sed -i '' "s/useSearchParams/useSearchParams/g" "$file"
  sed -i '' "s/router\.push/navigate/g" "$file"
  
  # Remove useAuthenticator calls - replace with mock
  sed -i '' "s/const { authStatus } = useAuthenticator.*$/const authStatus = 'unauthenticated';/g" "$file"
  sed -i '' "s/const { user } = useAuthenticator.*$/const user = null;/g" "$file"
  
  # Remove Amplify client references
  sed -i '' "s/const \[amplifyClient.*$/\/\/ Amplify client removed/g" "$file"
  sed -i '' "s/if (!amplifyClient).*$/\/\/ Auth check removed/g" "$file"
  
  # Add useNavigate import if not present
  if ! grep -q "useNavigate" "$file"; then
    sed -i '' "s/from 'react-router-dom'/from 'react-router-dom';\nimport { useNavigate } from 'react-router-dom'/g" "$file"
  fi
done

echo "Done!"
