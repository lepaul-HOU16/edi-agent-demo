# AgentCore Integration Presentation Slides

## Overview

This presentation deck explains the AgentCore integration pattern used in the AWS Energy Data Insights platform. It's designed for a technical audience at AWS re:Invent chalk talks.

## Contents

- **agentcore-integration.html** - Full presentation with 35 slides covering:
  - Agent Router Pattern
  - Intent Detection Algorithm
  - Multi-Agent Orchestration
  - Pattern Matching Examples
  - Starter Kit Approach
  - Real-world Examples
  - Performance Metrics
  - Best Practices

## How to Use

### Option 1: Open Locally

1. Open `agentcore-integration.html` in a web browser
2. Use arrow keys or space bar to navigate
3. Press 'F' for fullscreen
4. Press 'S' for speaker notes
5. Press 'O' for overview mode

### Option 2: Host on Web Server

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx http-server

# Then open: http://localhost:8000/agentcore-integration.html
```

### Option 3: Deploy to S3

```bash
# Upload to S3 bucket
aws s3 cp agentcore-integration.html s3://your-bucket/presentations/

# Make public (if needed)
aws s3api put-object-acl --bucket your-bucket --key presentations/agentcore-integration.html --acl public-read

# Access via CloudFront or S3 URL
```

## Navigation

- **Next Slide:** Arrow Right, Space, Page Down
- **Previous Slide:** Arrow Left, Page Up
- **First Slide:** Home
- **Last Slide:** End
- **Slide Overview:** O or ESC
- **Fullscreen:** F
- **Speaker Notes:** S
- **Zoom:** Alt+Click (or Ctrl+Click on Linux)

## Customization

### Change Theme

Edit the CSS link in the HTML:

```html
<!-- Current: Black theme -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/black.min.css">

<!-- Options: white, league, beige, sky, night, serif, simple, solarized -->
```

### Adjust Slide Size

Modify the Reveal.js initialization:

```javascript
Reveal.initialize({
    width: 1920,  // Change width
    height: 1080, // Change height
    // ...
});
```

### Add Speaker Notes

Add notes below any slide:

```html
<section>
    <h2>Slide Title</h2>
    <p>Slide content</p>
    
    <aside class="notes">
        These are speaker notes. Press 'S' to see them.
    </aside>
</section>
```

## Key Slides

### Slide 1-3: Introduction
- Title and agenda
- Problem statement

### Slide 4-11: Agent Router Pattern
- Architecture diagram
- Implementation code
- Intent detection algorithm
- Pattern matching examples

### Slide 12-16: Agent Implementation
- Base agent class
- Specialized agents
- Orchestrator pattern
- Thought steps

### Slide 17-21: Starter Kit
- Step-by-step guide to adding new agents
- Code examples
- Integration checklist

### Slide 22-23: Real-World Examples
- Petrophysics workflow
- Renewable energy workflow

### Slide 24-27: Best Practices
- Design patterns
- Benefits
- Lessons learned
- Best practices

### Slide 28-32: Operations
- Performance metrics
- Cost analysis
- Scaling considerations
- Monitoring
- Security

### Slide 33-35: Wrap-up
- Future enhancements
- Resources
- Q&A

## Code Syntax Highlighting

The presentation uses highlight.js for code syntax highlighting. Supported languages:

- TypeScript/JavaScript
- Python
- JSON
- Bash
- Plain text

## Diagrams

Mermaid diagrams are embedded for:
- Intent detection flow
- Architecture diagrams
- Sequence diagrams

## Printing/PDF Export

To export as PDF:

1. Open in Chrome/Chromium
2. Add `?print-pdf` to URL: `agentcore-integration.html?print-pdf`
3. Open Print dialog (Ctrl+P / Cmd+P)
4. Set destination to "Save as PDF"
5. Set margins to "None"
6. Enable "Background graphics"
7. Save

## Accessibility

- All slides have semantic HTML
- Code blocks have proper language attributes
- Images have alt text
- Keyboard navigation supported
- Screen reader compatible

## Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (for CDN resources)
- Recommended resolution: 1920x1080 or higher

## Offline Use

To use offline, download these dependencies:

```bash
# Create libs directory
mkdir libs

# Download Reveal.js
wget https://github.com/hakimel/reveal.js/archive/refs/tags/4.5.0.zip
unzip 4.5.0.zip -d libs/

# Download Highlight.js
wget https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js -P libs/

# Update HTML to use local files
```

## License

This presentation is part of the AWS Energy Data Insights platform documentation.

## Support

For questions or issues:
- Open an issue in the project repository
- Contact the platform team
- Refer to the main project documentation

## Version History

- v1.0 (2025-01-15): Initial release with 35 slides
  - Agent Router Pattern
  - Intent Detection
  - Multi-Agent Orchestration
  - Starter Kit Guide
  - Real-world Examples
  - Best Practices
