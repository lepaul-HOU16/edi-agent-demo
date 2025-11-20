# Quick Start Guide - Architecture Diagrams

## 🚀 Get Started in 2 Minutes

### Step 1: View Diagrams (30 seconds)

Open this file in your browser:
```
.kiro/specs/reinvent-architecture-diagram/output/html/index.html
```

**Or from command line:**
```bash
open .kiro/specs/reinvent-architecture-diagram/output/html/index.html
```

### Step 2: Choose Your Diagram (30 seconds)

Click on any diagram from the gallery:
- **High-Level Architecture** - Complete system overview
- **Authentication Flow** - Security and JWT validation
- **Agent Routing Flow** - How queries are routed
- **Async Processing** - Handling long-running tasks
- **Multi-Agent Orchestration** - Agent hierarchy
- **Data Flow** - End-to-end request flow
- **Chalk Talk Simple** - Simplified for presentations

### Step 3: Export (1 minute)

**For SVG (Vector Format):**
- Click "Export as SVG" button
- Save the file

**For PNG (Presentations):**
- Right-click on diagram
- Select "Save image as..."
- Or use browser screenshot tool

**For High-Resolution PNG:**
- Visit https://mermaid.live/
- Copy diagram code from HTML page
- Paste into editor
- Click "Actions" → "Export PNG"
- Set resolution to 1920x1080 or higher

---

## 📊 Which Diagram Should I Use?

### For Opening Slide
→ Use **Chalk Talk Simple** (07)
- Easy to understand
- Perfect for quick overview
- Hand-drawn aesthetic

### For System Architecture
→ Use **High-Level Architecture** (01)
- Shows all AWS services
- Complete integration view
- Professional appearance

### For Security Discussion
→ Use **Authentication Flow** (02)
- JWT validation process
- Cognito integration
- Step-by-step sequence

### For AgentCore Demo
→ Use **Agent Routing Flow** (03)
- Intent detection
- Agent specialization
- Async processing

### For Performance Questions
→ Use **Async Processing Pattern** (04)
- Timeout handling
- Fire-and-forget pattern
- Polling mechanism

---

## 🎨 Adding AWS Icons (Optional)

### Quick Method (PowerPoint)

1. **Generate base diagram**
   - Export diagram as PNG from browser
   
2. **Download AWS icons**
   - Visit: https://aws.amazon.com/architecture/icons/
   - Download and extract
   
3. **Add icons in PowerPoint**
   - Import PNG as background
   - Add AWS icons on top
   - Position over service boxes
   - Export as PNG (1920x1080)

### Detailed Instructions
See `AWS-ICONS-GUIDE.md` for complete guide with multiple methods.

---

## 🎤 Presentation Tips

### 30-Minute Chalk Talk Flow

**Opening (5 min)**
- Show: Chalk Talk Simple
- Explain: Platform overview

**Architecture (15 min)**
- Show: High-Level Architecture
- Show: Authentication Flow
- Show: Agent Routing Flow
- Show: Async Processing

**Starter Kit (8 min)**
- Show: Multi-Agent Orchestration
- Show: Data Flow Architecture

**Q&A (2 min)**
- Have all diagrams ready

### Key Talking Points
- "Built on serverless AWS services"
- "Scales automatically with demand"
- "Pattern-based intent detection"
- "Handles 5-minute analyses without timeout"
- "Add new agent in ~30 minutes"

---

## 📁 File Locations

### View Diagrams
```
output/html/index.html
```

### Source Files (Mermaid)
```
diagrams/*.mmd
```

### Documentation
```
README.md                          - Complete guide
AWS-ICONS-GUIDE.md                 - Icon integration
PRESENTATION-QUICK-REFERENCE.md    - Presentation guide
```

### Generation Scripts
```
scripts/generate-diagrams.sh       - PNG/SVG/PDF generator
scripts/generate-html-previews.js  - HTML preview generator
```

---

## ❓ Common Questions

### Q: How do I get high-resolution PNG?
**A**: Use Mermaid Live Editor (https://mermaid.live/) and export at 1920x1080 or higher.

### Q: Can I edit the diagrams?
**A**: Yes! Edit the `.mmd` files in `diagrams/` directory, then regenerate HTML previews.

### Q: Do I need to install anything?
**A**: No! HTML previews work in any browser. Optional: install mermaid-cli for automated generation.

### Q: How do I add AWS icons?
**A**: Follow `AWS-ICONS-GUIDE.md` - easiest method is PowerPoint or Draw.io.

### Q: Which format should I use for presentations?
**A**: PNG at 1920x1080 or higher. SVG works too but PNG is more compatible.

---

## 🆘 Troubleshooting

### Diagrams don't render in browser
- **Solution**: Use a modern browser (Chrome, Firefox, Safari, Edge)
- **Alternative**: Visit https://mermaid.live/ and paste diagram code

### Export button doesn't work
- **Solution**: Right-click on diagram and "Save image as..."
- **Alternative**: Use browser screenshot tool

### Need higher resolution
- **Solution**: Use Mermaid Live Editor and set custom resolution
- **Alternative**: Install mermaid-cli and run generation script

---

## ✅ Checklist

- [ ] Opened `output/html/index.html` in browser
- [ ] Viewed all 7 diagrams
- [ ] Exported diagrams as SVG or PNG
- [ ] Downloaded AWS Architecture Icons (optional)
- [ ] Added icons to diagrams (optional)
- [ ] Reviewed presentation quick reference
- [ ] Practiced presentation flow
- [ ] Created handout materials

---

## 🎯 Next Steps

1. **Review diagrams** - Open HTML previews
2. **Export for presentation** - Save as PNG/SVG
3. **Add AWS icons** (optional) - Follow guide
4. **Prepare presentation** - Use quick reference
5. **Practice** - Rehearse with diagrams

---

## 📞 Need More Help?

- **Complete Guide**: See `README.md`
- **Icon Integration**: See `AWS-ICONS-GUIDE.md`
- **Presentation Tips**: See `PRESENTATION-QUICK-REFERENCE.md`
- **Implementation Details**: See `TASK-1-SUMMARY.md`

---

**Ready to present? Open `output/html/index.html` and get started! 🚀**
