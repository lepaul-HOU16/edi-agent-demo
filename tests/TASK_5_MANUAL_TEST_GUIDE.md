# Task 5: Horizon Surface Visualization - Manual Test Guide

## Quick Start

This guide provides step-by-step instructions for manually testing the horizon surface visualization workflow.

## Prerequisites

- [ ] Web application is running
- [ ] EDIcraft agent is deployed
- [ ] Minecraft Java Edition installed
- [ ] Access to edicraft.nigelgardiner.com:49000

## Test Procedure

### Part 1: Test Agent Response (5 minutes)

#### Step 1: Open Web Application
1. Navigate to your web application
2. Go to the chat interface
3. Select **"EDIcraft"** agent from the agent switcher

#### Step 2: Send Horizon Command
Send this exact message:
```
Visualize horizon surface in Minecraft
```

#### Step 3: Evaluate Response
Use this checklist to evaluate the response:

**Critical Checks** (Must Pass):
- [ ] Response received (not error)
- [ ] Mentions "Minecraft" or "visualization"
- [ ] Indicates where to see results ("connect to", "explore", etc.)
- [ ] Mentions "horizon" or "surface" or "geological"
- [ ] Does NOT show URLs (http://, https://)
- [ ] Does NOT show ports (:49000, :49001)
- [ ] Does NOT show RCON commands

**Quality Checks** (Should Pass):
- [ ] Uses emoji (✅, 🎮, 🌍)
- [ ] Has clear structure (paragraphs or sections)
- [ ] Is concise (under 500 words)
- [ ] Professional tone
- [ ] Actionable (tells user what to do next)

**Example Good Response**:
```
✅ Horizon surface visualization has been built in Minecraft!

The geological horizon surface has been processed and rendered 
underground, following the coordinate data from OSDU.

🎮 Connect to the Minecraft server to explore the visualization in 3D.
```

**Example Bad Response**:
```
I've executed RCON commands to build the horizon at 
http://edicraft.nigelgardiner.com:49001. The surface is now 
available in the Minecraft server.
```
(❌ Exposes technical details)

#### Step 4: Document Response
Copy the actual response here:
```
[PASTE RESPONSE HERE]
```

**Response Quality Score**: ___/10

### Part 2: Verify in Minecraft (10 minutes)

#### Step 1: Connect to Minecraft Server
1. Open **Minecraft Java Edition**
2. Click **"Multiplayer"**
3. Click **"Add Server"**
4. Enter server details:
   - **Server Name**: `EDIcraft`
   - **Server Address**: `edicraft.nigelgardiner.com:49000`
5. Click **"Done"**
6. Select the server and click **"Join Server"**

#### Step 2: Locate Horizon Surface
The horizon surface should be underground (Y < 100).

**Navigation Tips**:
- Press **F3** to see coordinates
- Look for Y coordinate less than 100
- Use `/tp` command if available
- Explore the area around spawn

#### Step 3: Verify Structure
Check for these characteristics:

**Structure Checks**:
- [ ] Surface is visible (blocks placed)
- [ ] Surface is underground (Y < 100)
- [ ] Surface has multiple blocks (not just one)
- [ ] Surface follows a pattern (not random)
- [ ] Surface looks like geological data (smooth or layered)

**Take Screenshots**:
1. Overview of horizon surface
2. Close-up of surface detail
3. Coordinate display (F3) showing Y < 100

#### Step 4: Document Findings
**Surface Location**: X=___, Y=___, Z=___

**Surface Characteristics**:
- Approximate size: ___ blocks wide x ___ blocks long
- Depth: Y=___ to Y=___
- Block type: ___
- Pattern: (describe what you see)

**Screenshots**: (attach or reference)

### Part 3: Test Edge Cases (Optional)

#### Test 1: Empty/Invalid Command
Send: `Show me a horizon`

**Expected**: Agent should ask for clarification or search for horizons

#### Test 2: Specific Horizon
Send: `Visualize horizon [specific-horizon-name] in Minecraft`

**Expected**: Agent should process that specific horizon

#### Test 3: Multiple Horizons
Send: `Visualize all horizons in Minecraft`

**Expected**: Agent should handle multiple horizons or explain limitations

## Results Summary

### Overall Assessment

**Agent Response Quality**: ⬜ PASS / ⬜ FAIL

**Minecraft Visualization**: ⬜ PASS / ⬜ FAIL

**Overall Task Status**: ⬜ COMPLETE / ⬜ NEEDS WORK

### Issues Found

List any issues discovered:
1. 
2. 
3. 

### Recommendations

List any improvements needed:
1. 
2. 
3. 

## Troubleshooting

### Issue: No Response from Agent
**Solutions**:
- Check agent is selected in UI
- Verify agent is deployed
- Check browser console for errors
- Try refreshing the page

### Issue: Response Shows Technical Details
**Solutions**:
- Agent system prompt needs updating
- Redeploy agent with updated prompt
- Verify agent.py has correct system prompt

### Issue: Cannot Connect to Minecraft
**Solutions**:
- Verify server address: `edicraft.nigelgardiner.com:49000`
- Check Minecraft version (Java Edition required)
- Verify server is running
- Try direct connection instead of server list

### Issue: No Horizon Surface Visible
**Solutions**:
- Check Y coordinate (must be < 100)
- Explore larger area (surface may be far from spawn)
- Verify agent actually executed build commands
- Check Minecraft server logs

## Completion Criteria

Task 5 is complete when:
- ✅ Agent responds to horizon surface command
- ✅ Response is professional and clear
- ✅ Response indicates where to see results
- ✅ No technical details exposed
- ✅ Horizon surface is visible in Minecraft
- ✅ Surface matches expected characteristics

## Next Steps

After completing this test:
1. Update `tests/TASK_5_HORIZON_WORKFLOW_TEST_RESULTS.md` with results
2. Mark task as complete in `tasks.md`
3. Move to Task 6: Validate presentation quality
4. Share results with product stakeholder

## Quick Reference

**Test Command**: `Visualize horizon surface in Minecraft`

**Minecraft Server**: `edicraft.nigelgardiner.com:49000`

**Expected Location**: Underground (Y < 100)

**Test Duration**: ~15 minutes

**Files**:
- Test results: `tests/TASK_5_HORIZON_WORKFLOW_TEST_RESULTS.md`
- This guide: `tests/TASK_5_MANUAL_TEST_GUIDE.md`
- Automated test: `tests/test-edicraft-horizon-workflow.js`
