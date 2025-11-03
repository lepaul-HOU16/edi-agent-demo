# Task 4: Complete Clear and Terrain Workflow - Manual Test Guide

## Overview

This guide provides step-by-step instructions for manually testing the complete clear and terrain workflow to validate Requirements 1.3, 1.4, and 3.6.

## Prerequisites

- Minecraft server running and accessible
- EDIcraft agent deployed and configured
- RCON connection working
- Frontend application running

## Test Procedure

### Phase 1: Build Test Structure

**Objective:** Build a test wellbore with drilling rig including signs

1. **Open Minecraft Client**
   - Connect to the Minecraft server
   - Navigate to coordinates: (100, 65, 100)

2. **Build Test Wellbore via EDIcraft**
   - Open EDIcraft chat interface
   - Send message: "Build a wellbore at coordinates 100, 65, 100"
   - Wait for wellbore to be built
   - Verify wellbore appears in Minecraft

3. **Verify Structure Components**
   - Check for wellbore blocks (obsidian, glowstone, etc.)
   - Check for drilling rig blocks (iron bars, furnaces, chests, etc.)
   - **CRITICAL:** Check for signs (oak_sign, oak_wall_sign, etc.)
   - Check for marker blocks (beacons, torches, etc.)

4. **Document Initial State**
   - Take screenshot of structure
   - Note approximate block count
   - Note any signs visible

### Phase 2: Execute Clear Operation

**Objective:** Execute clear operation and verify response

1. **Click Clear Button**
   - In EDIcraft chat interface
   - Click "Clear Minecraft Environment" button
   - OR send message: "Clear the Minecraft environment"

2. **Verify Response Format**
   - Check for success icon (✅)
   - Check for title: "Minecraft Environment Cleared"
   - Check for summary section with counts
   - Check for terrain repair information
   - Check for tip section

3. **Verify Single Button**
   - **CRITICAL:** Verify only ONE clear button appears
   - Check no duplicate buttons in chat
   - Check button is in correct location
   - Check button styling is correct

### Phase 3: Verify Blocks Removed

**Objective:** Verify all blocks removed including signs (Requirement 1.3)

1. **Navigate to Test Area**
   - Go to coordinates (100, 65, 100)
   - Look around the area

2. **Check for Remaining Blocks**
   - Wellbore blocks: Should be NONE
   - Rig blocks: Should be NONE
   - **CRITICAL:** Signs: Should be NONE (check carefully)
   - Marker blocks: Should be NONE

3. **Specific Sign Check**
   - Look for oak_sign (standing signs)
   - Look for oak_wall_sign (wall-mounted signs)
   - Look for any other sign variants
   - **PASS CRITERIA:** Zero signs remaining

4. **Document Results**
   - Take screenshot of cleared area
   - Note any remaining blocks
   - Note any visual artifacts

### Phase 4: Verify Terrain Filled

**Objective:** Verify terrain filled correctly at all layers (Requirement 1.4)

1. **Check Surface Layer (y=61-70)**
   - Look at ground level
   - Should see grass_block
   - Should be no holes or air pockets
   - Should look natural

2. **Check Subsurface (y=50-60)**
   - Dig down to check subsurface
   - Should see dirt blocks
   - Should be no air pockets
   - Should transition naturally to stone

3. **Check Deep Layer (y=0-49)**
   - Check underground areas
   - Should see stone blocks
   - Should be no large air pockets
   - Should look like natural terrain

4. **Check for Visual Artifacts**
   - Look for floating blocks
   - Look for unnatural patterns
   - Look for holes in terrain
   - Look for water/lava issues

5. **Document Results**
   - Take screenshots of each layer
   - Note any issues
   - Note terrain quality

### Phase 5: Verify UI Behavior

**Objective:** Verify UI shows single clear button (Requirement 3.6)

1. **Check Clear Button Rendering**
   - Verify button appears once
   - Verify button is clickable
   - Verify button styling is correct
   - Verify no duplicate buttons

2. **Check Response Formatting**
   - Verify response uses Cloudscape components
   - Verify sections are properly formatted
   - Verify icons display correctly
   - Verify tip section displays

3. **Test Multiple Clear Operations**
   - Build another structure
   - Clear again
   - Verify button still appears once
   - Verify no accumulation of buttons

4. **Document Results**
   - Take screenshots of UI
   - Note any UI issues
   - Note any duplicate buttons

### Phase 6: End-to-End Validation

**Objective:** Verify complete workflow works end-to-end

1. **Build New Wellbore**
   - Build another wellbore in cleared area
   - Verify it builds successfully
   - Verify no interference from previous structures

2. **Clear Again**
   - Clear the new wellbore
   - Verify clearing works
   - Verify terrain fills again

