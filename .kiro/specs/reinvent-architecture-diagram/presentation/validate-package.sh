#!/bin/bash

# Validate Presentation Package
# This script checks that all required materials are present and properly formatted

set -e

echo "🔍 Validating AWS re:Invent Presentation Package..."
echo ""

SPEC_DIR=".kiro/specs/reinvent-architecture-diagram"
PRESENTATION_DIR="$SPEC_DIR/presentation"
ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Helper functions
error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_file() {
    if [ -f "$1" ]; then
        success "Found: $1"
        return 0
    else
        error "Missing: $1"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        success "Found directory: $1"
        return 0
    else
        error "Missing directory: $1"
        return 1
    fi
}

# Check presentation directory exists
echo "📁 Checking presentation directory..."
if ! check_dir "$PRESENTATION_DIR"; then
    echo ""
    echo "❌ Presentation directory not found. Cannot continue validation."
    exit 1
fi
echo ""

# Check core files
echo "📄 Checking core presentation files..."
check_file "$PRESENTATION_DIR/README.md"
check_file "$PRESENTATION_DIR/master-deck.html"
check_file "$PRESENTATION_DIR/speaker-notes.md"
check_file "$PRESENTATION_DIR/demo-script.md"
check_file "$PRESENTATION_DIR/handout-content.md"
check_file "$PRESENTATION_DIR/package-presentation.sh"
echo ""

# Check packaging script is executable
echo "🔧 Checking packaging script..."
if [ -x "$PRESENTATION_DIR/package-presentation.sh" ]; then
    success "Packaging script is executable"
else
    warning "Packaging script is not executable (run: chmod +x package-presentation.sh)"
fi
echo ""

# Check master deck HTML structure
echo "🎨 Validating master deck HTML..."
if [ -f "$PRESENTATION_DIR/master-deck.html" ]; then
    if grep -q "reveal.js" "$PRESENTATION_DIR/master-deck.html"; then
        success "Master deck uses Reveal.js"
    else
        warning "Master deck may not be using Reveal.js"
    fi
    
    if grep -q "Building Multi-Agent AI Systems" "$PRESENTATION_DIR/master-deck.html"; then
        success "Master deck has correct title"
    else
        warning "Master deck title may be incorrect"
    fi
    
    SLIDE_COUNT=$(grep -c "<section>" "$PRESENTATION_DIR/master-deck.html" || echo "0")
    if [ "$SLIDE_COUNT" -gt 30 ]; then
        success "Master deck has $SLIDE_COUNT slides"
    else
        warning "Master deck has only $SLIDE_COUNT slides (expected 30+)"
    fi
fi
echo ""

# Check speaker notes structure
echo "📝 Validating speaker notes..."
if [ -f "$PRESENTATION_DIR/speaker-notes.md" ]; then
    if grep -q "Slide 1:" "$PRESENTATION_DIR/speaker-notes.md"; then
        success "Speaker notes have slide-by-slide breakdown"
    else
        warning "Speaker notes may not have slide-by-slide breakdown"
    fi
    
    if grep -q "Timing" "$PRESENTATION_DIR/speaker-notes.md"; then
        success "Speaker notes include timing information"
    else
        warning "Speaker notes may not include timing information"
    fi
    
    if grep -q "Demo" "$PRESENTATION_DIR/speaker-notes.md"; then
        success "Speaker notes include demo guidance"
    else
        warning "Speaker notes may not include demo guidance"
    fi
fi
echo ""

# Check demo script structure
echo "🎬 Validating demo script..."
if [ -f "$PRESENTATION_DIR/demo-script.md" ]; then
    if grep -q "Pre-Demo Checklist" "$PRESENTATION_DIR/demo-script.md"; then
        success "Demo script has pre-demo checklist"
    else
        warning "Demo script may not have pre-demo checklist"
    fi
    
    if grep -q "Demo 1:" "$PRESENTATION_DIR/demo-script.md"; then
        success "Demo script has demo scenarios"
    else
        warning "Demo script may not have demo scenarios"
    fi
    
    if grep -q "If It Fails" "$PRESENTATION_DIR/demo-script.md"; then
        success "Demo script has failure recovery plans"
    else
        warning "Demo script may not have failure recovery plans"
    fi
fi
echo ""

