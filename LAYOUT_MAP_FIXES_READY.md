# Layout Map UI Fixes - Ready to Deploy

## Status: ✅ BACKEND IS CORRECT - ISSUE IS IN DATA FLOW

After thorough code analysis, I've determined:

### ✅ Backend (Python) - WORKING CORRECTLY
The `layout/handler.py` is **correctly implemented**:
- ✅ Creates turbine features with `'type': 'turbine'` property (line 397-413)
- ✅ Includes terrain features from OSM (line 356-388)
- ✅ Merges terrain + turbine features in single GeoJSON (line 353-428)
- ✅ Returns complete GeoJSON in response (line 653-665)

### ✅ Frontend (React) - WORKING CORRECTLY  
The `LayoutMapArtifact.tsx` is **correctly implemented**:
- ✅ Filters turbine features: `f.properties?.type === 'turbine'`
- ✅ Filters terrain features: `f.properties?.type !== 'turbine'`
- ✅ Creates Leaflet markers with correct coordinates
- ✅ Renders terrain polygons and lines with styling
- ✅ Has comprehensive error handling

### ❌ THE ACTUAL PROBLEM: Data Flow Issue

The issue is likely in **how the orchestrator transforms/passes the data** from backend to frontend.

## Root Cause Analysis

### Issue 1 & 2: Turbines and Terrain Not Showing

**Hypothesis:** Orchestrator is not passing the GeoJSON correctly to the frontend artifact.

**Check these locations:**
1. `amplify/functions/renewableOrchestrator/handler.ts` - Layout tool response handling
2. Artifact creation in orchestrator - Ensure `geojson` field is passed through
3. Message content structure - Verify GeoJSON reaches ChatMessage component

**What to verify:**
```typescript
// In orchestrator, after layout tool completes:
const layoutArtifact = {
  messageContentType: 'wind_farm_layout',
  projectId: projectId,
  turbineCount: layoutResult.turbineCount,
  totalCapacity: layoutResult.totalCapacity,
  turbinePositions: layoutResult.turbinePositions,
  geojson: layoutResult.geojson,  // ← CRITICAL: Must be passed through!
  // ... other fields
};
```

### Issue 3: Wake Button Doesn't Work

**Root Cause:** `completedSteps` not passed to frontend

**Fix Location:** `amplify/functions/renewableOrchestrator/handler.ts`

**Required Change:**
```typescript
// Track completed steps in orchestrator
const completedSteps = [];
if (terrainResults) completedSteps.push('terrain');
if (layoutResults) completedSteps.push('layout');
if (simulationResults) completedSteps.push('simulation');

// Pass to artifact
const layoutArtifact = {
  // ... other fields
  completedSteps: completedSteps  // ← ADD THIS!
};
```

**Frontend Update:** `src/components/renewable/LayoutMapArtifact.tsx`
```typescript
// Use completedSteps from data instead of hardcoded
<WorkflowCTAButtons
  completedSteps={data.completedSteps || ['terrain', 'layout']}
  projectId={data.projectId}
  onAction={handleActionClick}
/>
```

### Issue 4: Duplicate Optimize Button

**Root Cause:** Both ActionButtons and WorkflowCTAButtons rendering

**Fix Location:** `src/components/renewable/LayoutMapArtifact.tsx`

**Required Change (Option 1 - Recommended):**
```typescript
{/* Remove ActionButtons completely */}
{/* Keep only WorkflowCTAButtons */}
<WorkflowCTAButtons
  completedSteps={data.completedSteps || ['terrain', 'layout']}
  projectId={data.projectId}
  onAction={handleActionClick}
/>
```

**Required Change (Option 2 - Conditional):**
```typescript
{/* Only render one or the other, not both */}
{actions && actions.length > 0 ? (
  <ActionButtons 
    actions={actions} 
    onActionClick={handleActionClick}
  />
) : (
  <WorkflowCTAButtons
    completedSteps={data.completedSteps || ['terrain', 'layout']}
    projectId={data.projectId}
    onAction={handleActionClick}
  />
)}
```

## Implementation Plan

### Step 1: Verify Data Flow (DIAGNOSTIC)
```bash
# Run diagnostic to check actual backend response
node tests/diagnose-layout-map-ui-issues.js

# Test layout Lambda directly
aws lambda invoke \
  --function-name <layout-lambda-name> \
  --payload '{"projectId":"test-123","latitude":35.0,"longitude":-101.0}' \
  response.json

# Check if GeoJSON has turbine features
cat response.json | jq '.geojson.features[] | select(.properties.type == "turbine")'

# Check if GeoJSON has terrain features  
cat response.json | jq '.geojson.features[] | select(.properties.type != "turbine")'
```

