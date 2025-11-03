#!/bin/bash

# Run unit tests for renewable project persistence
# This script runs all unit tests with proper configuration

echo "🧪 Running Unit Tests for Renewable Project Persistence"
echo "========================================================"
echo ""

# Check if jest is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Run tests with coverage
echo "Running tests with coverage..."
npx jest tests/unit/test-project-store.test.ts \
           tests/unit/test-project-name-generator.test.ts \
           tests/unit/test-session-context-manager.test.ts \
           tests/unit/test-project-resolver.test.ts \
           --coverage \
           --verbose \
           --runInBand

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All unit tests passed!"
    exit 0
else
    echo ""
    echo "❌ Some tests failed. Please review the output above."
    exit 1
fi
