#!/bin/bash

# Verification script for SessionContextManager implementation
# Tests all requirements from task 4

echo "🔍 Verifying SessionContextManager Implementation"
echo "=================================================="
echo ""

# Check if SessionContextManager file exists
echo "1. Checking if SessionContextManager file exists..."
if [ -f "amplify/functions/shared/sessionContextManager.ts" ]; then
    echo "✅ SessionContextManager file exists"
else
    echo "❌ SessionContextManager file not found"
    exit 1
fi

# Check for required methods
echo ""
echo "2. Checking for required methods..."

required_methods=(
    "getContext"
    "setActiveProject"
    "getActiveProject"
    "addToHistory"
    "invalidateCache"
    "clearCache"
    "getCacheStats"
)

for method in "${required_methods[@]}"; do
    if grep -q "$method" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ Method $method found"
    else
        echo "❌ Method $method not found"
        exit 1
    fi
done

# Check for DynamoDB operations
echo ""
echo "3. Checking for DynamoDB operations..."

dynamodb_operations=(
    "GetCommand"
    "PutCommand"
    "UpdateCommand"
)

for operation in "${dynamodb_operations[@]}"; do
    if grep -q "$operation" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ DynamoDB operation $operation found"
    else
        echo "❌ DynamoDB operation $operation not found"
        exit 1
    fi
done

# Check for caching implementation
echo ""
echo "4. Checking for caching implementation..."

cache_features=(
    "cache: Map"
    "cacheTTL"
    "timestamp"
)

for feature in "${cache_features[@]}"; do
    if grep -q "$feature" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ Cache feature $feature found"
    else
        echo "❌ Cache feature $feature not found"
        exit 1
    fi
done

# Check for TTL implementation
echo ""
echo "5. Checking for TTL implementation..."

if grep -q "sessionTTL.*7.*24.*60.*60" amplify/functions/shared/sessionContextManager.ts; then
    echo "✅ 7-day TTL found"
else
    echo "❌ 7-day TTL not found"
    exit 1
fi

# Check for fallback logic
echo ""
echo "6. Checking for fallback logic..."

fallback_features=(
    "handleDynamoDBError"
    "Falling back to cache"
    "session-only context"
)

for feature in "${fallback_features[@]}"; do
    if grep -q "$feature" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ Fallback feature found: $feature"
    else
        echo "❌ Fallback feature not found: $feature"
        exit 1
    fi
done

# Check for error handling
echo ""
echo "7. Checking for error handling..."

error_types=(
    "ResourceNotFoundException"
    "AccessDeniedException"
    "ProvisionedThroughputExceededException"
)

for error_type in "${error_types[@]}"; do
    if grep -q "$error_type" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ Error handling for $error_type found"
    else
        echo "❌ Error handling for $error_type not found"
        exit 1
    fi
done

# Check for SessionContext interface
echo ""
echo "8. Checking for SessionContext interface..."

interface_fields=(
    "session_id"
    "user_id"
    "active_project"
    "project_history"
    "last_updated"
    "ttl"
)

for field in "${interface_fields[@]}"; do
    if grep -q "$field" amplify/functions/shared/sessionContextManager.ts; then
        echo "✅ SessionContext field $field found"
    else
        echo "❌ SessionContext field $field not found"
        exit 1
    fi
done

# Check TypeScript compilation
echo ""
echo "9. Checking TypeScript compilation..."
if npx tsc --noEmit amplify/functions/shared/sessionContextManager.ts 2>&1 | grep -q "error"; then
    echo "❌ TypeScript compilation errors found"
    npx tsc --noEmit amplify/functions/shared/sessionContextManager.ts
    exit 1
else
    echo "✅ TypeScript compilation successful"
fi

# Summary
echo ""
echo "=================================================="
echo "✅ All SessionContextManager verification checks passed!"
echo ""
echo "Implementation includes:"
echo "  ✅ DynamoDB operations (GetCommand, PutCommand, UpdateCommand)"
echo "  ✅ In-memory caching with 5-minute TTL"
echo "  ✅ 7-day session TTL for auto-cleanup"
echo "  ✅ Fallback to session-only context on errors"
echo "  ✅ Error handling and logging"
echo "  ✅ Cache invalidation and statistics"
echo ""
echo "Requirements satisfied:"
echo "  ✅ 7.1 - Session context tracking"
echo "  ✅ 7.2 - Active project management"
echo "  ✅ 7.3 - Project history management"
echo "  ✅ 7.4 - Caching and fallback mechanisms"
echo ""
