#!/bin/bash

# Fix imports from ../../utils/ or ../../../utils/ to @/utils/
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s|from ['\"]../../utils/|from '@/utils/|g" \
  -e "s|from ['\"]../../../utils/|from '@/utils/|g" \
  -e "s|from ['\"]@/../utils/|from '@/utils/|g" \
  {} +

echo "Fixed all utils imports to use @/utils/"
