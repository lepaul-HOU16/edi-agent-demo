# EDIcraft Demo Script

## Overview

This script provides a step-by-step guide for demonstrating the EDIcraft Minecraft visualization system with the new demo enhancement features. Follow this script to deliver a polished, professional demonstration.

**Duration:** 15-20 minutes  
**Audience:** Technical stakeholders, geoscientists, management  
**Prerequisites:** EDIcraft agent deployed, Minecraft server running, collection prepared

---

## Pre-Demo Checklist

### 30 Minutes Before Demo

- [ ] Verify Minecraft server is running
- [ ] Test RCON connection
- [ ] Verify OSDU platform access
- [ ] Prepare collection with 24 wells
- [ ] Test collection data accessibility
- [ ] Open web application and log in
- [ ] Verify EDIcraft agent is available

### 15 Minutes Before Demo

- [ ] Reset demo environment
- [ ] Verify environment is clean
- [ ] Test clear button functionality
- [ ] Confirm time is locked to day
- [ ] Position Minecraft client at spawn
- [ ] Test screen sharing setup

### 5 Minutes Before Demo

- [ ] Open chat interface
- [ ] Select EDIcraft agent
- [ ] Verify collection context loaded
- [ ] Final environment check
- [ ] Start screen recording (optional)

---

## Demo Script

### Part 1: Introduction (2 minutes)

**Script:**

> "Today I'm going to demonstrate EDIcraft, our AI-powered system for visualizing subsurface data in Minecraft. EDIcraft bridges the gap between complex geological data and intuitive 3D visualization, making it easier to understand wellbore trajectories, horizon surfaces, and field development."

**Actions:**
1. Show web application interface
2. Point out EDIcraft agent in agent switcher
3. Show Minecraft client (clean environment)

**Key Points:**
- AI-powered visualization
- Real OSDU data
- Interactive 3D environment
- Professional demo tools

---

### Part 2: Environment Management (3 minutes)

**Script:**

> "Before we start building visualizations, let me show you our demo environment management tools. These make it easy to prepare for demonstrations and maintain a clean workspace."

#### Demo Reset

**Query:**
```
Reset the demo environment
```

**Expected Response:**
```
✅ Demo Environment Reset Complete

Actions Performed:
- ✅ All wellbores cleared
- ✅ All drilling rigs removed
- ✅ All markers cleared
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

Status: Ready for Demo
```

**Script:**

> "With a single command, we've reset the entire environment. All previous visualizations are cleared, the world time is locked to daytime for consistent visibility, and players are positioned at spawn. This ensures every demonstration starts from a clean, predictable state."

**Actions:**
1. Type the reset command
2. Show the response in chat
3. Switch to Minecraft to show clean environment
4. Point out daytime lighting

**Key Points:**
- One-command reset
- Complete environment cleanup
- Time locked for visibility
- Ready for demo

#### Clear Button

**Script:**

> "For quick cleanup during demos, we have a clear button right in the chat interface."

**Actions:**
1. Point out the "Clear Minecraft Environment" button
2. Explain when to use it
3. Don't click it yet (save for later demo)

**Key Points:**
- Quick access
- No typing required
- Perfect for iterative testing
- Shows loading state

---

### Part 3: Single Wellbore Visualization (4 minutes)

**Script:**

> "Let's start by visualizing a single wellbore. I'll ask EDIcraft to build WELL-007 from our OSDU platform."

#### Build Wellbore

**Query:**
```
Build wellbore trajectory for WELL-007
```

**Expected Response:**
```
✅ Wellbore Trajectory Built Successfully

Details:
- Wellbore ID: WELL-007
- Data Points: 107
- Blocks Placed: 150
- Depth: 3000m TVD (150 blocks)

Minecraft Location:
- Coordinates: (30, 100, 20)
- Drilling Rig: Standard style
- Signage: WELL-007

💡 Tip: The wellbore is now visible in Minecraft with a complete drilling rig!
```

**Script:**

> "EDIcraft has fetched the trajectory data from OSDU, transformed the coordinates to Minecraft space, and built the complete visualization. Notice the response includes the wellbore ID, number of data points, and Minecraft coordinates."

**Actions:**
1. Type the query
2. Show response in chat
3. Switch to Minecraft
4. Navigate to coordinates (30, 100, 20)
5. Show the wellbore trajectory
6. Point out the drilling rig

**Key Points:**
- Real OSDU data
- Automatic coordinate transformation
- Complete with drilling rig
- Professional response format

#### Explore Drilling Rig

**Script:**

> "Every wellbore now includes a professional drilling rig at the wellhead. Let's take a closer look."

