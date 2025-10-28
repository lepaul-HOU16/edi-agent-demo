# Intelligent Placement User Validation Guide

## ⚠️ CRITICAL: This Must Be Validated By USER in Browser

**DO NOT accept "tests pass" as proof. The user MUST see this working in the actual UI.**

---

## What We're Validating

We need to PROVE that intelligent turbine placement is actually working, not just returning `success: true`.

### The Problem

In the past, we've had:
- Tests that pass but features don't work
- Logs that claim success but wrong algorithm runs
- UI that shows results but uses mock data

### The Solution

**Visual validation in the browser by the user.**

---

## Step 1: Run Backend Validation Test

First, validate the backend is working:

```bash
cd tests
node validate-intelligent-placement-complete.js
```

**Expected Output:**
```
🎉 SUCCESS: Intelligent Placement is Working!

Validation Results:
  ✅ Algorithm: intelligent_placement
  ✅ Constraints applied: 47
  ✅ Turbines: 25
  ✅ Spacing variation: 0.2341 (NOT a grid)
  ✅ Turbines near obstacles: 4.0% (< 10%)
  ✅ Terrain features included: 47
```

**If this fails, DO NOT proceed to UI testing. Fix the backend first.**

---

## Step 2: Deploy to Sandbox

```bash
# Stop current sandbox
Ctrl+C

# Restart sandbox
npx ampx sandbox

# Wait for "Deployed" message (5-10 minutes)
```

**Verify deployment:**
```bash
aws lambda list-functions | grep -i layout
```

You should see the layout Lambda function listed.

---

## Step 3: Check CloudWatch Logs

Open CloudWatch logs for the layout Lambda:

```bash
# Get Lambda name
LAYOUT_LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'layout')].FunctionName" --output text)

# Tail logs
aws logs tail /aws/lambda/$LAYOUT_LAMBDA --follow
```

Keep this terminal open - you'll check logs after running the query.

---

## Step 4: Test in Browser UI

### 4.1 Open Application

1. Open your application in browser
2. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+F5)
3. Open browser console (F12)
4. Go to Console tab

### 4.2 Run Test Query

In the chat interface, enter:

```
optimize layout at 35.067482, -101.395466
```

**Location:** Texas Panhandle (has buildings, roads, water bodies)

### 4.3 Wait for Response

You should see:
1. "Analyzing..." popup
2. Progress indicators
3. Layout map appears

---

## Step 5: Visual Validation Checklist

### ✅ Algorithm Info Box

**Look for a blue info box above the map that shows:**

```
Intelligent Placement Algorithm

Algorithm: intelligent_placement
Verification: INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED
Constraints Applied: 47 terrain features
Features Considered: building, road, water, perimeter
Site area: 5.00 km² | Average spacing: 500m
```

**CRITICAL CHECKS:**
- [ ] Info box is visible
- [ ] Algorithm says "intelligent_placement" (NOT "grid")
- [ ] Verification proof is present
- [ ] Constraints applied > 0
- [ ] Features considered includes buildings/roads/water

**If algorithm says "grid", intelligent placement is NOT working!**

---

### ✅ Turbine Positions Are NOT a Grid

**Look at the turbine positions on the map:**

**Grid Pattern (BAD):**
```
🔵 🔵 🔵 🔵 🔵
🔵 🔵 🔵 🔵 🔵
🔵 🔵 🔵 🔵 🔵
🔵 🔵 🔵 🔵 🔵
🔵 🔵 🔵 🔵 🔵
```
- Perfect rows and columns
- Equal spacing everywhere
- Looks like a checkerboard

**Intelligent Placement (GOOD):**
```
🔵   🔵 🔵     🔵
  🔵     🔵 🔵
🔵 🔵       🔵
    🔵 🔵 🔵
🔵     🔵   🔵
```
- Irregular spacing
- No perfect rows/columns
- Gaps where obstacles are
- Clusters in open areas

**CRITICAL CHECKS:**
- [ ] Turbines are NOT in perfect rows
- [ ] Turbines are NOT in perfect columns
- [ ] Spacing between turbines varies
- [ ] Pattern looks irregular/organic

**If turbines form a perfect grid, intelligent placement is NOT working!**

---

### ✅ Turbines Avoid Obstacles

**Look at the map and check:**

1. **Buildings (red polygons):**
   - [ ] No turbines directly on buildings
   - [ ] Turbines have space around buildings
   - [ ] Can see clear gaps where buildings are

