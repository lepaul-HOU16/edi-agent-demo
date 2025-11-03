# Wind Rose Validation Guide

## Current Status

Tasks 1-4 are marked complete in the spec, but you need to validate that the Plotly wind rose is actually working.

## What Was Implemented

### ✅ Backend (simulation/handler.py)
- Imports `generate_plotly_wind_rose` from `plotly_wind_rose_generator.py`
- Generates Plotly wind rose data with 16 directions and 7 speed ranges
- Saves Plotly JSON to S3
- Includes `plotlyWindRose` in response
- Also generates matplotlib PNG as fallback

### ✅ Orchestrator (renewableOrchestrator/handler.ts)
- Maps `result.data.plotlyWindRose` to `artifact.data.plotlyWindRose`
- Maps `result.data.visualizations.wind_rose` to `artifact.data.visualizationUrl`
- Passes both fields to frontend
- **Added debug logging** to track data flow

### ✅ Frontend (WindRoseArtifact.tsx)
- Checks `data.plotlyWindRose` first (priority)
- Renders `PlotlyWindRose` component if Plotly data present
- Falls back to PNG if Plotly missing
- Falls back to SVG if both missing
- **Added debug logging** to track rendering decision

### ✅ PlotlyWindRose Component
- Accepts `data` and `layout` props
- Renders interactive Plotly barpolar chart
- Uses dark background (#1a1a1a)
- Shows hover tooltips with direction, speed, frequency

## Validation Steps

### Step 1: Test in Browser

1. Open your application in browser
2. Open browser console (F12)
3. Enter query: `show me a wind rose for 35.067482, -101.395466`
4. Watch for console logs

### Step 2: Check Console Logs

You should see these logs in order:

```
🌹 Orchestrator wind_rose_analysis mapping: {
  hasPlotlyWindRose: true,  // ← Should be true
  hasVisualizations: true,
  hasWindRoseUrl: true,
  plotlyDataKeys: ['data', 'layout', 'statistics']  // ← Should have these keys
}

🌹 WindRoseArtifact rendering decision: {
  hasPlotlyWindRose: true,  // ← Should be true
  hasVisualizationUrl: true,
  hasWindRoseData: true,
  plotlyDataType: 'object',  // ← Should be 'object'
  plotlyDataKeys: ['data', 'layout', 'statistics']  // ← Should have these keys
}
```

### Step 3: Verify What Renders

**Expected (SUCCESS):**
- Interactive Plotly wind rose displays
- Dark background (#1a1a1a)
- 16 directional sectors (N, NNE, NE, etc.)
- Stacked bars in different colors (yellow → purple)
- Hover shows: direction, speed range, frequency %
- Legend shows speed ranges (0-1, 1-2, 2-3, etc.)

**If PNG shows instead:**
- `hasPlotlyWindRose: false` in logs
- Backend didn't generate Plotly data
- Check Lambda logs for errors

**If SVG shows instead:**
- Both `hasPlotlyWindRose: false` and `hasVisualizationUrl: false`
- Complete backend failure
- Check Lambda logs for errors

## Debugging

### Check Backend Logs

```bash
# Find simulation Lambda name
aws lambda list-functions | grep -i simulation

# Tail logs
aws logs tail /aws/lambda/[function-name] --follow
```

Look for:
- ✅ "Creating Plotly wind rose data"
- ✅ "Saved Plotly wind rose data to S3"
- ✅ "Added Plotly wind rose data to response"

### Check Orchestrator Logs

```bash
# Find orchestrator Lambda name
aws lambda list-functions | grep -i orchestrator

# Tail logs
aws logs tail /aws/lambda/[function-name] --follow
```

Look for:
- ✅ "🌹 Orchestrator wind_rose_analysis mapping"
- ✅ `hasPlotlyWindRose: true`

### Check Browser Console

Look for:
- ✅ "🌹 WindRoseArtifact rendering decision"
- ✅ `hasPlotlyWindRose: true`
- ❌ No errors loading react-plotly.js
- ❌ No Plotly rendering errors

## Common Issues

### Issue 1: plotlyWindRose is undefined

**Symptoms:**
- Console shows `hasPlotlyWindRose: false`
- PNG or SVG renders instead

**Cause:**
- Backend not generating Plotly data
- Import error in simulation/handler.py
- VISUALIZATIONS_AVAILABLE = False

**Fix:**
1. Check backend logs for import errors
2. Verify `plotly_wind_rose_generator.py` exists
3. Verify `generate_plotly_wind_rose` function is called
4. Check for Python errors in Lambda logs

### Issue 2: Plotly data exists but component doesn't render

**Symptoms:**
- Console shows `hasPlotlyWindRose: true`
- But chart doesn't display

**Cause:**
- Frontend component error
- react-plotly.js failed to load
- Invalid data format

**Fix:**
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify data structure:
   ```javascript
   data.plotlyWindRose.data // Should be array of traces
   data.plotlyWindRose.layout // Should be object
   ```

### Issue 3: Chart renders but is blank

**Symptoms:**
- Plotly chart container shows
- But no bars visible

**Cause:**
- Invalid trace data
- All frequencies are 0
- Layout configuration issue

**Fix:**
1. Check data.plotlyWindRose.data in console
2. Verify traces have `type: 'barpolar'`
3. Verify `r` values (frequencies) are > 0
4. Check `theta` values (angles) are correct

## Success Criteria

✅ **Complete Success:**
- Interactive Plotly wind rose displays
- Dark background with colored bars
- Hover tooltips work
- Legend shows speed ranges
- No console errors

⚠️ **Partial Success:**
- PNG image displays (fallback working)
- Plotly data not generated by backend
- Need to fix backend

❌ **Failure:**
- SVG or "No data" displays
- Complete pipeline failure
- Need to check all Lambda logs

## Next Steps

1. **Run the test query** in browser
2. **Check console logs** for debug output
3. **Report results:**
   - What rendered? (Plotly / PNG / SVG / Nothing)
   - What do console logs show?
   - Any errors in browser console?
   - Any errors in Lambda logs?

4. **If working:** Mark task 5 complete ✅
5. **If not working:** Share console logs and Lambda logs for debugging

## Files Modified

- ✅ `amplify/functions/renewableOrchestrator/handler.ts` - Added plotlyWindRose mapping + debug logs
- ✅ `src/components/renewable/WindRoseArtifact.tsx` - Added title wrapping + debug logs
- ✅ `amplify/functions/renewableTools/simulation/handler.py` - Already generates Plotly data
- ✅ `amplify/functions/renewableTools/plotly_wind_rose_generator.py` - Already exists
- ✅ `src/components/renewable/PlotlyWindRose.tsx` - Already exists

## Test Scripts Created

- `tests/validate-windrose-complete.js` - Comprehensive validation checklist
- `tests/debug-windrose-flow.js` - Direct Lambda testing
- `tests/quick-windrose-test.sh` - Quick browser test guide

Run: `node tests/validate-windrose-complete.js` for full checklist
