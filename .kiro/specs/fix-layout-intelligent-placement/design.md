# Design: Fix Layout Intelligent Placement

## Overview
Fix the data flow from terrain analysis to layout optimization so the intelligent placement algorithm receives OSM exclusion zones and can avoid terrain constraints. Ensure OSM features are displayed on the layout map alongside turbines.

## Architecture

### Data Flow
```
Terrain Analysis → Project Context → Layout Optimization → Frontend Map
     (OSM data)    (exclusionZones)   (intelligent placement)  (combined display)
```

### Current Issues
1. **Terrain data not reaching layout**: exclusionZones are empty when layout runs
2. **OSM features not on map**: Only turbines shown, terrain features missing
3. **Grid fallback triggered**: Algorithm falls back to grid due to no constraints

## Components and Interfaces

### 1. Orchestrator Context Management
**File**: `amplify/functions/renewableOrchestrator/handler.ts`

**Changes**:
- Ensure `terrain_results` is stored in context after terrain analysis
- Pass complete `terrain_results` (including exclusionZones) to layout Lambda
- Log context structure for debugging

### 2. Layout Handler Data Reception
**File**: `amplify/functions/renewableTools/layout/simple_handler.py`

**Current Code** (lines 238-244):
```python
project_context = event.get('project_context', {})
terrain_results = project_context.get('terrain_results', {})
terrain_geojson = terrain_results.get('geojson', {})
terrain_features = terrain_geojson.get('features', [])
exclusion_zones = terrain_results.get('exclusionZones', {})
```

**Issue**: This code is correct, but `terrain_results` is empty in context

### 3. GeoJSON Merging
**File**: `amplify/functions/renewableTools/layout/simple_handler.py`

**Current Code** (lines 330-335):
```python
all_features = terrain_features + turbine_features
combined_geojson = {
    'type': 'FeatureCollection',
    'features': all_features
}
```

**Issue**: This code is correct and already merges features!

## Root Cause Analysis

The code for merging OSM features with turbines ALREADY EXISTS and is correct. The issue is that `terrain_features` is empty because `terrain_results` is not in the project context when layout runs.

### Investigation Needed
1. Check if terrain analysis stores results in context
2. Check if orchestrator retrieves terrain results from context before calling layout
3. Verify context structure matches what layout handler expects

## Data Models

### Terrain Results Structure
```typescript
{
  geojson: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: {...}, properties: { type: 'building' } },
      { type: 'Feature', geometry: {...}, properties: { type: 'road' } },
      ...
    ]
  },
  exclusionZones: {
    buildings: [...],
    roads: [...],
    waterBodies: [...]
  }
}
```

### Layout Response GeoJSON
```typescript
{
  type: 'FeatureCollection',
  features: [
    ...terrain_features,  // OSM features from terrain analysis
    ...turbine_features   // Generated turbine positions
  ]
}
```

## Implementation Plan

### Phase 1: Diagnose Context Flow
1. Add logging to orchestrator to show context structure
2. Add logging to layout handler to show received context
3. Identify where terrain_results is lost

### Phase 2: Fix Context Passing
1. Ensure terrain results are stored in context after terrain analysis
2. Ensure context is passed correctly to layout Lambda
3. Verify exclusionZones structure matches expectations

### Phase 3: Verify Map Display
1. Confirm GeoJSON merging code works (it should already)
2. Test that frontend displays both turbines and terrain features
3. Verify different markers for different feature types

## Testing Strategy
1. Run terrain analysis and capture context
2. Run layout optimization and verify it receives terrain data
3. Check that intelligent placement algorithm receives exclusionZones
4. Verify layout map shows both turbines and OSM features
5. Confirm turbines avoid buildings/roads/water
