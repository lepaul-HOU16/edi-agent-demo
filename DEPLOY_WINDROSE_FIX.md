# Deploy Wind Rose Fix

## The Problem

The code changes are in place, but the **backend hasn't been deployed**. The orchestrator Lambda is still running the old code that doesn't pass through `plotlyWindRose`.

Console shows:
```
hasPlotlyData: false          ← Should be true
visualizationPath: "SVG"      ← Should be "PLOTLY"
plotlyDataKeys: []            ← Should be ["data", "layout", "statistics"]
```

## The Solution

**Restart the sandbox to deploy the orchestrator changes:**

```bash
# Stop the current sandbox (Ctrl+C in the terminal running it)

# Restart sandbox
npx ampx sandbox

# Wait for "Deployed" message (may take 2-3 minutes)
```

## Why This Is Needed

Changes to Lambda functions require redeployment:
- ✅ Frontend changes (WindRoseArtifact.tsx) - auto-reload with Next.js
- ❌ Backend changes (orchestrator handler.ts) - require sandbox restart

The orchestrator Lambda needs to be redeployed with the new code that includes:
```typescript
plotlyWindRose: result.data.plotlyWindRose,
visualizationUrl: result.data.visualizations?.wind_rose || ...
```

## After Deployment

1. **Hard refresh the browser** (Cmd+Shift+R or Ctrl+Shift+R)
2. **Submit the query again**: "show me a wind rose for 35.067482, -101.395466"
3. **Check the console** - should now show:
   ```
   hasPlotlyData: true
   visualizationPath: "PLOTLY"
   plotlyDataKeys: ["data", "layout", "statistics"]
   ```
4. **Verify the UI**:
   - Interactive Plotly wind rose (not SVG)
   - Export button in top right
   - Title wraps properly
   - Hover tooltips work

## Verification

Run the test script after deployment:
```bash
node tests/test-windrose-plotly-fix.js
```

Should show:
```
✅ Simulation generates Plotly data: PASS
✅ Orchestrator passes Plotly data: PASS
🎉 SUCCESS: Plotly wind rose data flows through entire pipeline!
```
