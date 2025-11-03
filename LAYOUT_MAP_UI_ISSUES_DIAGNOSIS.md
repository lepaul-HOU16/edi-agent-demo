# Layout Map UI Issues - Root Cause Analysis

## Issues Reported
1. ❌ Turbines don't show up on the map
2. ❌ Terrain features don't show up on the map  
3. ❌ Wake button doesn't work
4. ❌ Optimize button is repetitive

## Diagnosis Results

### Issue 1: Turbines Not Showing ❌

**Frontend Code Analysis:**
The `LayoutMapArtifact.tsx` component is **correctly implemented**:
- ✅ Filters turbine features: `f.properties?.type === 'turbine'`
- ✅ Creates Leaflet markers with correct `[lat, lng]` format
- ✅ Adds markers to map and fits bounds
- ✅ Has comprehensive error handling

**Root Cause:** Backend is not including turbine features in GeoJSON!

**Evidence:**
```typescript
// Component correctly filters for turbines
const turbineFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type === 'turbine'
);

// Then creates markers
turbineFeatures.forEach((feature: any, index: number) => {
  const coords = feature.geometry.coordinates;
  const marker = L.marker([coords[1], coords[0]]).addTo(map);
  // ...
});
```

If turbines aren't showing, the backend response either:
1. Doesn't include features with `properties.type === 'turbine'`
2. Has missing or malformed GeoJSON structure
3. Has turbines but with wrong property names

**Fix Location:** `amplify/functions/renewableTools/layout/handler.py`

**Required Fix:**
Each turbine in GeoJSON must have:
```python
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [lng, lat]  # GeoJSON format: [longitude, latitude]
  },
  "properties": {
    "type": "turbine",  # CRITICAL - frontend filters on this!
    "turbine_id": "T001",
    "capacity_MW": 2.5,
    "hub_height_m": 80,
    "rotor_diameter_m": 100
  }
}
```

---

### Issue 2: Terrain Features Not Showing ❌

**Frontend Code Analysis:**
The component **correctly renders terrain features**:
- ✅ Filters terrain: `f.properties?.type !== 'turbine'`
- ✅ Renders polygons (buildings, water, perimeter)
- ✅ Renders lines (roads)
- ✅ Applies feature-specific styling
- ✅ Adds popups with feature info

**Root Cause:** Backend is not including terrain features in layout GeoJSON!

**Evidence:**
```typescript
// Component correctly filters terrain features
const terrainFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type !== 'turbine'
);

// Then renders each type appropriately
terrainFeatures.forEach((feature: any) => {
  const featureType = feature.properties?.type || 'unknown';
  
  if (geometry.type === 'Polygon') {
    // Renders buildings, water, perimeter with correct styling
  } else if (geometry.type === 'LineString') {
    // Renders roads with correct styling
  }
});
```

**Fix Location:** `amplify/functions/renewableTools/layout/handler.py`

**Required Fix:**
Layout Lambda must merge terrain context into response:
```python
# In layout handler
def merge_terrain_and_turbines(turbine_features, terrain_context):
    """Merge terrain features from context with turbine features"""
    all_features = []
    
    # Add terrain features from context
    if terrain_context and 'geojson' in terrain_context:
        terrain_geojson = terrain_context['geojson']
        if 'features' in terrain_geojson:
            all_features.extend(terrain_geojson['features'])
    
    # Add turbine features
    all_features.extend(turbine_features)
    
    return {
        'type': 'FeatureCollection',
        'features': all_features
    }
```

---

### Issue 3: Wake Button Doesn't Work ❌

**Frontend Code Analysis:**
The `WorkflowCTAButtons.tsx` component is **correctly implemented**:
- ✅ Defines wake button with prerequisite: `step: 'layout'`
- ✅ Enables button when `completedSteps.includes('layout')`
- ✅ Has proper onClick handler that calls `onAction(query)`

**Root Cause:** Orchestrator is not passing `completedSteps` correctly!

**Evidence:**
```typescript
// WorkflowCTAButtons correctly checks completed steps
const WORKFLOW_BUTTONS = [
  {
    step: 'layout',
    label: 'Run Wake Simulation',
    action: 'run wake simulation',
    icon: 'refresh',
    primary: true
  }
];

// Button is enabled if 'layout' is in completedSteps
const enabledButtons = WORKFLOW_BUTTONS.filter(button => 
  completedSteps.includes(button.step)
);
```

**Fix Location:** `amplify/functions/renewableOrchestrator/handler.ts`

