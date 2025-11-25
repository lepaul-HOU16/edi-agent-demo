#!/bin/bash

# Convert all Mermaid diagrams to PNG
echo "Converting Mermaid diagrams to PNG..."

INPUT_DIR="docs/architecture-diagrams"
OUTPUT_DIR="docs/architecture-diagrams/png"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Convert each .mmd file to PNG
for file in "$INPUT_DIR"/*.mmd; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .mmd)
        echo "Converting $filename..."
        mmdc -i "$file" -o "$OUTPUT_DIR/${filename}.png" -w 2400 -H 1600 -b transparent
    fi
done

echo "✅ Conversion complete! PNG files are in $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"