# Check handout content
echo "📄 Validating handout content..."
if [ -f "$PRESENTATION_DIR/handout-content.md" ]; then
    if grep -q "Quick Reference" "$PRESENTATION_DIR/handout-content.md"; then
        success "Handout has quick reference section"
    else
        warning "Handout may not have quick reference section"
    fi
    
    if grep -q "Architecture Overview" "$PRESENTATION_DIR/handout-content.md"; then
        success "Handout has architecture overview"
    else
        warning "Handout may not have architecture overview"
    fi
    
    if grep -q "IAM Permissions" "$PRESENTATION_DIR/handout-content.md"; then
        success "Handout has IAM permissions reference"
    else
        warning "Handout may not have IAM permissions reference"
    fi
    
    if grep -q "Quick Start" "$PRESENTATION_DIR/handout-content.md"; then
        success "Handout has quick start guide"
    else
        warning "Handout may not have quick start guide"
    fi
fi
echo ""

# Check supporting materials
echo "📚 Checking supporting materials..."
check_dir "$SPEC_DIR/diagrams"
check_dir "$SPEC_DIR/iam-reference-cards"
check_dir "$SPEC_DIR/integration-guide"
check_dir "$SPEC_DIR/starter-kit"
check_dir "$SPEC_DIR/performance"
check_dir "$SPEC_DIR/operations"
check_dir "$SPEC_DIR/artifacts"
check_dir "$SPEC_DIR/slides"
echo ""

# Check key supporting files
echo "📋 Checking key supporting files..."
check_file "$SPEC_DIR/QUICK-START.md"
check_file "$SPEC_DIR/PRESENTATION-QUICK-REFERENCE.md"
check_file "$SPEC_DIR/AWS-ICONS-GUIDE.md"
check_file "$SPEC_DIR/README.md"
echo ""

# Check diagrams
echo "🎨 Checking diagrams..."
DIAGRAM_COUNT=$(find "$SPEC_DIR/diagrams" -name "*.mmd" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIAGRAM_COUNT" -gt 10 ]; then
    success "Found $DIAGRAM_COUNT Mermaid diagrams"
else
    warning "Found only $DIAGRAM_COUNT Mermaid diagrams (expected 10+)"
fi
echo ""

# Check IAM reference cards
echo "🔐 Checking IAM reference cards..."
IAM_CARD_COUNT=$(find "$SPEC_DIR/iam-reference-cards" -name "*.html" 2>/dev/null | wc -l | tr -d ' ')
if [ "$IAM_CARD_COUNT" -ge 5 ]; then
    success "Found $IAM_CARD_COUNT IAM reference cards"
else
    warning "Found only $IAM_CARD_COUNT IAM reference cards (expected 5+)"
fi
echo ""

# Check starter kit
echo "🚀 Checking starter kit..."
if [ -f "$SPEC_DIR/starter-kit/README.md" ]; then
    success "Starter kit has README"
else
    warning "Starter kit may not have README"
fi

if [ -f "$SPEC_DIR/starter-kit/package.json" ]; then
    success "Starter kit has package.json"
else
    warning "Starter kit may not have package.json"
fi

if [ -d "$SPEC_DIR/starter-kit/cdk" ]; then
    success "Starter kit has CDK infrastructure"
else
    warning "Starter kit may not have CDK infrastructure"
fi
echo ""

# Check for QR code generation capability
echo "🔲 Checking QR code generation..."
if command -v qrencode &> /dev/null; then
    success "qrencode is installed (QR codes can be generated)"
else
    warning "qrencode is not installed (QR codes will not be generated)"
    echo "   Install with: brew install qrencode (macOS) or apt-get install qrencode (Linux)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Perfect! All checks passed.${NC}"
    echo ""
    echo "🎉 Presentation package is complete and ready for distribution!"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./presentation/package-presentation.sh"
    echo "2. Review: presentation-package/"
    echo "3. Test: open presentation-package/slides/master-deck.html"
    echo "4. Distribute: Share the generated ZIP file"
    EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validation passed with $WARNINGS warning(s).${NC}"
    echo ""
    echo "The package is functional but has some minor issues."
    echo "Review the warnings above and address them if needed."
    echo ""
    echo "You can still proceed with packaging:"
    echo "Run: ./presentation/package-presentation.sh"
    EXIT_CODE=0
else
    echo -e "${RED}❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s).${NC}"
    echo ""
    echo "Please address the errors above before packaging."
    echo "The presentation package is incomplete."
    EXIT_CODE=1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $EXIT_CODE