2. **Roads (gray lines):**
   - [ ] No turbines directly on roads
   - [ ] Turbines maintain distance from roads
   - [ ] Can see turbines routed around roads

3. **Water bodies (blue polygons):**
   - [ ] No turbines in water
   - [ ] Turbines stay on land
   - [ ] Clear boundary between turbines and water

**Visual Test:**
- Zoom in on the map
- Click on a building (red polygon)
- Look at nearby turbines
- Turbines should be at least 100m away

**If turbines are placed ON buildings/roads/water, intelligent placement is NOT working!**

---

### ✅ OSM Features Are Visible

**The map should show:**

- [ ] Red polygons (buildings)
- [ ] Gray lines (roads)
- [ ] Blue polygons (water bodies)
- [ ] Dashed circle (perimeter)
- [ ] Blue markers (turbines)

**All features should be visible on the same map.**

**If you only see turbines (no buildings/roads/water), OSM features are NOT being merged!**

---

## Step 6: Check CloudWatch Logs

Go back to the terminal with CloudWatch logs.

**Look for these messages:**

```
================================================================================
LAYOUT OPTIMIZATION STARTING
================================================================================

================================================================================
EXTRACTING OSM FEATURES FROM PROJECT CONTEXT
================================================================================
Received 47 terrain features from context
Feature breakdown: {'building': 15, 'road': 8, 'water': 3, 'perimeter': 1}

================================================================================
CALLING INTELLIGENT PLACEMENT ALGORITHM
================================================================================
Exclusion zones: 15 buildings, 8 roads, 3 water bodies
Total constraints: 26

============================================================
🎯 INTELLIGENT TURBINE PLACEMENT (Pure Python)
   Target: 25 turbines
   Spacing: 500m between turbines
   Radius: 1.26km
============================================================
   Exclusion zones: 15 buildings, 8 roads, 3 water bodies
   Generating 3x3 candidate grid...
   Generated 289 candidate positions
   178 candidates avoid exclusion zones
✅ Placed 25 turbines intelligently
   Avoided 26 terrain constraints
============================================================

Intelligent placement returned 25 turbines

================================================================================
CREATING TURBINE GEOJSON FEATURES
================================================================================
Generated 25 turbine features

================================================================================
MERGING OSM FEATURES WITH TURBINES
================================================================================
Merged features: 47 terrain + 25 turbines = 72 total

Algorithm: intelligent_placement
Algorithm Proof: INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED
================================================================================
```

**CRITICAL CHECKS:**
- [ ] Logs show "INTELLIGENT TURBINE PLACEMENT"
- [ ] Logs show exclusion zones being used
- [ ] Logs show candidates being filtered
- [ ] Logs show "Placed X turbines intelligently"
- [ ] Logs show "Avoided X terrain constraints"
- [ ] Logs show "Algorithm: intelligent_placement"

**If logs show "BASIC GRID PLACEMENT", intelligent placement is NOT working!**

---

## Step 7: Browser Console Validation

In the browser console (F12), look for:

```javascript
🗺️ LayoutMapArtifact RENDER: {
  projectId: "layout-1234567890",
  turbineCount: 25,
  hasMapHtml: false,
  hasGeojson: true,
  hasMetadata: true,
  algorithm: "intelligent_placement",
  algorithmProof: "INTELLIGENT_PLACEMENT_ALGORITHM_EXECUTED",
  constraintsApplied: 47
}

[LayoutMap] Feature breakdown: {
  total: 72,
  terrain: 47,
  turbines: 25
}
```

**CRITICAL CHECKS:**
- [ ] `algorithm: "intelligent_placement"`
- [ ] `algorithmProof` is present
- [ ] `constraintsApplied > 0`
- [ ] `terrain` features > 0
- [ ] `turbines` count matches expected

---

## Step 8: Final Validation

### All Checks Must Pass

Go through this checklist:

**Backend:**
- [ ] Backend validation test passes
- [ ] CloudWatch logs show "INTELLIGENT TURBINE PLACEMENT"
- [ ] CloudWatch logs show constraints being applied
- [ ] CloudWatch logs show "Algorithm: intelligent_placement"

**UI - Algorithm Info:**
- [ ] Algorithm info box is visible
- [ ] Algorithm says "intelligent_placement"
- [ ] Verification proof is present
- [ ] Constraints applied > 0