**Actions:**
1. Fly around the drilling rig
2. Point out components:
   - Iron bar derrick (15 blocks high)
   - Stone slab platform (5×5)
   - Equipment (furnaces, hoppers, chests)
   - Oak sign with well name "WELL-007"
   - Glowstone lighting

**Script:**

> "The rig includes a 15-block high derrick, a platform with equipment, and signage showing the simplified well name. The glowstone lighting ensures visibility at all times."

**Key Points:**
- Realistic rig structure
- Simplified well names
- Professional appearance
- Always visible

#### Explore Wellbore Trajectory

**Script:**

> "Now let's follow the wellbore trajectory underground."

**Actions:**
1. Fly down along the wellbore path
2. Point out:
   - Color-coded blocks
   - Depth markers every 500m
   - Trajectory path
   - Total depth

**Script:**

> "The wellbore uses color-coded blocks to show the trajectory path. Depth markers appear every 500 meters, helping you understand the well's depth. This wellbore extends 3000 meters underground, represented by 150 blocks."

**Key Points:**
- Color-coded visualization
- Depth markers
- Accurate trajectory
- Scale representation

---

### Part 4: Clear Button Demo (2 minutes)

**Script:**

> "Now let's say we want to test a different visualization. Instead of typing a command, I'll use the clear button."

**Actions:**
1. Return to web interface
2. Click "Clear Minecraft Environment" button
3. Show loading state
4. Show response in chat

**Expected Response:**
```
✅ Minecraft Environment Cleared

Summary:
- Wellbores Cleared: 1
- Drilling Rigs Removed: 1
- Total Blocks Cleared: 150
- Terrain: Preserved

💡 Tip: The environment is now clear and ready for new visualizations!
```

**Script:**

> "With one click, the environment is cleared. The response shows exactly what was removed: one wellbore, one drilling rig, 150 blocks total. The natural terrain is preserved."

**Actions:**
1. Switch to Minecraft
2. Show clean environment
3. Verify terrain is intact

**Key Points:**
- One-click clearing
- Detailed summary
- Terrain preserved
- Instant feedback

---

### Part 5: Collection Visualization (5 minutes)

**Script:**

> "Now for the impressive part: visualizing an entire collection of 24 wellbores with a single command."

#### Visualize Collection

**Query:**
```
Visualize all wells from collection-123
```

**Expected Progress Updates:**
```
⏳ Building Well 1 of 24

Current Well: WELL-001
Status: Processing trajectory data...
Progress: 4% complete
```

```
⏳ Building Well 5 of 24

Current Well: WELL-005
Status: Building wellbore in Minecraft...
Progress: 21% complete
```

```
⏳ Building Well 10 of 24

Current Well: WELL-010
Status: Building drilling rig...
Progress: 42% complete
```

**Script:**

> "EDIcraft is now processing all 24 wellbores in batches. Notice the real-time progress updates showing which well is being built and the overall progress percentage."

**Actions:**
1. Type the query
2. Show progress updates in chat
3. Explain batch processing (5 wells at a time)
4. Point out current well name and status

**Expected Final Response:**
```
✅ Collection Visualization Complete

Collection: collection-123

Summary:
- Total Wells: 24
- Successfully Built: 24
- Failed: 0
- Success Rate: 100%

💡 Tip: All wellbores are now visible in Minecraft! You can explore the collection in 3D.
```

**Script:**

> "All 24 wellbores have been successfully built. The summary shows 100% success rate with no failures."

**Actions:**
1. Show final response
2. Switch to Minecraft
3. Fly up for overview

#### Explore Grid Layout

**Script:**

> "The wellbores are arranged in an organized grid pattern, making it easy to navigate and compare."

**Actions:**
1. Show grid layout from above
2. Point out:
   - 5×5 grid arrangement
   - 50-block spacing between wells
   - Centered around origin
   - All drilling rigs visible

**Script:**

> "Each wellbore has its own drilling rig with a sign showing the simplified well name. The 50-block spacing prevents visual clutter while keeping everything accessible."

**Key Points:**
- Organized grid layout
- Automatic spacing
- All wells visible
- Professional presentation

#### Navigate Collection

**Script:**

> "Let's explore a few different wellbores to see the variety in trajectories."

**Actions:**
1. Fly to WELL-001
   - Show rig and sign
   - Follow trajectory underground
   - Point out depth markers

2. Fly to WELL-012
   - Show different trajectory
   - Compare with WELL-001
   - Point out color coding

3. Fly to WELL-024
   - Show edge of grid
   - Demonstrate spacing
   - Show overall field layout

**Script:**

