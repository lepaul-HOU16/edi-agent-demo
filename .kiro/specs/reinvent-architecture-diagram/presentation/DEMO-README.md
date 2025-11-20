# Interactive Demo Materials - README

## Overview

This directory contains everything you need to deliver a successful live demo at AWS re:Invent. The materials are designed to handle both perfect execution and complete failure scenarios.

## Files in This Directory

### Core Demo Materials

1. **INTERACTIVE-DEMO-SCRIPT.md** (Main Script)
   - Complete 15-minute demo script
   - Step-by-step narration
   - Example queries with expected outputs
   - Timing breakdown
   - Troubleshooting guide integrated

2. **PRESENTER-CHEAT-SHEET.md** (Quick Reference)
   - One-page quick reference
   - Copy-paste queries
   - Key talking points
   - Emergency procedures
   - Pre-demo checklist
   - **PRINT THIS AND KEEP IN POCKET**

3. **backup-slides.html** (Emergency Backup)
   - 5 HTML slides with expected outputs
   - Keyboard navigation (arrow keys, space)
   - Emergency mode toggle (press 'E')
   - Use if live demo fails
   - **KEEP OPEN IN BROWSER TAB**

4. **DEMO-TROUBLESHOOTING-GUIDE.md** (Detailed Troubleshooting)
   - 10 common issues with solutions
   - Diagnosis decision tree
   - Quick fixes for each issue
   - Prevention strategies
   - Emergency procedures

5. **demo-script.md** (Alternative Format)
   - Simplified demo script
   - Focus on key points
   - Less detailed than main script

6. **speaker-notes.md** (Presentation Notes)
   - Notes for each slide
   - Transition guidance
   - Key messages

## Preparation Timeline

### 1 Week Before
- [ ] Read all demo materials
- [ ] Practice demo 3 times
- [ ] Test all queries
- [ ] Verify AWS resources are deployed
- [ ] Create demo user in Cognito
- [ ] Test backup slides in browser

### 1 Day Before
- [ ] Run complete demo end-to-end
- [ ] Time each section
- [ ] Test on venue WiFi (if possible)
- [ ] Print cheat sheet
- [ ] Charge laptop and phone
- [ ] Download backup slides locally

### 30 Minutes Before
- [ ] Open all browser tabs
- [ ] Log into application
- [ ] Open CloudWatch logs
- [ ] Open backup slides
- [ ] Execute one warm-up query
- [ ] Verify screen sharing works
- [ ] Test microphone
- [ ] Get water
- [ ] Take bathroom break

### 5 Minutes Before
- [ ] Close unnecessary applications
- [ ] Disable notifications
- [ ] Set browser zoom to 125%
- [ ] Verify audience can see screen
- [ ] Take deep breath
- [ ] Smile!

## Browser Tab Setup

**Recommended tab order:**

```
Tab 1: Application UI (logged in)
Tab 2: CloudWatch Logs
Tab 3: Backup Slides (backup-slides.html)
Tab 4: GitHub Starter Kit
Tab 5: Cheat Sheet (this directory)
```

## Demo Flow (15 minutes)

```
00:00 - 03:00  Introduction & Architecture
03:00 - 06:00  Simple Query Demo (Petrophysics, General)
06:00 - 10:00  Complex Demo (Terrain, Layout)
10:00 - 12:00  CloudWatch Observability
12:00 - 14:00  Starter Kit Walkthrough
14:00 - 15:00  Q&A Setup
```

## Example Queries (Copy-Paste Ready)

### Query 1: Petrophysics (3-5s)
```
Analyze porosity for well NLOG_F02-1 using density method
```

### Query 2: General Knowledge (2-3s)
```
What's the weather like in Las Vegas today?
```

### Query 3: Terrain Analysis (8-12s)
```
Analyze wind farm potential at coordinates 35.0, -101.4 with 5km radius
```

### Query 4: Layout Optimization (10-15s)
```
Optimize turbine layout for this site
```

## Troubleshooting Quick Reference

| Issue | Quick Fix | Backup |
|-------|-----------|--------|
| App won't load | Mobile hotspot | Backup slides |
| Can't log in | Use backup tab | Show auth diagram |
| Query timeout | Wait or skip | Backup slide |
| No artifacts | Show JSON | Backup slide |
| Wrong agent | Rephrase query | Use tested query |
| Slow WiFi | Mobile hotspot | Screenshots |
| Cold start | Acknowledge & wait | Explain optimization |

## Emergency Procedures

### If Live Demo Completely Fails:

1. **Stay Calm** - Take a breath, smile
2. **Switch to Backup Slides** - Press 'E' for emergency mode
3. **Acknowledge It** - "Let me show you what this looks like when it works"
4. **Walk Through Backups** - With enthusiasm and energy
5. **Turn Into Teaching Moment** - "This is why we test!"
6. **Extend Q&A** - Make it interactive

### If One Query Fails:

1. **Acknowledge** - "Interesting - let's see what happened"
2. **Check CloudWatch** - Turn into teaching moment
3. **Try Next Query** - Don't dwell on failure
4. **Use Backup Slide** - If second query also fails

## Key Talking Points

### Agent Router Pattern
- "Specialized agents instead of one monolithic agent"
- "Pattern matching routes queries to the right expert"
- "Graceful fallback to general knowledge"

### Orchestrator Pattern
- "Coordinates multiple tool Lambdas"
- "Maintains project context across queries"
- "Chains complex workflows automatically"

