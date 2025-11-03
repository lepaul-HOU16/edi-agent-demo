#!/bin/bash

# OSM Integration Test Runner
# This script runs the OSM integration validation tests

set -e

echo "🧪 Running OSM Integration Validation Tests"
echo "============================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if required dependencies are available
echo "📦 Checking dependencies..."

# Check if the terrain handler exists
TERRAIN_HANDLER="amplify/functions/renewableTools/terrain/handler.py"
if [ ! -f "$TERRAIN_HANDLER" ]; then
    echo "❌ Terrain handler not found: $TERRAIN_HANDLER"
    exit 1
fi

# Check if OSM client exists
OSM_CLIENT="amplify/functions/renewableTools/osm_client.py"
if [ ! -f "$OSM_CLIENT" ]; then
    echo "❌ OSM client not found: $OSM_CLIENT"
    exit 1
fi

echo "✅ Dependencies check passed"

# Run the tests
echo ""
echo "🚀 Starting OSM integration tests..."
echo ""

python3 scripts/test-osm-integration.py

TEST_EXIT_CODE=$?

echo ""
echo "============================================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "🎉 All OSM integration tests passed!"
    echo "✅ OSM integration is working correctly"
else
    echo "⚠️ Some OSM integration tests failed"
    echo "❌ OSM integration needs attention"
fi

exit $TEST_EXIT_CODE