> "Each wellbore has its own unique trajectory based on real OSDU data. The color coding and depth markers make it easy to understand each well's path through the subsurface."

**Key Points:**
- Unique trajectories
- Real data
- Easy comparison
- Field-scale visualization

---

### Part 6: Time Lock Demo (2 minutes)

**Script:**

> "To ensure consistent visibility during demonstrations, we can lock the world time."

#### Lock Time

**Query:**
```
Lock time to noon
```

**Expected Response:**
```
✅ World Time Locked

Settings:
- Current Time: Noon
- Daylight Cycle: Disabled
- Status: Time is locked

💡 Tip: Visualizations will always be visible in daylight!
```

**Script:**

> "The world time is now locked to noon, the brightest time of day. The daylight cycle is disabled, so it will stay noon indefinitely."

**Actions:**
1. Type the query
2. Show response
3. Switch to Minecraft
4. Point out bright lighting
5. Wait a few seconds to show time doesn't change

**Key Points:**
- Consistent lighting
- No surprises during demos
- Brightest visibility
- Professional presentation

---

### Part 7: Collection Context Retention (2 minutes)

**Script:**

> "When working with collections, we can create multiple canvases while maintaining the same collection scope."

#### Create New Canvas

**Actions:**
1. Show collection context badge in current canvas
2. Click "Create New Chat" button
3. Show new canvas opens
4. Point out collection context badge appears immediately
5. Explain inherited context

**Script:**

> "Notice the collection context badge appears immediately in the new canvas. We didn't have to reload the collection or specify it again. The new canvas automatically inherits the collection scope from the previous canvas."

**Key Points:**
- Automatic context inheritance
- No reloading required
- Multiple canvases per collection
- Better organization

#### Demonstrate Shared Context

**Actions:**
1. In new canvas, type:
   ```
   Show me wells from this collection
   ```
2. Show response includes collection-123 wells
3. Switch back to original canvas
4. Show both canvases have same collection scope

**Script:**

> "Both canvases have access to the same collection data. This makes it easy to organize your work by topic while maintaining consistent data access."

**Key Points:**
- Shared collection scope
- Independent chat histories
- Easy organization
- Seamless workflow

---

### Part 8: Demo Reset (1 minute)

**Script:**

> "At the end of a demonstration, we can reset everything with a single command."

#### Reset Demo

**Query:**
```
Reset the demo environment
```

**Expected Response:**
```
✅ Demo Environment Reset Complete

Actions Performed:
- ✅ All wellbores cleared
- ✅ All drilling rigs removed
- ✅ All markers cleared
- ✅ World time locked to daytime
- ✅ Players teleported to spawn

Status: Ready for Demo

💡 Tip: The Minecraft world is now clean and ready for your next demonstration!
```

**Script:**

> "With one command, we've cleared all 24 wellbores, removed all drilling rigs, reset the time, and teleported players to spawn. The environment is now ready for the next demonstration."

**Actions:**
1. Type the query
2. Show response
3. Switch to Minecraft
4. Show clean environment
5. Verify spawn position

**Key Points:**
- Complete reset
- One command
- Ready for next demo
- Professional workflow

---

## Conclusion (1 minute)

**Script:**

> "EDIcraft demonstrates how AI can make complex subsurface data more accessible and intuitive. By combining real OSDU data with Minecraft's 3D environment, we create visualizations that are both accurate and easy to understand."

**Key Takeaways:**
1. **AI-Powered:** Natural language commands for complex visualizations
2. **Real Data:** Direct integration with OSDU platform
3. **Professional Tools:** Demo management features for polished presentations
4. **Scalable:** From single wellbores to entire collections
5. **Interactive:** Explore visualizations in 3D

**Script:**

> "Thank you for your time. I'm happy to answer any questions or demonstrate specific features in more detail."

---

## Q&A Preparation

### Common Questions

**Q: How accurate are the visualizations?**

A: The visualizations use real trajectory data from OSDU with accurate coordinate transformations. The scale is 1 block = 20 meters, providing a good balance between accuracy and visibility.

**Q: Can we visualize other types of data?**

A: Yes, EDIcraft also supports horizon surfaces, geological formations, and other subsurface features. The system is extensible for new data types.

**Q: How long does it take to visualize a collection?**

A: A collection of 24 wellbores takes approximately 2-3 minutes to visualize, depending on data complexity and server performance.

**Q: Can multiple users work simultaneously?**

A: Yes, multiple users can connect to the Minecraft server and view visualizations simultaneously. However, demo reset affects all users, so coordinate with your team.

**Q: What happens if a wellbore fails to build?**

A: The system continues processing other wellbores and provides a detailed summary of failures with reasons. You can retry failed wellbores individually.

