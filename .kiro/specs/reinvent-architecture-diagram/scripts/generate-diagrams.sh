#!/bin/bash

# Script to generate high-resolution architecture diagrams from Mermaid files
# Requires: mmdc (mermaid-cli) - install with: npm install -g @mermaid-js/mermaid-cli

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIAGRAMS_DIR="$SCRIPT_DIR/../diagrams"
OUTPUT_DIR="$SCRIPT_DIR/../output"

# Create output directories
mkdir -p "$OUTPUT_DIR/png"
mkdir -p "$OUTPUT_DIR/svg"
mkdir -p "$OUTPUT_DIR/pdf"

echo "🎨 Generating high-resolution architecture diagrams..."
echo ""

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "❌ Error: mermaid-cli (mmdc) is not installed"
    echo "📦 Install with: npm install -g @mermaid-js/mermaid-cli"
    exit 1
fi

# Configuration for high-resolution output
MERMAID_CONFIG='{
  "theme": "default",
  "themeVariables": {
    "primaryColor": "#ff9900",
    "primaryTextColor": "#232f3e",
    "primaryBorderColor": "#232f3e",
    "lineColor": "#545b64",
    "secondaryColor": "#ec7211",
    "tertiaryColor": "#ffffff"
  },
  "flowchart": {
    "curve": "basis",
    "padding": 20
  },
  "sequence": {
    "actorMargin": 50,
    "boxMargin": 10,
    "boxTextMargin": 5,
    "noteMargin": 10,
    "messageMargin": 35
  }
}'

echo "$MERMAID_CONFIG" > "$OUTPUT_DIR/mermaid-config.json"

# Process each Mermaid file
for mmd_file in "$DIAGRAMS_DIR"/*.mmd; do
    if [ -f "$mmd_file" ]; then
        filename=$(basename "$mmd_file" .mmd)
        echo "📊 Processing: $filename"
        
        # Generate PNG (1920x1080 minimum)
        echo "  → Generating PNG..."
        mmdc -i "$mmd_file" \
             -o "$OUTPUT_DIR/png/${filename}.png" \
             -c "$OUTPUT_DIR/mermaid-config.json" \
             -w 1920 \
             -H 1080 \
             -b transparent \
             -s 2
        
        # Generate SVG (vector format)
        echo "  → Generating SVG..."
        mmdc -i "$mmd_file" \
             -o "$OUTPUT_DIR/svg/${filename}.svg" \
             -c "$OUTPUT_DIR/mermaid-config.json" \
             -b transparent
        
        # Generate PDF (for printing)
        echo "  → Generating PDF..."
        mmdc -i "$mmd_file" \
             -o "$OUTPUT_DIR/pdf/${filename}.pdf" \
             -c "$OUTPUT_DIR/mermaid-config.json" \
             -b white
        
        echo "  ✅ Complete"
        echo ""
    fi
done

echo "✨ All diagrams generated successfully!"
echo ""
echo "📁 Output locations:"
echo "   PNG: $OUTPUT_DIR/png/"
echo "   SVG: $OUTPUT_DIR/svg/"
echo "   PDF: $OUTPUT_DIR/pdf/"
echo ""
echo "🎯 Next steps:"
echo "   1. Review diagrams in output directories"
echo "   2. Use PNG files for presentations (1920x1080)"
echo "   3. Use SVG files for web/documentation"
echo "   4. Use PDF files for printing"
