#!/bin/bash

# IAM Reference Cards Validation Script
# Validates HTML files and checks for completeness

set -e

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 IAM Reference Cards Validation"
echo "=================================="
echo "Working directory: $SCRIPT_DIR"
echo ""

# Check if all required files exist
REQUIRED_FILES=(
    "index.html"
    "01-lambda-authorizer.html"
    "02-chat-lambda.html"
    "03-renewable-orchestrator.html"
    "04-tool-lambdas.html"
    "05-petrophysics-calculator.html"
    "permissions-summary.html"
    "README.md"
    "generate-pdfs.sh"
)

echo "📋 Checking required files..."
all_files_exist=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ❌ $file (missing)"
        all_files_exist=false
    fi
done
echo ""

if [ "$all_files_exist" = false ]; then
    echo "❌ Some required files are missing!"
    exit 1
fi

# Validate HTML structure
echo "🔍 Validating HTML structure..."
html_valid=true
for html_file in *.html; do
    # Check for basic HTML structure
    if grep -q "<!DOCTYPE html>" "$html_file" && \
       grep -q "<html" "$html_file" && \
       grep -q "</html>" "$html_file" && \
       grep -q "<head>" "$html_file" && \
       grep -q "</head>" "$html_file" && \
       grep -q "<body>" "$html_file" && \
       grep -q "</body>" "$html_file"; then
        echo "   ✓ $html_file (valid structure)"
    else
        echo "   ❌ $html_file (invalid structure)"
        html_valid=false
    fi
done
echo ""

if [ "$html_valid" = false ]; then
    echo "❌ Some HTML files have invalid structure!"
    exit 1
fi

# Check for IAM policy JSON blocks
echo "📄 Checking for IAM policy JSON..."
policy_count=0
for html_file in 0*.html; do
    if grep -q '"Version": "2012-10-17"' "$html_file"; then
        echo "   ✓ $html_file (contains IAM policy)"
        ((policy_count++))
    else
        echo "   ⚠️  $html_file (no IAM policy found)"
    fi
done
echo ""

if [ $policy_count -eq 0 ]; then
    echo "❌ No IAM policies found in reference cards!"
    exit 1
fi

# Check for required sections
echo "📑 Checking for required sections..."
sections_valid=true
for html_file in 0*.html; do
    has_overview=false
    has_permissions=false
    has_policy=false
    
    if grep -q "Overview" "$html_file"; then
        has_overview=true
    fi
    
    if grep -q "Permissions" "$html_file" || grep -q "permissions" "$html_file"; then
        has_permissions=true
    fi
    
    if grep -q "IAM Policy" "$html_file" || grep -q "Policy JSON" "$html_file"; then
        has_policy=true
    fi
    
    if [ "$has_overview" = true ] && [ "$has_permissions" = true ] && [ "$has_policy" = true ]; then
        echo "   ✓ $html_file (all sections present)"
    else
        echo "   ⚠️  $html_file (missing sections: overview=$has_overview, permissions=$has_permissions, policy=$has_policy)"
        sections_valid=false
    fi
done
echo ""

# Check file sizes
echo "📊 File size summary..."
total_size=0
for html_file in *.html; do
    size=$(du -h "$html_file" | cut -f1)
    echo "   $html_file: $size"
    size_bytes=$(du -b "$html_file" | cut -f1)
    total_size=$((total_size + size_bytes))
done
total_size_human=$(echo "$total_size" | awk '{printf "%.1f KB", $1/1024}')
echo "   Total: $total_size_human"
echo ""

# Summary
echo "✅ Validation Summary"
echo "===================="
echo "   Files checked: ${#REQUIRED_FILES[@]}"
echo "   HTML files: $(ls -1 *.html | wc -l)"
echo "   IAM policies found: $policy_count"
echo "   Total size: $total_size_human"
echo ""

if [ "$all_files_exist" = true ] && [ "$html_valid" = true ] && [ $policy_count -ge 5 ]; then
    echo "✅ All validation checks passed!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Open index.html in your browser to preview"
    echo "   2. Run ./generate-pdfs.sh to create PDF versions"
    echo "   3. Print cards for presentation use"
    exit 0
else
    echo "⚠️  Some validation checks failed. Please review the output above."
    exit 1
fi
