# Wind Rose Quick Test

## Test Query
```
show me a wind rose for 35.067482, -101.395466
```

## What to Check

### 1. Browser Console (F12)

Look for these logs:

```javascript
// Orchestrator log
🌹 Orchestrator wind_rose_analysis mapping: {
  hasPlotlyWindRose: true,  // ← Should be TRUE
  ...
}

// Frontend log
🌹 WindRoseArtifact rendering decision: {
  hasPlotlyWindRose: true,  // ← Should be TRUE
  ...
}
```

### 2. Visual Result

**✅ SUCCESS - Plotly Interactive Chart:**
- Dark background (#1a1a1a)
- Colored stacked bars (yellow → purple)
- 16 directions (N, NNE, NE, etc.)
- Hover shows tooltips
- Legend on right side

**⚠️ FALLBACK - PNG Image:**
- Static image displays
- Backend issue - Plotly not generated
- Check Lambda logs

**❌ FAILURE - SVG or Nothing:**
- Basic SVG or error message
- Complete pipeline failure
- Check all Lambda logs

## Quick Diagnosis

| What You See | hasPlotlyWindRose | Diagnosis |
|--------------|-------------------|-----------|
| Interactive Plotly chart | `true` | ✅ **WORKING** |
| PNG image | `false` | ⚠️ Backend not generating Plotly |
| SVG fallback | `false` | ❌ Backend completely failed |
| "No data" | `false` | ❌ Complete pipeline failure |

## If Not Working

1. **Check browser console** for errors
2. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/[simulation-function] --follow
   ```
3. **Share results:**
   - What rendered?
   - Console log output?
   - Any errors?

## Files with Debug Logs

- `amplify/functions/renewableOrchestrator/handler.ts` (line ~1622)
- `src/components/renewable/WindRoseArtifact.tsx` (line ~227)

## Expected Flow

```
User Query
    ↓
Simulation Lambda
    ├─ Generates wind data (16 directions)
    ├─ Calls generate_plotly_wind_rose()
    ├─ Returns plotlyWindRose object
    └─ Also generates PNG fallback
    ↓
Orchestrator
    ├─ Receives result.data.plotlyWindRose
    ├─ Maps to artifact.data.plotlyWindRose
    └─ Logs: hasPlotlyWindRose: true
    ↓
Frontend (WindRoseArtifact)
    ├─ Receives data.plotlyWindRose
    ├─ Logs: hasPlotlyWindRose: true
    └─ Renders PlotlyWindRose component
    ↓
PlotlyWindRose Component
    ├─ Loads react-plotly.js
    ├─ Renders barpolar chart
    └─ Shows interactive visualization
    ↓
✅ User sees interactive wind rose
```

## Success = Interactive Plotly Chart

If you see the interactive chart with hover tooltips, **it's working!** ✅

Mark task 5 complete and move on.
