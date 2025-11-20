#!/bin/bash

# Package Presentation Materials for AWS re:Invent Chalk Talk
# This script organizes all materials into a distributable package

set -e

echo "🎁 Packaging AWS re:Invent Presentation Materials..."
echo ""

# Configuration
SPEC_DIR=".kiro/specs/reinvent-architecture-diagram"
PACKAGE_DIR="$SPEC_DIR/presentation-package"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ZIP_NAME="aws-reinvent-agentcore-presentation-$TIMESTAMP.zip"

# Create package directory
echo "📁 Creating package directory..."
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Create subdirectories
mkdir -p "$PACKAGE_DIR/slides"
mkdir -p "$PACKAGE_DIR/diagrams"
mkdir -p "$PACKAGE_DIR/iam-reference-cards"
mkdir -p "$PACKAGE_DIR/integration-guide"
mkdir -p "$PACKAGE_DIR/starter-kit"
mkdir -p "$PACKAGE_DIR/performance"
mkdir -p "$PACKAGE_DIR/operations"
mkdir -p "$PACKAGE_DIR/artifacts"
mkdir -p "$PACKAGE_DIR/speaker-notes"
mkdir -p "$PACKAGE_DIR/demo-materials"
mkdir -p "$PACKAGE_DIR/handouts"

echo "✅ Directory structure created"
echo ""

# Copy slides
echo "📊 Copying slides..."
cp "$SPEC_DIR/presentation/master-deck.html" "$PACKAGE_DIR/slides/"
cp "$SPEC_DIR/slides/index.html" "$PACKAGE_DIR/slides/backup-deck.html"
cp "$SPEC_DIR/slides/agentcore-integration.html" "$PACKAGE_DIR/slides/"
cp "$SPEC_DIR/slides/README.md" "$PACKAGE_DIR/slides/"
echo "✅ Slides copied"
echo ""

# Copy diagrams
echo "🎨 Copying diagrams..."
cp -r "$SPEC_DIR/diagrams/"*.mmd "$PACKAGE_DIR/diagrams/" 2>/dev/null || true
cp -r "$SPEC_DIR/diagrams/"*.md "$PACKAGE_DIR/diagrams/" 2>/dev/null || true
cp -r "$SPEC_DIR/output/html/"*.html "$PACKAGE_DIR/diagrams/" 2>/dev/null || true
echo "✅ Diagrams copied"
echo ""

# Copy IAM reference cards
echo "🔐 Copying IAM reference cards..."
cp -r "$SPEC_DIR/iam-reference-cards/"*.html "$PACKAGE_DIR/iam-reference-cards/"
cp "$SPEC_DIR/iam-reference-cards/README.md" "$PACKAGE_DIR/iam-reference-cards/"
cp "$SPEC_DIR/iam-reference-cards/QUICK-START.md" "$PACKAGE_DIR/iam-reference-cards/"
echo "✅ IAM reference cards copied"
echo ""

# Copy integration guide
echo "📚 Copying integration guide..."
cp -r "$SPEC_DIR/integration-guide/"*.md "$PACKAGE_DIR/integration-guide/"
cp -r "$SPEC_DIR/integration-guide/templates" "$PACKAGE_DIR/integration-guide/"
echo "✅ Integration guide copied"
echo ""

# Copy starter kit
echo "🚀 Copying starter kit..."
cp -r "$SPEC_DIR/starter-kit/"* "$PACKAGE_DIR/starter-kit/"
echo "✅ Starter kit copied"
echo ""

# Copy performance materials
echo "⚡ Copying performance materials..."
cp -r "$SPEC_DIR/performance/"*.html "$PACKAGE_DIR/performance/"
cp -r "$SPEC_DIR/performance/"*.md "$PACKAGE_DIR/performance/"
echo "✅ Performance materials copied"
echo ""

# Copy operations materials
echo "🔧 Copying operations materials..."
cp -r "$SPEC_DIR/operations/"*.md "$PACKAGE_DIR/operations/"
cp -r "$SPEC_DIR/operations/"*.json "$PACKAGE_DIR/operations/"
echo "✅ Operations materials copied"
echo ""

