# Immediate Fix Plan - Layout Map UI Issues

## Root Cause
The orchestrator now uses **Strands Agents** which may not be passing the complete layout response (including GeoJSON) to the frontend.

## The 4 Issues

1. ❌ **Turbines not showing** - GeoJSON with turbine features not reaching frontend
2. ❌ **OSM features not showing** - GeoJSON with terrain features not reaching frontend  
3. ❌ **Wake button doesn't work** - completedSteps not passed to frontend
4. ❌ **Duplicate optimize button** - Both ActionButtons and WorkflowCTAButtons rendering

## Quick Diagnostic

Run this in browser console after layout optimization:
```javascript
// Check what data the LayoutMapArtifact receives
console.log('Layout artifact data:', data);
console.log('Has GeoJSON?', !!data.geojson);
console.log('GeoJSON features:', data.geojson?.features?.length);
console.log('Turbine features:', data.geojson?.features?.filter(f => f.properties?.type === 'turbine').length);
console.log('Terrain features:', data.geojson?.features?.filter(f => f.properties?.type !== 'turbine').length);
```

## Fixes

### Fix 1 & 2: Ensure GeoJSON Passes Through Strands Agent

**File:** `amplify/functions/renewableOrchestrator/strandsAgentHandler.ts` or wherever layout responses are processed

**Problem:** Strands Agent may be transforming/filtering the layout response and dropping the GeoJSON

**Fix:** Ensure the complete layout response including `geojson` field is passed to frontend:

```typescript
// When processing layout tool response
const layoutResponse = await invokeLayoutTool(params);

// CRITICAL: Pass through ALL fields, especially geojson
const artifact = {
  messageContentType: 'wind_farm_layout',
  projectId: layoutResponse.projectId,
  turbineCount: layoutResponse.turbineCount,
  totalCapacity: layoutResponse.totalCapacity,
  turbinePositions: layoutResponse.turbinePositions,
  geojson: layoutResponse.geojson,  // ← MUST INCLUDE THIS!
  layoutType: layoutResponse.layoutType,
  spacing: layoutResponse.spacing,
  // ... all other fields
};
```

### Fix 3: Pass completedSteps

**Same file as Fix 1**

```typescript
// Track completed steps
const completedSteps = [];
if (hasTerrainResults) completedSteps.push('terrain');
if (hasLayoutResults) completedSteps.push('layout');
if (hasSimulationResults) completedSteps.push('simulation');

// Add to artifact
const artifact = {
  // ... other fields
  completedSteps: completedSteps  // ← ADD THIS
};
```

### Fix 4: Remove Duplicate Buttons

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

**Line ~580:** Remove the ActionButtons block:

```typescript
// DELETE THIS ENTIRE BLOCK:
{actions && actions.length > 0 && (
  <ActionButtons 
    actions={actions} 
    onActionClick={handleActionClick}
  />
)}

// KEEP ONLY WorkflowCTAButtons
<WorkflowCTAButtons
  completedSteps={data.completedSteps || ['terrain', 'layout']}
  projectId={data.projectId}
  onAction={handleActionClick}
/>
```

## Testing Steps

1. **Deploy changes**
   ```bash
   npx ampx sandbox
   ```

2. **Test in browser:**
   - Run layout optimization
   - Open DevTools Console
   - Check for log: `[LayoutMap] Feature breakdown:`
   - Should show: `turbines: 10, terrain: 15` (or similar)

3. **Visual verification:**
   - ✅ Blue turbine markers visible on map
   - ✅ Red building polygons visible
   - ✅ Gray road lines visible
   - ✅ Blue water polygons visible
   - ✅ "Run Wake Simulation" button enabled
   - ✅ Only ONE "Optimize" button

## Priority

1. **CRITICAL:** Fix GeoJSON pass-through (Issues #1, #2)
2. **HIGH:** Add completedSteps (Issue #3)
3. **MEDIUM:** Remove duplicate buttons (Issue #4)

## Next Step

I need to see the Strands Agent handler code to implement Fix #1-3. Can you run:
```bash
cat amplify/functions/renewableOrchestrator/strandsAgentHandler.ts | grep -A 20 "layout"
```

Or I can implement Fix #4 (duplicate buttons) right now since that's purely frontend.

Would you like me to:
A) Implement Fix #4 (remove duplicate buttons) immediately
B) Wait until we can verify the Strands Agent handler code
C) Create a diagnostic script to check what data is actually reaching the frontend
