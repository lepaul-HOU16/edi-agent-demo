#!/bin/bash

echo "Verifying Lambda Layer Build..."
echo ""

LAYER_DIR="amplify/layers/catalogSearchLayer/python"

if [ ! -d "$LAYER_DIR" ]; then
    echo "❌ FAILED: Layer directory not found at $LAYER_DIR"
    echo ""
    echo "Run this command to build the layer:"
    echo "  cd amplify/layers/catalogSearchLayer && ./build-layer.sh"
    exit 1
fi

echo "✅ Layer directory exists"

# Check for key packages
PACKAGES=("requests" "boto3" "strands" "mcp")
ALL_FOUND=true

for pkg in "${PACKAGES[@]}"; do
    if [ -d "$LAYER_DIR/$pkg" ] || [ -d "$LAYER_DIR/${pkg//-/_}" ]; then
        echo "✅ Package found: $pkg"
    else
        echo "❌ Package missing: $pkg"
        ALL_FOUND=false
    fi
done

echo ""

if [ "$ALL_FOUND" = true ]; then
    echo "✅ All required packages found!"
    echo ""
    echo "Layer is ready for deployment."
    echo "Run: npx ampx sandbox"
    exit 0
else
    echo "❌ Some packages are missing!"
    echo ""
    echo "Rebuild the layer:"
    echo "  cd amplify/layers/catalogSearchLayer && ./build-layer.sh"
    exit 1
fi