# Copy artifacts
echo "🎯 Copying artifacts..."
cp -r "$SPEC_DIR/artifacts/"* "$PACKAGE_DIR/artifacts/"
echo "✅ Artifacts copied"
echo ""

# Copy speaker notes
echo "📝 Copying speaker notes..."
cp "$SPEC_DIR/presentation/speaker-notes.md" "$PACKAGE_DIR/speaker-notes/"
cp "$SPEC_DIR/slides/speaker-notes.md" "$PACKAGE_DIR/speaker-notes/detailed-notes.md"
echo "✅ Speaker notes copied"
echo ""

# Copy demo materials
echo "🎬 Copying demo materials..."
cp "$SPEC_DIR/presentation/demo-script.md" "$PACKAGE_DIR/demo-materials/"
echo "✅ Demo materials copied"
echo ""

# Copy handout
echo "📄 Copying handout..."
cp "$SPEC_DIR/presentation/handout-content.md" "$PACKAGE_DIR/handouts/"
echo "✅ Handout copied"
echo ""

# Copy main documentation
echo "📖 Copying main documentation..."
cp "$SPEC_DIR/presentation/README.md" "$PACKAGE_DIR/"
cp "$SPEC_DIR/QUICK-START.md" "$PACKAGE_DIR/"
cp "$SPEC_DIR/PRESENTATION-QUICK-REFERENCE.md" "$PACKAGE_DIR/"
cp "$SPEC_DIR/AWS-ICONS-GUIDE.md" "$PACKAGE_DIR/"
echo "✅ Main documentation copied"
echo ""

# Generate QR codes (if qrencode is installed)
echo "🔲 Generating QR codes..."
if command -v qrencode &> /dev/null; then
    mkdir -p "$PACKAGE_DIR/qr-codes"
    
    # GitHub repository QR code
    echo "https://github.com/[your-repo]/aws-agentcore-starter-kit" | \
        qrencode -o "$PACKAGE_DIR/qr-codes/github-repo.png" -s 10
    
    # Resources QR code
    echo "https://[your-domain]/resources" | \
        qrencode -o "$PACKAGE_DIR/qr-codes/resources.png" -s 10
    
    # Feedback QR code
    echo "https://[your-domain]/feedback" | \
        qrencode -o "$PACKAGE_DIR/qr-codes/feedback.png" -s 10
    
    echo "✅ QR codes generated"
else
    echo "⚠️  qrencode not installed, skipping QR code generation"
    echo "   Install with: brew install qrencode (macOS) or apt-get install qrencode (Linux)"
fi
echo ""

# Create index file
echo "📑 Creating package index..."
cat > "$PACKAGE_DIR/INDEX.md" << 'EOF'
# AWS re:Invent Presentation Package Index

## Package Contents

### 1. Slides (`slides/`)
- `master-deck.html` - Main presentation deck (Reveal.js)
- `backup-deck.html` - Backup presentation
- `agentcore-integration.html` - Deep dive slides
- `README.md` - Slides documentation

### 2. Diagrams (`diagrams/`)
- Mermaid source files (`.mmd`)
- HTML previews
- Architecture diagrams
- Flow diagrams
- Sequence diagrams

### 3. IAM Reference Cards (`iam-reference-cards/`)
- HTML reference cards for each Lambda role
- Quick start guide
- Permissions summary

### 4. Integration Guide (`integration-guide/`)
- Step-by-step integration instructions
- Code templates
- Decision trees
- Examples

### 5. Starter Kit (`starter-kit/`)
- Complete CDK infrastructure
- Example agent implementations
- Deployment scripts
- Documentation

### 6. Performance Materials (`performance/`)
- Lambda configurations
- Cost calculator
- Capacity planning
- Benchmarking results

### 7. Operations Materials (`operations/`)
- Deployment pipeline
- Monitoring dashboards
- Troubleshooting guides
- Operations runbook

### 8. Artifacts (`artifacts/`)
- Sample artifacts
- Component examples
- Schema definitions
- S3 patterns

