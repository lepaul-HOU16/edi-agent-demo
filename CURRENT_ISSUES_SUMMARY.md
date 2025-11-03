# Current Issues Summary

## Issues Reported

1. ✅ **Wind rose** - not working
2. ❌ **Wake simulation** - not working  
3. ❌ **Generate report** - returns layout instead of report
4. ❌ **Layout footer** - duplicate stats showing twice
5. ❓ **Dashboards** - how to access them
6. ❓ **Action buttons** - where are they

## Investigation Results

### 1. Wind Rose - SHOULD BE WORKING ✅

**Code Status:**
- ✅ Backend generates Plotly data (`simulation/handler.py`)
- ✅ Orchestrator passes through `plotlyWindRose` (`handler.ts` line 1633)
- ✅ Frontend checks for Plotly first (`WindRoseArtifact.tsx` line 227)
- ✅ PlotlyWindRose component exists and works
- ✅ Debug logging added to track data flow

**To Validate:**
1. Run query: `show me a wind rose for 35.067482, -101.395466`
2. Check browser console for:
   ```
   🌹 Orchestrator wind_rose_analysis mapping: { hasPlotlyWindRose: true }
   🌹 WindRoseArtifact rendering decision: { hasPlotlyWindRose: true }
   ```
3. Should see: Interactive Plotly chart with dark background
4. If PNG shows: Backend issue - check Lambda logs
5. If SVG shows: Complete failure - check all logs

**Files:**
- `tests/WINDROSE_VALIDATION_GUIDE.md` - Complete validation guide
- `tests/validate-windrose-complete.js` - Validation checklist
- `WINDROSE_QUICK_TEST.md` - Quick test reference

### 2. Wake Simulation - NOT IMPLEMENTED ❌

**Problem:** No `wake_simulation` case in orchestrator

**Evidence:**
- Searched for `case 'wake_simulation'` - NOT FOUND
- Searched for `wake_analysis` - NOT FOUND
- The simulation Lambda handles wake simulation but orchestrator doesn't route it

**Fix Needed:**
Add wake simulation case to orchestrator `formatArtifacts` function around line 1620:

```typescript
case 'wake_simulation':
case 'wake_analysis':
  artifact = {
    type: 'wake_analysis',
    data: {
      messageContentType: 'wake_analysis',
      // ... map wake simulation data
    },
    actions
  };
  break;
```

### 3. Generate Report - NOT IMPLEMENTED ❌

**Problem:** `report_generation` case exists but may not be working correctly

**Evidence:**
- Case exists at line ~1650
- Maps to `wind_farm_report` artifact type
- Need to verify what data backend returns vs what orchestrator expects

**To Debug:**
1. Run query: `generate report for [project]`
2. Check orchestrator logs for what `result.data` contains
3. Check if it's being mapped to layout instead

### 4. Layout Footer Duplicate Stats - BUG ❌

**Problem:** Stats showing twice in layout footer:
```
Turbine Positions16 turbine positions calculated (First: 35.060725, -101.403721)
Turbine Positions16 turbine positions calculated (First: 35.060725, -101.403721)
```

**Fix Needed:**
Check `LayoutMapArtifact.tsx` footer rendering - likely rendering same stats twice

### 5. Dashboards - HOW TO ACCESS ❓

**Available Dashboards:**
1. `WindResourceDashboard.tsx` - Wind resource analysis
2. `PerformanceAnalysisDashboard.tsx` - Performance metrics
3. `WakeAnalysisDashboard.tsx` - Wake analysis

**Problem:** These are standalone components but NOT integrated into orchestrator

**Evidence:**
- Components exist in `src/components/renewable/`
- Backend has `dashboard_data_generator.py`
- But NO dashboard cases in orchestrator `formatArtifacts`
- NOT accessible via queries

**Fix Needed:**
Add dashboard cases to orchestrator and create queries to trigger them

### 6. Action Buttons - SHOULD BE WORKING ✅

**Code Status:**
- ✅ `ActionButtons` component exists (`ActionButtons.tsx`)
- ✅ `generateActionButtons` function exists (`actionButtonTypes.ts`)
- ✅ Orchestrator imports and calls `generateActionButtons` (line 33, 1544)
- ✅ Actions added to artifacts (line 1574)
- ✅ WindRoseArtifact renders ActionButtons (line 189-193)

**To Validate:**
1. Run any renewable query (terrain, layout, wind rose, etc.)
2. Look for action buttons below the artifact header
3. Should see buttons like:
   - "Optimize Turbine Layout" (after terrain)
   - "Run Wake Simulation" (after layout)
   - "Generate Report" (after simulation)

**If Not Showing:**
- Check browser console for `actions` prop in artifact data
- Check orchestrator logs for action button generation
- Verify `projectName` is being passed to `formatArtifacts`

## Priority Fixes

### HIGH PRIORITY
1. **Wake Simulation** - Add orchestrator case
2. **Generate Report** - Debug why it returns layout
3. **Layout Footer** - Fix duplicate stats

### MEDIUM PRIORITY
4. **Dashboards** - Integrate into orchestrator
5. **Validate Wind Rose** - Confirm Plotly is showing
6. **Validate Action Buttons** - Confirm they appear

### LOW PRIORITY
7. Documentation cleanup
8. Test script organization

## Next Steps

1. **Test wind rose** with validation guide
2. **Test action buttons** - do they appear?
3. **Fix wake simulation** - add orchestrator case
4. **Fix report generation** - debug data mapping
5. **Fix layout footer** - remove duplicate
6. **Add dashboards** - integrate into orchestrator

## Test Commands

```bash
# Validate wind rose
node tests/validate-windrose-complete.js

# Check orchestrator logs
aws logs tail /aws/lambda/[orchestrator-function] --follow

# Check simulation logs  
aws logs tail /aws/lambda/[simulation-function] --follow
```

## Files to Check

1. `amplify/functions/renewableOrchestrator/handler.ts` - Main orchestrator
2. `src/components/renewable/WindRoseArtifact.tsx` - Wind rose display
3. `src/components/renewable/LayoutMapArtifact.tsx` - Layout footer bug
4. `amplify/functions/renewableTools/simulation/handler.py` - Backend simulation

## Questions to Answer

1. **Does Plotly wind rose show?** (Check browser)
2. **Do action buttons appear?** (Check below artifacts)
3. **What happens with wake simulation query?** (Test it)
4. **What happens with generate report query?** (Test it)
5. **Where is the duplicate in layout footer?** (Inspect component)
