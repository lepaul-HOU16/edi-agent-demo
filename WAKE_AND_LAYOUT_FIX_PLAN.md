# Wake Simulation and Intelligent Layout Fix Plan

## Issues Identified

### Issue 1: Wake Simulation Fails After Layout
**Symptom**: "Tool execution failed. Please check the parameters and try again."

**Root Cause**: The orchestrator is not correctly passing layout data from project context to the simulation Lambda.

**Location**: 
- `amplify/functions/renewableOrchestrator/handler.ts` - Project context handling
- `amplify/functions/renewableTools/simulation/handler.py` - Layout parameter validation

### Issue 2: Layout Not Using Intelligent Placement
**Symptom**: Layout uses basic grid instead of OSM-aware intelligent placement

**Root Cause**: Layout handler generates simple grid without considering terrain exclusion zones

**Location**: `amplify/functions/renewableTools/layout/handler.py`

### Issue 3: Layout Map Missing Terrain Features
**Symptom**: Layout map doesn't show buildings, roads, water bodies from terrain analysis

**Root Cause**: Layout handler doesn't include OSM features from terrain results in the map

## Fix Strategy

### Fix 1: Orchestrator Context Passing

**File**: `amplify/functions/renewableOrchestrator/handler.ts`

**Changes**:
1. Ensure `event.context` includes full project data when calling simulation Lambda
2. Pass `project_context` parameter explicitly to simulation tool
3. Add logging to verify context is being passed

**Implementation**:
```typescript
// When calling simulation tool, ensure context is passed
const toolPayload = {
  parameters: {
    ...intent.params,
    project_id: projectName
  },
  project_context: {
    layout_results: projectData.layout_results,
    terrain_results: projectData.terrain_results,
    coordinates: projectData.coordinates
  }
};
```

### Fix 2: Intelligent Layout Placement

**File**: `amplify/functions/renewableTools/layout/handler.py`

**Changes**:
1. Load terrain results from project context
2. Extract OSM exclusion zones (buildings, roads, water)
3. Implement intelligent placement algorithm that:
   - Avoids exclusion zones
   - Maintains minimum spacing
   - Maximizes turbine count within constraints
   - Uses smart grid with obstacle avoidance

**Algorithm**:
```python
def intelligent_turbine_placement(center_lat, center_lon, radius_km, exclusion_zones, spacing_m):
    """
    Place turbines intelligently avoiding exclusion zones
    
    1. Create candidate grid points
    2. Filter out points in exclusion zones
    3. Apply minimum spacing constraints
    4. Select optimal positions
    """
    # Generate dense candidate grid
    candidates = generate_candidate_grid(center_lat, center_lon, radius_km, spacing_m / 2)
    
    # Filter candidates not in exclusion zones
    valid_candidates = [c for c in candidates if not in_exclusion_zone(c, exclusion_zones)]
    
    # Apply spacing constraints and select turbines
    selected_turbines = apply_spacing_constraints(valid_candidates, spacing_m)
    
    return selected_turbines
```

### Fix 3: Layout Map with Terrain Features

**File**: `amplify/functions/renewableTools/layout/handler.py`

**Changes**:
1. Load terrain GeoJSON from project context
2. Include all OSM features in layout map
3. Add turbine positions as a separate layer
4. Use different colors/styles for:
   - Buildings (red)
   - Roads (gray)
   - Water bodies (blue)
   - Turbines (green markers)

**Map Structure**:
```python
layout_map = {
    "type": "FeatureCollection",
    "features": [
        # OSM features from terrain (buildings, roads, water)
        ...terrain_features,
        # Turbine positions (new layer)
        ...turbine_features
    ]
}
```

## Implementation Order

1. **First**: Fix orchestrator context passing (enables wake simulation)
2. **Second**: Implement intelligent placement algorithm
3. **Third**: Add terrain features to layout map
4. **Fourth**: Test complete workflow

## Testing Plan

1. Run terrain analysis
2. Run layout optimization (should use intelligent placement)
3. Verify layout map shows OSM features + turbines
4. Run wake simulation (should work with layout data)
5. Verify wake simulation completes successfully

## Success Criteria

- ✅ Wake simulation runs successfully after layout optimization
- ✅ Layout uses intelligent placement avoiding buildings/roads/water
- ✅ Layout map displays all terrain features from OSM
- ✅ Turbines are placed optimally within constraints
- ✅ Complete workflow: terrain → layout → wake simulation works end-to-end