3. **Verify Repeatability**
   - Verify workflow can be repeated
   - Verify no degradation over multiple cycles
   - Verify environment stays clean

## Pass/Fail Criteria

### Requirement 1.3: All Blocks Removed (Including Signs)

**PASS:**
- Zero wellbore blocks remaining
- Zero rig blocks remaining
- **Zero sign blocks remaining (all variants)**
- Zero marker blocks remaining
- No visual artifacts

**FAIL:**
- Any blocks remaining
- **Any signs remaining (CRITICAL)**
- Visual artifacts present

### Requirement 1.4: Terrain Filled Correctly

**PASS:**
- Surface layer (y=61-70) filled with grass_block
- Subsurface layer (y=50-60) filled with dirt
- Deep layer (y=0-49) filled with stone
- No holes or air pockets
- Terrain looks natural

**FAIL:**
- Holes or air pockets present
- Wrong block types used
- Terrain looks unnatural
- Visual artifacts

### Requirement 3.6: UI Shows Single Clear Button

**PASS:**
- Clear button appears exactly once
- Button is properly styled
- Response is properly formatted
- No duplicate buttons
- Works across multiple operations

**FAIL:**
- Duplicate buttons appear
- Button doesn't appear
- Response not formatted correctly
- UI issues present

## Test Results Template

```
=== TASK 4 MANUAL TEST RESULTS ===

Date: _______________
Tester: _______________

Phase 1: Build Test Structure
[ ] Test structure built successfully
[ ] Signs visible in structure
Notes: _______________

Phase 2: Execute Clear Operation
[ ] Clear operation executed
[ ] Response properly formatted
[ ] Single clear button displayed
Notes: _______________

Phase 3: Verify Blocks Removed
[ ] All wellbore blocks removed
[ ] All rig blocks removed
[ ] All sign blocks removed (CRITICAL)
[ ] All marker blocks removed
[ ] No visual artifacts
Notes: _______________

Phase 4: Verify Terrain Filled
[ ] Surface layer filled correctly
[ ] Subsurface layer filled correctly
[ ] Deep layer filled correctly
[ ] No holes or air pockets
[ ] Terrain looks natural
Notes: _______________

Phase 5: Verify UI Behavior
[ ] Single clear button displayed
[ ] Response properly formatted
[ ] No duplicate buttons
[ ] Works across multiple operations
Notes: _______________

Phase 6: End-to-End Validation
[ ] Can build new wellbore after clear
[ ] Can clear again successfully
[ ] Workflow is repeatable
Notes: _______________

=== REQUIREMENTS VALIDATION ===

Requirement 1.3 (All blocks removed): [ PASS / FAIL ]
Requirement 1.4 (Terrain filled correctly): [ PASS / FAIL ]
Requirement 3.6 (UI single clear button): [ PASS / FAIL ]

=== OVERALL RESULT ===

Task 4: [ PASS / FAIL ]

Issues Found:
_______________

Recommendations:
_______________
```

## Troubleshooting

### Issue: Signs Not Removed

**Symptoms:**
- Oak_sign or oak_wall_sign blocks remain after clear
- Other sign variants remain

**Solution:**
1. Check clear_environment_tool.py has all sign variants in rig_blocks
2. Run: `python3 tests/verify-sign-variants.py`
3. Verify all sign types are listed
4. Redeploy if needed

### Issue: Terrain Not Filled

**Symptoms:**
- Holes or air pockets remain
- Wrong block types used

**Solution:**
1. Check clear_environment_tool.py terrain filling logic
2. Verify layered filling is implemented
3. Check RCON commands are correct
4. Test with smaller area first

### Issue: Duplicate Clear Buttons

**Symptoms:**
- Multiple clear buttons appear
- Buttons accumulate over time

**Solution:**
1. Check EDIcraftResponseComponent.tsx uses content hash
2. Verify data-content-hash attribute is set
3. Check ChatMessage.tsx rendering logic
4. Clear browser cache and test again

### Issue: Clear Operation Fails

**Symptoms:**
- Error message displayed
- Blocks not removed

**Solution:**
1. Check Minecraft server is running
2. Verify RCON connection works
3. Check RCON credentials are correct
4. Check server logs for errors

## Next Steps

After completing manual testing:

1. **Document Results**
   - Fill out test results template
   - Take screenshots
   - Note any issues

2. **Update Task Status**
   - If all tests pass: Mark task 4 as complete
   - If tests fail: Document issues and fix

3. **Proceed to Task 5**
   - Deploy and validate in sandbox
   - Test with actual Minecraft server
   - Verify no regressions

## Contact

If you encounter issues during testing:
- Check troubleshooting section above
- Review implementation in clear_environment_tool.py
- Check UI components in EDIcraftResponseComponent.tsx
- Review test logs for details