**Q: Can we customize the drilling rig appearance?**

A: Yes, the system supports different rig styles (standard, compact, detailed) and can be customized further based on requirements.

**Q: How do we handle large collections (100+ wells)?**

A: For large collections, consider visualizing subsets or using larger spacing. The system can handle large collections but may require longer processing time.

**Q: Can we export visualizations?**

A: Minecraft worlds can be exported and shared. Screenshots and videos can be captured for presentations and documentation.

---

## Troubleshooting During Demo

### Issue: Wellbore Doesn't Appear

**Quick Fix:**
1. Check coordinates in response
2. Teleport to coordinates: `/tp @s X Y Z`
3. Reload chunks: `F3 + A`

### Issue: Clear Button Not Working

**Quick Fix:**
1. Use text command instead: "Clear the environment"
2. Check chat for error message
3. Verify RCON connection

### Issue: Collection Visualization Fails

**Quick Fix:**
1. Check collection ID is correct
2. Verify S3 access
3. Try visualizing single well first
4. Check progress updates for specific errors

### Issue: Time Lock Doesn't Work

**Quick Fix:**
1. Manually set time: `/time set 6000`
2. Manually lock cycle: `/gamerule doDaylightCycle false`
3. Continue with demo

---

## Post-Demo Actions

### Immediate (Within 5 minutes)

- [ ] Thank attendees
- [ ] Collect feedback
- [ ] Note any issues encountered
- [ ] Save Minecraft world (if requested)
- [ ] Stop screen recording

### Follow-Up (Within 24 hours)

- [ ] Send demo recording to attendees
- [ ] Share documentation links
- [ ] Address questions from Q&A
- [ ] Document lessons learned
- [ ] Update demo script based on feedback

### Maintenance (Weekly)

- [ ] Review demo environment
- [ ] Update collection data
- [ ] Test all features
- [ ] Verify OSDU connectivity
- [ ] Check Minecraft server performance

---

## Demo Variations

### Quick Demo (5 minutes)

Focus on:
1. Single wellbore visualization
2. Clear button
3. Collection visualization (show progress only)
4. Demo reset

### Technical Deep Dive (30 minutes)

Include:
1. All standard demo sections
2. Coordinate transformation explanation
3. OSDU data structure discussion
4. Error handling demonstration
5. Performance optimization discussion
6. Architecture overview

### Executive Summary (10 minutes)

Focus on:
1. Business value
2. Collection visualization (full demo)
3. Professional demo tools
4. ROI and efficiency gains
5. Future roadmap

---

## Success Metrics

### Demo Quality Indicators

✅ **Excellent Demo:**
- All features work first try
- No technical issues
- Smooth transitions
- Engaging presentation
- Clear value proposition

⚠️ **Good Demo:**
- Minor technical issues resolved quickly
- Most features work as expected
- Some improvisation required
- Value proposition clear

❌ **Needs Improvement:**
- Multiple technical failures
- Significant troubleshooting required
- Lost audience engagement
- Unclear value proposition

### Audience Engagement

Monitor for:
- Questions during demo
- Note-taking
- Screen attention
- Follow-up requests
- Positive feedback

---

## Additional Resources

### Documentation
- [EDIcraft Quick Start](EDICRAFT_QUICK_START.md)
- [User Workflows](EDICRAFT_USER_WORKFLOWS.md)
- [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md)
- [Clear Environment Tool Guide](CLEAR_ENVIRONMENT_TOOL_GUIDE.md)
- [Time Lock Tool Guide](TIME_LOCK_TOOL_GUIDE.md)
- [Collection Visualization Guide](COLLECTION_VISUALIZATION_TOOL_GUIDE.md)
- [Demo Reset Tool Guide](DEMO_RESET_TOOL_GUIDE.md)

### Training Materials
- Demo video recordings
- Practice environment
- Test collections
- Troubleshooting scenarios

---

## Appendix: Example Queries

### Environment Management
```
"Reset the demo environment"
"Clear the Minecraft environment"
"Lock time to noon"
"Unlock the time"
```

### Wellbore Visualization
```
"Build wellbore trajectory for WELL-007"
"Show me wellbore WELL-012 in Minecraft"
"Visualize well trajectory for WELL-001"
```

### Collection Visualization
```
"Visualize all wells from collection-123"
"Show me all wellbores in the collection"
"Build all wells with 75-block spacing"
```

### Information Queries
```
"What is my position in Minecraft?"
"Show me the configuration"
"List all visualizations"
```

---

**Demo Script Version:** 1.0  
**Last Updated:** 2025-01-15  
**Next Review:** 2025-02-15