### 9. Speaker Notes (`speaker-notes/`)
- Detailed presentation notes
- Timing guidance
- Talking points
- Backup plans

### 10. Demo Materials (`demo-materials/`)
- Demo script
- Expected outputs
- Troubleshooting guide
- Backup materials

### 11. Handouts (`handouts/`)
- Attendee handout content
- Quick reference guide
- Cheat sheets

### 12. QR Codes (`qr-codes/`)
- GitHub repository
- Resources page
- Feedback form

## Quick Start

1. **For Presenters**:
   - Review `README.md`
   - Open `slides/master-deck.html`
   - Read `speaker-notes/speaker-notes.md`
   - Practice with `demo-materials/demo-script.md`

2. **For Attendees**:
   - Start with `QUICK-START.md`
   - Deploy `starter-kit/`
   - Reference `handouts/handout-content.md`

3. **For Developers**:
   - Explore `integration-guide/`
   - Review `iam-reference-cards/`
   - Study `artifacts/` examples

## File Sizes

- Total package: ~50MB
- Slides: ~5MB
- Diagrams: ~10MB
- Starter kit: ~20MB
- Documentation: ~5MB
- Other: ~10MB

## Distribution

- **Digital**: ZIP file via email or download link
- **Physical**: USB drives at event
- **Online**: GitHub repository

## Support

- **GitHub**: https://github.com/[your-repo]
- **Email**: support@example.com
- **Slack**: [slack-invite-url]

## Version

- **Package Date**: $(date +%Y-%m-%d)
- **Version**: 1.0
- **Event**: AWS re:Invent 2025

---

**Ready to present!** 🎤
EOF

echo "✅ Package index created"
echo ""

# Create ZIP file
echo "📦 Creating ZIP archive..."
cd "$SPEC_DIR"
zip -r "$ZIP_NAME" "presentation-package/" -q
echo "✅ ZIP archive created: $ZIP_NAME"
echo ""

# Generate package summary
PACKAGE_SIZE=$(du -sh "presentation-package" | cut -f1)
ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
FILE_COUNT=$(find "presentation-package" -type f | wc -l | tr -d ' ')

echo "📊 Package Summary"
echo "=================="
echo "Package directory: $PACKAGE_SIZE"
echo "ZIP file: $ZIP_SIZE"
echo "Total files: $FILE_COUNT"
echo "Location: $SPEC_DIR/$ZIP_NAME"
echo ""

# Create distribution checklist
cat > "$PACKAGE_DIR/DISTRIBUTION-CHECKLIST.md" << 'EOF'
# Distribution Checklist

## Pre-Event (1 week before)

- [ ] Test all slides in presentation environment
- [ ] Verify all links work
- [ ] Test QR codes
- [ ] Print handouts (50 copies)
- [ ] Load USB drives (10 drives)
- [ ] Test demo environment
- [ ] Backup all materials to cloud

## Event Day

- [ ] Bring USB drives
- [ ] Bring printed handouts
- [ ] Bring backup laptop
- [ ] Bring mobile hotspot
- [ ] Test presentation setup
- [ ] Verify internet connection
- [ ] Test demo one more time

## During Presentation

- [ ] Distribute handouts
- [ ] Show QR codes on slides
- [ ] Mention USB drives available
- [ ] Collect feedback forms

## Post-Event

- [ ] Upload recording (if recorded)
- [ ] Share slides online
- [ ] Send follow-up email with links
- [ ] Post to social media
- [ ] Update repository with feedback
- [ ] Schedule office hours

## Distribution Channels

### Digital
- [ ] Email to attendees
- [ ] Upload to event platform
- [ ] Post on GitHub
- [ ] Share on LinkedIn
- [ ] Tweet with hashtag

### Physical
- [ ] USB drives at registration
- [ ] Printed handouts at session
- [ ] Business cards with QR code

### Online
- [ ] GitHub repository
- [ ] Documentation site
- [ ] Video tutorials
- [ ] Blog post

## Metrics to Track

