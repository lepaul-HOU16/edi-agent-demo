#!/bin/bash

# Validation script for AgentCore Integration Presentation

echo "🔍 Validating AgentCore Integration Presentation..."
echo ""

# Check if files exist
echo "✓ Checking files..."
files=(
    "agentcore-integration.html"
    "README.md"
    "speaker-notes.md"
    "QUICK-REFERENCE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file exists"
    else
        echo "  ❌ $file missing"
        exit 1
    fi
done

echo ""
echo "✓ Checking HTML structure..."

# Check for required HTML elements
if grep -q "<!DOCTYPE html>" agentcore-integration.html; then
    echo "  ✅ Valid HTML5 doctype"
else
    echo "  ❌ Missing HTML5 doctype"
    exit 1
fi

if grep -q "reveal.js" agentcore-integration.html; then
    echo "  ✅ Reveal.js included"
else
    echo "  ❌ Reveal.js not found"
    exit 1
fi

if grep -q "highlight.js" agentcore-integration.html; then
    echo "  ✅ Highlight.js included"
else
    echo "  ❌ Highlight.js not found"
    exit 1
fi

echo ""
echo "✓ Checking slide content..."

# Count slides
slide_count=$(grep -c "<section" agentcore-integration.html)
echo "  ✅ Found $slide_count slides"

if [ "$slide_count" -lt 30 ]; then
    echo "  ⚠️  Warning: Expected at least 30 slides"
fi

# Check for code examples
code_count=$(grep -c "<code" agentcore-integration.html)
echo "  ✅ Found $code_count code blocks"

# Check for key content
if grep -q "AgentRouter" agentcore-integration.html; then
    echo "  ✅ AgentRouter content found"
else
    echo "  ❌ AgentRouter content missing"
    exit 1
fi

if grep -q "Intent Detection" agentcore-integration.html; then
    echo "  ✅ Intent Detection content found"
else
    echo "  ❌ Intent Detection content missing"
    exit 1
fi

if grep -q "Pattern Matching" agentcore-integration.html; then
    echo "  ✅ Pattern Matching content found"
else
    echo "  ❌ Pattern Matching content missing"
    exit 1
fi

echo ""
echo "✓ Checking documentation..."

# Check README
if grep -q "Navigation" README.md; then
    echo "  ✅ README has navigation instructions"
else
    echo "  ❌ README missing navigation instructions"
    exit 1
fi

# Check speaker notes
if grep -q "Duration:" speaker-notes.md; then
    echo "  ✅ Speaker notes have timing guidance"
else
    echo "  ❌ Speaker notes missing timing guidance"
    exit 1
fi

# Check quick reference
if grep -q "Integration Checklist" QUICK-REFERENCE.md; then
    echo "  ✅ Quick reference has checklist"
else
    echo "  ❌ Quick reference missing checklist"
    exit 1
fi

echo ""
echo "✅ All validation checks passed!"
echo ""
echo "📊 Summary:"
echo "  - Files: ${#files[@]}"
echo "  - Slides: $slide_count"
echo "  - Code blocks: $code_count"
echo ""
echo "🚀 Presentation is ready for use!"
echo ""
echo "To view locally:"
echo "  open agentcore-integration.html"
echo ""
echo "To host on web server:"
echo "  python3 -m http.server 8000"
echo "  # Then open: http://localhost:8000/agentcore-integration.html"
