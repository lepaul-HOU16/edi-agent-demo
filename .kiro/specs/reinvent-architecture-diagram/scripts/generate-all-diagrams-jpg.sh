#!/bin/bash

# Script to generate JPG images from all Mermaid diagram files
# Usage: ./scripts/generate-all-diagrams-jpg.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Mermaid Diagram to PNG Converter"
echo "========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Define paths
DIAGRAMS_DIR="$PROJECT_ROOT/diagrams"
OUTPUT_DIR="$PROJECT_ROOT/diagrams/output/png"

# Create output directory if it doesn't exist
echo "Creating output directory: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo -e "${RED}ERROR: mmdc (Mermaid CLI) is not installed${NC}"
    echo "Please install it with: npm install -g @mermaid-js/mermaid-cli"
    exit 1
fi

echo -e "${GREEN}✓ Mermaid CLI found: $(mmdc --version)${NC}"
echo ""

# Find all .mmd files in the diagrams directory
MMD_FILES=$(find "$DIAGRAMS_DIR" -maxdepth 1 -name "*.mmd" -type f)

if [ -z "$MMD_FILES" ]; then
    echo -e "${YELLOW}WARNING: No .mmd files found in $DIAGRAMS_DIR${NC}"
    exit 0
fi

# Count total files
TOTAL_FILES=$(echo "$MMD_FILES" | wc -l | tr -d ' ')
CURRENT=0
SUCCESSFUL=0
FAILED=0

echo "Found $TOTAL_FILES diagram(s) to convert"
echo "========================================="
echo ""

# Process each .mmd file
for MMD_FILE in $MMD_FILES; do
    CURRENT=$((CURRENT + 1))
    FILENAME=$(basename "$MMD_FILE" .mmd)
    OUTPUT_FILE="$OUTPUT_DIR/${FILENAME}.png"
    
    echo "[$CURRENT/$TOTAL_FILES] Processing: $FILENAME.mmd"
    
    # Convert to PNG with high quality settings
    # -w 1920: Width 1920px (Full HD)
    # -H 1080: Height 1080px (Full HD)
    # -e png: Output format PNG
    # -b white: White background
    # -q: Quiet mode (suppress logs)
    
    if mmdc -i "$MMD_FILE" -o "$OUTPUT_FILE" -w 1920 -H 1080 -e png -b white -q 2>/dev/null; then
        # Check if file was created and has reasonable size
        if [ -f "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
            echo -e "${GREEN}  ✓ Generated: ${FILENAME}.png (${FILE_SIZE})${NC}"
            SUCCESSFUL=$((SUCCESSFUL + 1))
        else
            echo -e "${RED}  ✗ Failed: Output file not created${NC}"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}  ✗ Failed: mmdc command failed${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    echo ""
done

# Summary
echo "========================================="
echo "Conversion Summary"
echo "========================================="
echo "Total files:      $TOTAL_FILES"
echo -e "${GREEN}Successful:       $SUCCESSFUL${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed:           $FAILED${NC}"
else
    echo "Failed:           $FAILED"
fi
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All diagrams converted successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some diagrams failed to convert${NC}"
    exit 1
fi
