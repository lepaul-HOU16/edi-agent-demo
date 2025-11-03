# Wind Rose UI Fix - Browser Diagnostic

## Step 1: Check Console Logs

1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Clear console
4. Submit query: "show me a wind rose for 35.067482, -101.395466"
5. Look for log message starting with "🌹 WindRoseArtifact RENDER:"

**What to check:**
```
🌹 WindRoseArtifact RENDER: {
  projectId: "...",
  hasPlotlyData: ???,           ← Should be TRUE
  hasVisualizationUrl: ???,
  hasWindRoseData: ???,
  visualizationPath: "???",     ← Should be "PLOTLY"
  plotlyDataKeys: [...],
  visualizationUrl: "...",
  timestamp: "..."
}
```

## Step 2: Check Network Tab

1. Go to Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for the request to the orchestrator Lambda
4. Click on it and check the Response

**What to check in response:**
```json
{
  "success": true,
  "data": {
    "artifacts": [
      {
        "type": "wind_rose_analysis",
        "data": {
          "plotlyWindRose": {      ← Should exist
            "data": [...],
            "layout": {...},
            "statistics": {...}
          },
          "visualizationUrl": "..." ← PNG fallback
        }
      }
    ]
  }
}
```

## Step 3: Force Rebuild

If the console shows `hasPlotlyData: false` or `visualizationPath: "PNG"`:

```bash
# Stop the dev server (Ctrl+C)

# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev

# Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
```

## Step 4: Check Element Styles

1. Right-click on the title text
2. Select "Inspect Element"
3. Check if the title has the wrapper div:

```html
<div style="max-width: calc(100% - 320px); padding-right: 20px;">
  Wind Rose Analysis - claude-texas-wind-farm-3
</div>
```

If this div is NOT there, the component didn't rebuild.

## Step 5: Verify Backend Changes

Run the test script:
```bash
node tests/test-windrose-plotly-fix.js
```

This will check if:
- Simulation Lambda generates Plotly data ✓
- Orchestrator passes through Plotly data ✓

## Common Issues

### Issue 1: Frontend Not Rebuilt
**Symptom**: Console shows old behavior, no wrapper div
**Solution**: 
```bash
rm -rf .next
npm run dev
```

### Issue 2: Browser Cache
**Symptom**: Old JavaScript still running
**Solution**: Hard refresh (Cmd+Shift+R)

### Issue 3: Backend Not Deployed
**Symptom**: Test script fails, no Plotly data in response
**Solution**:
```bash
# Restart sandbox
npx ampx sandbox
```

### Issue 4: Wrong Artifact Type
**Symptom**: Console shows different artifact type
**Solution**: Check that query triggers wind_rose intent

## Expected Final State

✅ Console log shows:
- `hasPlotlyData: true`
- `visualizationPath: "PLOTLY"`
- `plotlyDataKeys: ["data", "layout", "statistics"]`

✅ UI shows:
- Interactive Plotly wind rose (not static PNG)
- Export button in top right corner
- Title wraps with proper spacing
- Hover tooltips work on chart

✅ Network response includes:
- `plotlyWindRose` object with data, layout, statistics
- `visualizationUrl` as PNG fallback