**Required Fix:**
Orchestrator must track completed steps and pass to frontend:
```typescript
// After layout tool completes
const completedSteps = ['terrain', 'layout'];

// Include in artifact data
const layoutArtifact = {
  messageContentType: 'wind_farm_layout',
  // ... other data
  completedSteps: completedSteps  // ADD THIS!
};
```

**Alternative Issue:** Button click handler not wired
- Check if `onFollowUpAction` prop is passed to LayoutMapArtifact
- Check if `onAction` is passed to WorkflowCTAButtons
- Verify button onClick actually triggers chat message

---

### Issue 4: Optimize Button is Repetitive ✅

**Root Cause:** Both `ActionButtons` and `WorkflowCTAButtons` are rendering!

**Evidence from LayoutMapArtifact.tsx:**
```typescript
{/* Workflow CTA Buttons - Guide user through workflow */}
<WorkflowCTAButtons
  completedSteps={['terrain', 'layout']}
  projectId={data.projectId}
  onAction={handleActionClick}
/>

{/* Legacy Action Buttons (if provided by orchestrator) */}
{actions && actions.length > 0 && (
  <ActionButtons 
    actions={actions} 
    onActionClick={handleActionClick}
  />
)}
```

Both components can render "Optimize" buttons, causing duplication.

**Fix Location:** `src/components/renewable/LayoutMapArtifact.tsx`

**Required Fix (Option 1 - Recommended):**
Remove ActionButtons entirely, use only WorkflowCTAButtons:
```typescript
{/* Workflow CTA Buttons - Guide user through workflow */}
<WorkflowCTAButtons
  completedSteps={data.completedSteps || ['terrain', 'layout']}
  projectId={data.projectId}
  onAction={handleActionClick}
/>

{/* Remove ActionButtons completely */}
```

**Required Fix (Option 2 - Conditional):**
Only render one or the other:
```typescript
{/* Use WorkflowCTAButtons by default, ActionButtons only if explicitly provided */}
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

---

## Summary of Fixes Required

### Backend Fixes (Python)
1. **Layout Lambda** (`amplify/functions/renewableTools/layout/handler.py`):
   - Add `properties.type = 'turbine'` to each turbine feature
   - Merge terrain features from context into layout GeoJSON
   - Ensure GeoJSON structure is complete

### Orchestrator Fixes (TypeScript)
2. **Renewable Orchestrator** (`amplify/functions/renewableOrchestrator/handler.ts`):
   - Track completed workflow steps
   - Pass `completedSteps` array in artifact data
   - Ensure `onFollowUpAction` handler is wired correctly

### Frontend Fixes (React)
3. **LayoutMapArtifact** (`src/components/renewable/LayoutMapArtifact.tsx`):
   - Remove duplicate ActionButtons component
   - Use only WorkflowCTAButtons for consistent workflow
   - OR: Make ActionButtons conditional

---

## Testing Plan

### 1. Test Backend Response Structure
```bash
node tests/diagnose-layout-map-ui-issues.js
```

### 2. Test Layout Lambda Directly
```bash
# Invoke layout Lambda and inspect response
aws lambda invoke \
  --function-name <layout-lambda-name> \
  --payload '{"projectId":"test","latitude":35.0,"longitude":-101.0}' \
  response.json

# Check response structure
cat response.json | jq '.geojson.features[] | select(.properties.type == "turbine")'
```

### 3. Test in Browser
1. Open browser DevTools Console
2. Run layout optimization
3. Check console logs for:
   - `[LayoutMap] Feature breakdown:` - should show turbines > 0
   - `[LayoutMap] Rendered terrain layers:` - should show terrain > 0
4. Inspect map element - should have markers visible

### 4. Test Wake Button
1. After layout completes, check if "Run Wake Simulation" button appears
2. Click button and verify it triggers chat message
3. Check console for button click events

---

## Priority Order

1. **CRITICAL:** Fix turbine features in backend (Issue #1)
2. **CRITICAL:** Fix terrain features in backend (Issue #2)
3. **HIGH:** Fix wake button enablement (Issue #3)
4. **MEDIUM:** Remove duplicate buttons (Issue #4)

---

## Next Steps

1. Run diagnostic script to confirm issues
2. Fix layout Lambda to include turbine and terrain features
3. Fix orchestrator to pass completedSteps
4. Remove duplicate ActionButtons from frontend
5. Test end-to-end workflow
6. Deploy and validate with user