**UI - Visual Inspection:**
- [ ] Turbines are NOT in a perfect grid
- [ ] Turbines avoid buildings (red polygons)
- [ ] Turbines avoid roads (gray lines)
- [ ] Turbines avoid water (blue polygons)
- [ ] OSM features are visible on map

**Browser Console:**
- [ ] Console shows `algorithm: "intelligent_placement"`
- [ ] Console shows terrain features > 0
- [ ] No errors in console

---

## What If Validation Fails?

### If Algorithm Info Shows "grid"

**Problem:** Grid algorithm is being used instead of intelligent placement

**Debug:**
1. Check CloudWatch logs - what algorithm actually ran?
2. Check if OSM features were passed to layout Lambda
3. Check if exclusion zones are empty
4. Verify terrain analysis ran before layout optimization

### If Turbines Form a Perfect Grid

**Problem:** Intelligent placement algorithm is not being called

**Debug:**
1. Check CloudWatch logs for "INTELLIGENT TURBINE PLACEMENT"
2. If logs show "BASIC GRID PLACEMENT", find out why
3. Check if `exclusion_zones` parameter is empty
4. Verify `intelligent_placement.py` is being imported

### If Turbines Are ON Obstacles

**Problem:** Constraint checking is not working

**Debug:**
1. Check safety margin in `intelligent_placement.py` (should be 0.001 degrees)
2. Check if obstacle coordinates are correct
3. Verify distance calculation is working
4. Check if candidate filtering is happening

### If No OSM Features Visible

**Problem:** Terrain features are not being merged with turbines

**Debug:**
1. Check CloudWatch logs for "MERGING OSM FEATURES"
2. Verify `terrain_features` are being extracted from project context
3. Check if `combined_geojson` includes both terrain and turbines
4. Verify frontend is rendering all feature types

---

## Success Criteria

**Intelligent placement is ONLY working if:**

1. ✅ Algorithm info box shows "intelligent_placement"
2. ✅ Turbines are visibly NOT in a grid
3. ✅ Turbines visibly avoid obstacles
4. ✅ CloudWatch logs confirm intelligent placement ran
5. ✅ OSM features are visible on map

**If ANY of these fail, intelligent placement is NOT working.**

---

## Next Steps After Validation

### If All Checks Pass

1. Mark Task 1 as complete
2. Move to Task 2 (Perimeter Clickthrough)
3. Continue with remaining UI/UX fixes

### If Any Checks Fail

1. DO NOT mark task as complete
2. Debug the specific failure
3. Fix the issue
4. Re-deploy
5. Re-test
6. Repeat until all checks pass

---

## Remember

**The user must SEE this working in the browser.**

**Tests passing is NOT enough.**

**Logs claiming success is NOT enough.**

**Only visual validation by the user counts.**

---

## Test Locations

### Primary Test Location
- **Coordinates:** 35.067482, -101.395466
- **Location:** Texas Panhandle
- **Features:** Buildings, roads, water bodies
- **Good for:** Full validation

### Alternative Test Locations

If primary location doesn't work, try:

1. **Oklahoma City area:**
   - Coordinates: 35.4676, -97.5164
   - Features: Dense buildings, roads

2. **Kansas farmland:**
   - Coordinates: 37.6922, -97.3375
   - Features: Roads, some buildings

3. **West Texas:**
   - Coordinates: 31.9973, -102.0779
   - Features: Sparse buildings, roads

---

## Questions to Ask User

After they test:

1. **Do you see the algorithm info box?**
   - If no: Frontend not displaying metadata
   - If yes: What does it say?

2. **Are the turbines in a perfect grid?**
   - If yes: Intelligent placement not working
   - If no: Good! Describe the pattern

3. **Can you see buildings/roads/water on the map?**
   - If no: OSM features not being merged
   - If yes: Good! Are turbines avoiding them?

4. **Do turbines appear to avoid obstacles?**
   - If no: Constraint checking not working
   - If yes: Good! Can you zoom in and verify?

5. **What do the CloudWatch logs show?**
   - Look for "INTELLIGENT TURBINE PLACEMENT"
   - Look for "Avoided X terrain constraints"

---

## Final Note

**This is the MOST CRITICAL validation in the entire spec.**

**Intelligent placement is the core feature.**

**If this doesn't work, nothing else matters.**

**Take the time to validate it properly.**