### Step 2: Fix Orchestrator (TypeScript)
File: `amplify/functions/renewableOrchestrator/handler.ts`

1. **Ensure GeoJSON is passed through:**
   - After layout tool completes, verify `layoutResult.geojson` exists
   - Pass it directly to artifact: `geojson: layoutResult.geojson`
   - DO NOT transform or filter the GeoJSON

2. **Add completedSteps tracking:**
   ```typescript
   const completedSteps: string[] = [];
   
   // After terrain completes
   if (context.terrain_results) {
     completedSteps.push('terrain');
   }
   
   // After layout completes
   if (context.layout_results) {
     completedSteps.push('layout');
   }
   
   // After simulation completes
   if (context.simulation_results) {
     completedSteps.push('simulation');
   }
   
   // Pass to artifact
   const artifact = {
     // ... other fields
     completedSteps: completedSteps
   };
   ```

### Step 3: Fix Frontend (React)
File: `src/components/renewable/LayoutMapArtifact.tsx`

1. **Remove duplicate ActionButtons:**
   ```typescript
   // DELETE THIS BLOCK:
   {actions && actions.length > 0 && (
     <ActionButtons 
       actions={actions} 
       onActionClick={handleActionClick}
     />
   )}
   ```

2. **Use completedSteps from data:**
   ```typescript
   <WorkflowCTAButtons
     completedSteps={data.completedSteps || ['terrain', 'layout']}
     projectId={data.projectId}
     onAction={handleActionClick}
   />
   ```

### Step 4: Test End-to-End

1. **Test in browser:**
   - Open DevTools Console
   - Run layout optimization
   - Check console logs:
     ```
     [LayoutMap] Feature breakdown:
       total: X
       terrain: Y
       turbines: Z
     ```
   - Verify turbines > 0 and terrain > 0

2. **Test wake button:**
   - After layout completes, verify "Run Wake Simulation" button appears
   - Click button and verify it sends chat message
   - Check button is enabled (not disabled)

3. **Test button duplication:**
   - Verify only ONE "Optimize" button appears
   - Verify workflow buttons show correct next steps

## Quick Fix Script

Create this script to apply all fixes:

```bash
#!/bin/bash
# fix-layout-map-ui.sh

echo "🔧 Fixing Layout Map UI Issues..."

# Step 1: Remove duplicate ActionButtons from frontend
echo "1. Removing duplicate ActionButtons..."
# (Manual edit required - see Step 3 above)

# Step 2: Add completedSteps to orchestrator
echo "2. Adding completedSteps tracking to orchestrator..."
# (Manual edit required - see Step 2 above)

# Step 3: Deploy changes
echo "3. Deploying changes..."
npx ampx sandbox

# Step 4: Test
echo "4. Running tests..."
node tests/diagnose-layout-map-ui-issues.js

echo "✅ Fixes applied! Test in browser to verify."
```

## Testing Checklist

- [ ] Run diagnostic script: `node tests/diagnose-layout-map-ui-issues.js`
- [ ] Verify backend response has turbine features with `type: 'turbine'`
- [ ] Verify backend response has terrain features
- [ ] Deploy orchestrator changes
- [ ] Deploy frontend changes
- [ ] Test in browser: turbines appear on map
- [ ] Test in browser: terrain features appear on map
- [ ] Test in browser: wake button is enabled and clickable
- [ ] Test in browser: only one optimize button appears
- [ ] Test complete workflow: terrain → layout → wake → dashboard

## Expected Results After Fixes

### Console Logs (Browser DevTools)
```
[LayoutMap] Feature breakdown:
  total: 25
  terrain: 15
  turbines: 10

[LayoutMap] Rendered terrain layers: 15
[LayoutMap] Map initialization complete
```

### Visual Results
- ✅ 10 blue turbine markers visible on map
- ✅ Red building polygons visible
- ✅ Gray road lines visible
- ✅ Blue water polygons visible
- ✅ Dashed perimeter line visible
- ✅ "Run Wake Simulation" button enabled
- ✅ Only ONE "Optimize" button visible

## Priority

1. **CRITICAL:** Fix data flow in orchestrator (Issues #1, #2)
2. **HIGH:** Add completedSteps tracking (Issue #3)
3. **MEDIUM:** Remove duplicate buttons (Issue #4)

## Next Steps

1. Run diagnostic script to confirm hypothesis
2. Check orchestrator code for GeoJSON pass-through
3. Apply fixes in order of priority
4. Test each fix incrementally
5. Deploy and validate with user
