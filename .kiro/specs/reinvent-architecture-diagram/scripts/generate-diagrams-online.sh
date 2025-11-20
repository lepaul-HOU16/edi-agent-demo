#!/bin/bash

# Alternative script to generate diagrams using Mermaid Live Editor
# Use this if you don't have mermaid-cli installed locally

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIAGRAMS_DIR="$SCRIPT_DIR/../diagrams"
OUTPUT_DIR="$SCRIPT_DIR/../output"

mkdir -p "$OUTPUT_DIR/links"

echo "🌐 Generating Mermaid Live Editor links..."
echo ""
echo "Since mermaid-cli is not available, here are links to view and download each diagram:"
echo ""

# Base URL for Mermaid Live Editor
BASE_URL="https://mermaid.live/edit"

for mmd_file in "$DIAGRAMS_DIR"/*.mmd; do
    if [ -f "$mmd_file" ]; then
        filename=$(basename "$mmd_file" .mmd)
        
        # Read the mermaid content
        content=$(cat "$mmd_file")
        
        # URL encode the content (basic encoding)
        encoded=$(echo "$content" | jq -sRr @uri)
        
        # Create the link
        link="${BASE_URL}#pako:${encoded}"
        
        echo "📊 $filename"
        echo "   🔗 $link"
        echo ""
        
        # Save link to file
        echo "$link" > "$OUTPUT_DIR/links/${filename}.txt"
    fi
done

echo "✨ Links generated!"
echo ""
echo "📁 Links saved to: $OUTPUT_DIR/links/"
echo ""
echo "🎯 Instructions:"
echo "   1. Open each link in your browser"
echo "   2. Click 'Actions' → 'Export PNG' (or SVG/PDF)"
echo "   3. Set resolution to 1920x1080 or higher"
echo "   4. Download the diagram"
echo ""
echo "💡 Tip: You can also use https://mermaid.ink/ for direct image generation"
