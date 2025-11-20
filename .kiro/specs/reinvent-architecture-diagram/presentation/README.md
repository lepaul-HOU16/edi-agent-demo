# AWS re:Invent Chalk Talk Presentation Package

## Overview

This package contains all materials for the AWS re:Invent chalk talk on "Building Multi-Agent AI Systems with AWS Bedrock and AgentCore". The presentation demonstrates a production implementation of conversational AI agents for energy data analysis.

## Package Contents

### 1. Master Slide Deck
- **Location**: `slides/master-deck.html`
- **Format**: HTML presentation (Reveal.js)
- **Sections**: 
  - Introduction & Architecture Overview
  - AgentCore Integration Pattern
  - Multi-Agent Orchestration
  - IAM Security Model
  - Starter Kit & Demo

### 2. Diagrams
- **Location**: `diagrams/`
- **Formats**: Mermaid (.mmd), PNG, SVG
- **Contents**:
  - High-level architecture
  - Authentication flow
  - Agent routing patterns
  - Async processing
  - Orchestration patterns
  - Service call flows

### 3. IAM Reference Cards
- **Location**: `iam-reference-cards/`
- **Format**: HTML and PDF
- **Contents**: One-page reference for each Lambda role with required permissions

### 4. Integration Guide
- **Location**: `integration-guide/`
- **Contents**:
  - Step-by-step visual guide
  - Code templates
  - Integration checklist
  - Decision tree
  - Examples

### 5. Starter Kit
- **Location**: `starter-kit/`
- **Contents**:
  - Complete CDK templates
  - Example agent implementations
  - Deployment scripts
  - Quick start guide

### 6. Performance & Operations
- **Location**: `performance/` and `operations/`
- **Contents**:
  - Lambda configurations
  - Cost calculator
  - Capacity planning
  - Monitoring dashboards
  - Troubleshooting guides

### 7. Artifact Examples
- **Location**: `artifacts/`
- **Contents**:
  - Sample artifacts (JSON)
  - Component examples (React)
  - Schema definitions
  - S3 storage patterns

### 8. Speaker Notes
- **Location**: `speaker-notes/`
- **Contents**: Detailed notes for each section with timing and key points

### 9. Handout PDF
- **Location**: `handout.pdf`
- **Contents**: Key diagrams, code snippets, and QR codes for quick reference

### 10. Demo Script
- **Location**: `demo-script.md`
- **Contents**: Step-by-step demo instructions with expected outputs

## Quick Start

### For Presenters

1. **Review Materials**:
   ```bash
   # Open master slide deck
   open slides/master-deck.html
   
   # Review speaker notes
   open speaker-notes/presentation-notes.md
   
   # Practice demo
   open demo-script.md
   ```

2. **Setup Demo Environment**:
   ```bash
   # Ensure AWS credentials are configured
   aws sts get-caller-identity
   
   # Test demo queries
   ./scripts/test-demo.sh
   ```

3. **Print Materials**:
   ```bash
   # Generate PDFs for handouts
   ./scripts/generate-handouts.sh
   ```

### For Attendees

1. **Access Starter Kit**:
   - Scan QR code on slides
   - Visit: https://github.com/[your-repo]/aws-agentcore-starter-kit

2. **Follow Quick Start**:
   - See `starter-kit/QUICK-START.md`
   - Deploy in 15 minutes

3. **Reference Materials**:
   - IAM reference cards
   - Integration checklist
   - Code templates

## Presentation Structure

### Section 1: Introduction (5 minutes)
- Problem statement
- Solution overview
- Architecture at a glance

### Section 2: AgentCore Integration (10 minutes)
- Agent routing pattern
- Intent detection
- Thought steps
- Live demo: Simple query

### Section 3: Multi-Agent Orchestration (10 minutes)
- Orchestrator pattern
- Tool invocation
- Async processing
- Live demo: Complex workflow

### Section 4: Security & IAM (5 minutes)
- Authentication flow
- Lambda authorizer
- Least privilege permissions
- Reference cards walkthrough

### Section 5: Starter Kit (5 minutes)
- Repository structure
- Quick deployment
- Adding new agents
- QR code for access

### Section 6: Q&A (10 minutes)
- Open discussion
- Deep dives on request

## Demo Scenarios

### Demo 1: Simple Petrophysics Query
**Query**: "Calculate porosity for Well-001"
**Expected**: 
- Intent detection → petrophysics
- Tool invocation → calculator
- Response with visualization
**Duration**: 2 minutes

### Demo 2: Complex Renewable Energy Analysis
**Query**: "Analyze wind farm site at 35.0, -101.4"
**Expected**:
- Intent detection → renewable
- Orchestrator invocation
- Multiple tool calls (terrain, layout, simulation)
- Async processing demonstration
- Artifacts rendered
**Duration**: 3 minutes

### Demo 3: Multi-Well Correlation
**Query**: "Correlate porosity across Well-001, Well-002, Well-003"
**Expected**:
- Multi-well analysis
- Crossplot visualization
- Professional report format
**Duration**: 2 minutes

## Backup Plans

### If Live Demo Fails

1. **Pre-recorded Video**: `demo-videos/`
2. **Static Screenshots**: `demo-screenshots/`
3. **Backup Slides**: Slides 50-60 contain static demo results

### If Questions Go Deep

1. **Architecture Deep Dive**: Slides 61-70
2. **Code Walkthrough**: `code-examples/`
3. **Troubleshooting Guide**: `operations/troubleshooting-tree.md`

## Technical Requirements

### Presenter Setup
- Laptop with AWS CLI configured
- Browser (Chrome/Firefox recommended)
- Internet connection for live demo
- Backup: Mobile hotspot

### Venue Requirements
- Projector/screen (1920x1080 minimum)
- Microphone (for large rooms)
- Whiteboard/flip chart for chalk talk
- Power outlet

## Distribution

### Digital Package
- **Format**: ZIP file
- **Size**: ~50MB
- **Contents**: All materials except videos
- **Distribution**: USB drives, email, download link

### Physical Handouts
- **Format**: PDF, 20 pages
- **Print**: Color, double-sided
- **Quantity**: 50 copies
- **Contents**: Key diagrams, QR codes, cheat sheets

## Post-Presentation

### Follow-up Materials
- GitHub repository link
- Slack/Discord community
- Office hours schedule
- Additional resources

### Feedback Collection
- Survey QR code on last slide
- Email for questions
- GitHub issues for bugs/features

## Support

### During Event
- **Presenter**: [Your Name]
- **Technical Support**: [Support Contact]
- **Backup Presenter**: [Backup Name]

### After Event
- **GitHub**: https://github.com/[your-repo]
- **Email**: [support-email]
- **Documentation**: [docs-url]

## Version History

- **v1.0** (2025-01-14): Initial package
- All materials validated and tested
- Demo scripts verified
- Handouts printed

## License

All materials are provided under [License Type] for educational and demonstration purposes.

## Acknowledgments

- AWS Bedrock team
- AgentCore contributors
- Energy data domain experts
- Beta testers and reviewers

---

**Ready to present!** 🎤

For questions or issues, contact [presenter-email]
