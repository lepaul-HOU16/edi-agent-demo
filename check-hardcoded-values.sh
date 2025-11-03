#!/bin/bash

echo "🔍 Checking for hardcoded values and mock data fallbacks..."
echo ""

echo "1️⃣ HARDCODED BUCKET NAMES IN LAMBDA FUNCTIONS:"
echo "================================================"
grep -r "amplify-d1eeg2gu6ddc3z\|amplify-digitalassistant\|renewable-energy-artifacts" \
  amplify/functions/ \
  --include="*.ts" \
  --include="*.py" \
  --include="*.js" \
  | grep -v "test" \
  | grep -v ".md" \
  | head -20

echo ""
echo "2️⃣ HARDCODED FUNCTION NAMES:"
echo "================================================"
grep -r "amplify-digitalassistant--" \
  amplify/functions/ \
  --include="*.ts" \
  --include="*.py" \
  | grep -v "test" \
  | grep -v ".md" \
  | head -10

echo ""
echo "3️⃣ MOCK/SYNTHETIC DATA FALLBACKS:"
echo "================================================"
grep -ri "mock.*return\|synthetic.*return\|fallback.*data" \
  amplify/functions/ \
  --include="*.ts" \
  --include="*.py" \
  | grep -v "test" \
  | grep -v ".md" \
  | head -10

echo ""
echo "✅ Check complete"