- [ ] Number of downloads
- [ ] GitHub stars/forks
- [ ] Slack community joins
- [ ] Feedback form responses
- [ ] Office hours attendance
- [ ] Starter kit deployments

## Follow-Up Actions

- [ ] Thank attendees (email)
- [ ] Share additional resources
- [ ] Announce office hours
- [ ] Invite to community
- [ ] Request testimonials
- [ ] Plan next presentation

---

**Distribution Date**: $(date +%Y-%m-%d)
**Event**: AWS re:Invent 2025
**Session**: Building Multi-Agent AI Systems with AWS Bedrock
EOF

echo "✅ Distribution checklist created"
echo ""

# Create presenter checklist
cat > "$PACKAGE_DIR/PRESENTER-CHECKLIST.md" << 'EOF'
# Presenter Checklist

## 1 Week Before

- [ ] Review all slides
- [ ] Practice presentation (full run-through)
- [ ] Test demo environment
- [ ] Verify AWS credentials
- [ ] Check all links and QR codes
- [ ] Print handouts
- [ ] Prepare USB drives
- [ ] Test backup laptop
- [ ] Review speaker notes
- [ ] Prepare for Q&A

## 1 Day Before

- [ ] Final demo test
- [ ] Verify internet connection
- [ ] Charge all devices
- [ ] Pack materials:
  - [ ] Laptop (primary)
  - [ ] Laptop (backup)
  - [ ] Power adapters
  - [ ] USB drives (10)
  - [ ] Printed handouts (50)
  - [ ] Business cards
  - [ ] Mobile hotspot
  - [ ] Presentation clicker
  - [ ] Adapters (HDMI, USB-C)
- [ ] Get good sleep!

## Morning Of

- [ ] Arrive 30 minutes early
- [ ] Test presentation setup
- [ ] Verify internet connection
- [ ] Test demo one more time
- [ ] Set up backup laptop
- [ ] Arrange handouts
- [ ] Test microphone
- [ ] Test screen visibility
- [ ] Clear browser cache
- [ ] Sign in to application
- [ ] Deep breath!

## During Presentation

- [ ] Welcome attendees
- [ ] Introduce yourself
- [ ] Set expectations
- [ ] Encourage questions
- [ ] Show QR codes
- [ ] Mention handouts
- [ ] Run demos
- [ ] Handle Q&A
- [ ] Thank attendees
- [ ] Offer to stay for questions

## After Presentation

- [ ] Collect feedback
- [ ] Answer remaining questions
- [ ] Distribute remaining materials
- [ ] Take photos (if appropriate)
- [ ] Note improvements for next time
- [ ] Send thank you to organizers

## Emergency Contacts

- **Technical Support**: [phone]
- **Event Coordinator**: [phone]
- **Backup Presenter**: [phone]

## Backup Plans

### If Demo Fails
1. Show pre-recorded video
2. Use static screenshots
3. Walk through code
4. Explain expected behavior

### If Internet Fails
1. Use mobile hotspot
2. Show offline materials
3. Focus on architecture discussion
4. Offer to demo later

### If Slides Fail
1. Switch to backup laptop
2. Use printed slides
3. Draw on whiteboard
4. Improvise (you know the content!)

---

**You've got this!** 🎤

Remember:
- Breathe
- Smile
- Engage the audience
- Have fun!
EOF

echo "✅ Presenter checklist created"
echo ""

# Final summary
echo "🎉 Packaging Complete!"
echo ""
echo "📦 Package Location: $PACKAGE_DIR"
echo "📦 ZIP File: $SPEC_DIR/$ZIP_NAME"
echo ""
echo "Next Steps:"
echo "1. Review package contents in: $PACKAGE_DIR"
echo "2. Test slides: open $PACKAGE_DIR/slides/master-deck.html"
echo "3. Review checklists: $PACKAGE_DIR/*-CHECKLIST.md"
echo "4. Distribute ZIP file: $SPEC_DIR/$ZIP_NAME"
echo ""
echo "✨ Ready for AWS re:Invent! ✨"
