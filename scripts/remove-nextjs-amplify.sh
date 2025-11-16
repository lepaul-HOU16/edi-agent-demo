#!/bin/bash

# Remove all Next.js and Amplify imports and replace with React Router equivalents

echo "Removing Next.js and Amplify dependencies..."

# Replace Next.js router with React Router
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/import { useRouter } from 'next\/navigation'/import { useNavigate } from 'react-router-dom'/g" \
  -e "s/import { useRouter } from 'next\/router'/import { useNavigate } from 'react-router-dom'/g" \
  -e "s/import { useParams, useRouter } from 'next\/navigation'/import { useParams, useNavigate } from 'react-router-dom'/g" \
  -e "s/import { useSearchParams } from 'next\/navigation'/import { useSearchParams } from 'react-router-dom'/g" \
  -e "s/const router = useRouter()/const navigate = useNavigate()/g" \
  -e "s/router\.push/navigate/g" \
  -e "s/router\.replace/navigate/g" \
  {} \;

# Replace Next.js Link with React Router Link
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/import Link from 'next\/link'/import { Link } from 'react-router-dom'/g" \
  {} \;

# Replace Next.js dynamic with React lazy
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/import dynamic from 'next\/dynamic'/\/\/ Dynamic import removed - use React.lazy if needed/g" \
  {} \;

# Remove Next.js Head
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/import Head from 'next\/head'/\/\/ Head removed - use react-helmet if needed/g" \
  {} \;

# Remove Amplify Authenticator
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e "s/import { Authenticator } from '@aws-amplify\/ui-react'/\/\/ Authenticator removed/g" \
  -e "s/import { useAuthenticator } from '@aws-amplify\/ui-react'/\/\/ useAuthenticator removed/g" \
  -e "s/import { Authenticator, useAuthenticator } from '@aws-amplify\/ui-react'/\/\/ Amplify auth removed/g" \
  {} \;

# Remove "use client" directives
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e '/"use client"/d' \
  -e "/'use client'/d" \
  {} \;

echo "Done! Check files for any remaining issues."