### Async Processing
- "API Gateway has 29-second timeout"
- "Fire-and-forget with polling for long tasks"
- "User gets immediate feedback, results appear when ready"

### Production Grade
- "This isn't a toy - it's running in production"
- "Complete observability with CloudWatch"
- "Cost-effective: $0.002 per complex query"

### Starter Kit
- "Working template, not just documentation"
- "Deploy to your AWS account in one command"
- "First custom agent in 30 minutes"

## Success Criteria

A successful demo includes:

- [ ] At least 2 queries executed successfully
- [ ] Showed both simple and complex workflows
- [ ] Demonstrated observability (CloudWatch)
- [ ] Shared starter kit information
- [ ] Audience asked questions
- [ ] Maintained energy and enthusiasm
- [ ] Had fun!

## What to Print

**Print these documents:**

1. **PRESENTER-CHEAT-SHEET.md** - Keep in pocket
2. **Pre-Demo Checklist** - From cheat sheet
3. **Emergency Contact Numbers** - From cheat sheet
4. **Demo Queries** - From this README

## What to Keep Open

**Browser tabs:**

1. Application UI (logged in)
2. CloudWatch Logs
3. Backup Slides (backup-slides.html)
4. GitHub Starter Kit
5. This README

**Applications:**

1. Terminal (with AWS CLI ready)
2. Text editor (with queries ready to copy)
3. Timer (to track time)

## Backup Plans

### Backup Plan A: Partial Demo Failure
- Use backup slides for failed queries
- Continue with working queries
- Maintain energy and flow

### Backup Plan B: Complete Demo Failure
- Switch entirely to backup slides
- Walk through with enthusiasm
- Focus on architecture and patterns
- Extend Q&A time

### Backup Plan C: Internet Failure
- Use backup slides (already loaded)
- Enable mobile hotspot
- Focus on concepts and architecture
- Use whiteboard if available

## Post-Demo Actions

### Immediate (During Q&A)
- [ ] Keep CloudWatch logs open
- [ ] Have architecture diagram ready
- [ ] Be ready to show code examples
- [ ] Have QR code/URL visible

### After Session
- [ ] Note any issues encountered
- [ ] Update troubleshooting guide
- [ ] Collect attendee questions
- [ ] Share starter kit link
- [ ] Complete debrief checklist

## Resources

### Documentation
- Main Script: `INTERACTIVE-DEMO-SCRIPT.md`
- Cheat Sheet: `PRESENTER-CHEAT-SHEET.md`
- Troubleshooting: `DEMO-TROUBLESHOOTING-GUIDE.md`
- Backup Slides: `backup-slides.html`

### Code
- Starter Kit: `../starter-kit/`
- Integration Guide: `../integration-guide/`
- Examples: `../starter-kit/examples/`

### Diagrams
- Architecture: `../diagrams/01-high-level-architecture.mmd`
- Service Flows: `../diagrams/SERVICE-FLOW-README.md`
- Orchestration: `../diagrams/ORCHESTRATION-README.md`

## Tips for Success

### Before Demo
1. **Practice** - Run demo 3 times minimum
2. **Test** - Verify all queries work
3. **Prepare** - Have all backups ready
4. **Rest** - Get good sleep night before

### During Demo
1. **Breathe** - Take your time
2. **Smile** - Show enthusiasm
3. **Engage** - Make eye contact
4. **Pause** - Let audience absorb
5. **Acknowledge** - If something fails
6. **Adapt** - Use backup plans confidently

### After Demo
1. **Debrief** - What worked, what didn't
2. **Document** - Update materials
3. **Share** - Give feedback to team
4. **Celebrate** - You did it!

## Mental Preparation

**Before going on stage:**
- "I've prepared thoroughly"
- "I have backup plans for everything"
- "The audience wants me to succeed"
- "Live demos show authenticity"
- "Failures are teaching moments"
- "I've got this!"

**If something goes wrong:**
- "This is expected in live demos"
- "I have backup slides ready"
- "I can turn this into a teaching moment"
- "The audience is on my side"
- "Stay calm and confident"

## Contact Information

**For questions about demo materials:**
- Check troubleshooting guide first
- Review cheat sheet
- Consult main script

**Emergency contacts:**
- AWS Support: [number]
- Venue IT: [number]
- Backup Presenter: [name/number]

## Final Checklist

**Print and complete:**

```
30 Minutes Before:
□ All browser tabs open
□ Logged into application
□ CloudWatch logs streaming
□ Backup slides tested
□ Water nearby
□ Bathroom break taken

5 Minutes Before:
□ Screen sharing tested
□ Microphone tested
□ One warm-up query executed
□ Audience can see screen
□ Deep breath taken

During Demo:
□ Smile
□ Make eye contact
□ Speak clearly
□ Pause for effect
□ Have fun!
```

---

## Remember

You've built something amazing. You've prepared thoroughly. You have backup plans for everything. The audience is rooting for you.

**Now go show them what you've built!**

**Good luck! 🚀**

---

## Quick Links

- [Main Demo Script](./INTERACTIVE-DEMO-SCRIPT.md)
- [Cheat Sheet](./PRESENTER-CHEAT-SHEET.md)
- [Troubleshooting Guide](./DEMO-TROUBLESHOOTING-GUIDE.md)
- [Backup Slides](./backup-slides.html)
- [Starter Kit](../starter-kit/)
- [Integration Guide](../integration-guide/)

---

**Last Updated:** 2025-01-15
**Version:** 1.0
**Status:** Ready for Presentation
