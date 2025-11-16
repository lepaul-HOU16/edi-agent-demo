#!/bin/bash

# Quick TypeScript Error Fixer
# Identifies and suggests fixes for common TypeScript errors

set -e

echo "🔍 Analyzing TypeScript errors..."
echo ""

# Run TypeScript compiler and capture errors
ERROR_OUTPUT=$(npm run build 2>&1 || true)

# Count errors
ERROR_COUNT=$(echo "$ERROR_OUTPUT" | grep -c "error TS" || echo "0")

echo "Found $ERROR_COUNT TypeScript errors"
echo ""

# Categorize errors
echo "📊 Error Categories:"
echo ""

# Implicit any types
ANY_ERRORS=$(echo "$ERROR_OUTPUT" | grep -c "implicitly has an 'any' type" || echo "0")
if [ "$ANY_ERRORS" -gt 0 ]; then
  echo "❌ Implicit 'any' types: $ANY_ERRORS"
  echo "   Fix: Add explicit type annotations"
  echo ""
fi

# Type assignment errors
ASSIGN_ERRORS=$(echo "$ERROR_OUTPUT" | grep -c "is not assignable to type" || echo "0")
if [ "$ASSIGN_ERRORS" -gt 0 ]; then
  echo "❌ Type assignment errors: $ASSIGN_ERRORS"
  echo "   Fix: Ensure types match or add type guards"
  echo ""
fi

# Possibly undefined/null
UNDEFINED_ERRORS=$(echo "$ERROR_OUTPUT" | grep -c "possibly 'undefined'\|possibly 'null'" || echo "0")
if [ "$UNDEFINED_ERRORS" -gt 0 ]; then
  echo "❌ Possibly undefined/null: $UNDEFINED_ERRORS"
  echo "   Fix: Add null checks or use optional chaining"
  echo ""
fi

# Property does not exist
PROPERTY_ERRORS=$(echo "$ERROR_OUTPUT" | grep -c "Property .* does not exist" || echo "0")
if [ "$PROPERTY_ERRORS" -gt 0 ]; then
  echo "❌ Property does not exist: $PROPERTY_ERRORS"
  echo "   Fix: Check property names or add to type definition"
  echo ""
fi

echo "📝 Detailed Errors:"
echo "$ERROR_OUTPUT" | grep "error TS" | head -20

echo ""
echo "💡 Quick Fixes:"
echo ""
echo "1. For 'implicitly has any' errors:"
echo "   Add type annotations: (param: string) => ..."
echo ""
echo "2. For 'possibly undefined' errors:"
echo "   Use optional chaining: object?.property"
echo "   Or null checks: if (value) { ... }"
echo ""
echo "3. For 'not assignable' errors:"
echo "   Check type definitions match"
echo "   Use type assertions if needed: value as Type"
echo ""
echo "4. To temporarily bypass (not recommended):"
echo "   Add // @ts-ignore above the line"
echo ""
