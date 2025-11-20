#!/bin/bash

# IAM Reference Cards PDF Generator
# Generates printable PDFs from HTML reference cards using headless Chrome

set -e

echo "🔐 IAM Reference Cards PDF Generator"
echo "===================================="
echo ""

# Check if Chrome/Chromium is installed
if command -v google-chrome &> /dev/null; then
    CHROME="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME="chromium-browser"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
    echo "❌ Error: Chrome or Chromium not found"
    echo ""
    echo "Please install Chrome or Chromium:"
    echo "  - macOS: brew install --cask google-chrome"
    echo "  - Ubuntu: sudo apt install chromium-browser"
    echo "  - Fedora: sudo dnf install chromium"
    echo ""
    echo "Or manually print each HTML file using your browser:"
    echo "  1. Open the HTML file in your browser"
    echo "  2. Press Ctrl/Cmd+P"
    echo "  3. Select 'Save as PDF'"
    echo "  4. Save with the card name"
    exit 1
fi

echo "✓ Found Chrome/Chromium: $CHROME"
echo ""

# Create output directory
OUTPUT_DIR="pdfs"
mkdir -p "$OUTPUT_DIR"

# Array of HTML files to convert
HTML_FILES=(
    "01-lambda-authorizer.html"
    "02-chat-lambda.html"
    "03-renewable-orchestrator.html"
    "04-tool-lambdas.html"
    "05-petrophysics-calculator.html"
    "permissions-summary.html"
)

# Convert each HTML file to PDF
for html_file in "${HTML_FILES[@]}"; do
    if [ ! -f "$html_file" ]; then
        echo "⚠️  Warning: $html_file not found, skipping..."
        continue
    fi
    
    # Get base name without extension
    base_name="${html_file%.html}"
    pdf_file="$OUTPUT_DIR/${base_name}.pdf"
    
    echo "📄 Converting $html_file to PDF..."
    
    # Convert to absolute path
    abs_html_path="$(pwd)/$html_file"
    abs_pdf_path="$(pwd)/$pdf_file"
    
    # Use Chrome headless to generate PDF
    "$CHROME" \
        --headless \
        --disable-gpu \
        --no-pdf-header-footer \
        --print-to-pdf="$abs_pdf_path" \
        --print-to-pdf-no-header \
        "file://$abs_html_path" \
        2>/dev/null
    
    if [ -f "$pdf_file" ]; then
        file_size=$(du -h "$pdf_file" | cut -f1)
        echo "   ✓ Generated: $pdf_file ($file_size)"
    else
        echo "   ❌ Failed to generate: $pdf_file"
    fi
done

echo ""
echo "✅ PDF generation complete!"
echo ""
echo "📦 Output directory: $OUTPUT_DIR/"
echo ""
echo "Generated files:"
ls -lh "$OUTPUT_DIR"/*.pdf 2>/dev/null || echo "No PDFs generated"
echo ""
echo "💡 Tip: You can also open index.html in your browser and print manually"
echo "   for more control over page layout and formatting."
