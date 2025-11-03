# Critical Fixes Required - Wake Simulation & Intelligent Layout

## IMMEDIATE ACTIONS NEEDED

### 1. Orchestrator Fix (File: `amplify/functions/renewableOrchestrator/handler.ts`)

**Problem**: Wake simulation doesn't receive layout data from project context

**Fix**: Around line 1100-1200 where tool Lambdas are invoked, ensure `project_context` is passed:

```typescript
// Find the callToolLambdasWithFallback function
// Add project_context to the payload when calling simulation tool

const toolPayload = {
  parameters: {
    ...params,
    project_id: projectName
  },
  context: event.context,  // ADD THIS
  project_context: {       // ADD THIS ENTIRE BLOCK
    layout_results: projectData?.layout_results,
    terrain_results: projectData?.terrain_results,
    coordinates: projectData?.coordinates
  }
};
```

### 2. Layout Handler Fix (File: `amplify/functions/renewableTools/layout/handler.py`)

**Problem**: Uses basic grid, doesn't avoid OSM features, doesn't show terrain on map

**Required Changes**:

#### A. Load Terrain Data from Project Context
```python
# At start of handler, after extracting parameters:
project_context = event.get('project_context', {}) or event.get('context', {})
terrain_results = project_context.get('terrain_results', {}) or project_context.get('terrainResults', {})

# Extract exclusion zones from terrain
exclusion_zones = terrain_results.get('exclusionZones', {})
buildings = exclusion_zones.get('buildings', [])
roads = exclusion_zones.get('roads', [])
water_bodies = exclusion_zones.get('waterBodies', [])

# Get terrain GeoJSON for map display
terrain_geojson = terrain_results.get('geojson', {})
```

#### B. Implement Intelligent Placement Function
```python
def intelligent_turbine_placement(center_lat, center_lon, radius_km, exclusion_zones, spacing_m, num_turbines_target=25):
    """
    Intelligently place turbines avoiding exclusion zones
    """
    import numpy as np
    from shapely.geometry import Point, Polygon
    from shapely.ops import unary_union
    
    # Create exclusion polygons
    exclusion_polygons = []
    for zone in exclusion_zones.get('buildings', []) + exclusion_zones.get('roads', []) + exclusion_zones.get('waterBodies', []):
        if zone.get('geometry', {}).get('type') == 'Polygon':
            coords = zone['geometry']['coordinates'][0]
            poly = Polygon([(c[0], c[1]) for c in coords])
            # Buffer by 100m (safety margin)
            exclusion_polygons.append(poly.buffer(0.001))  # ~100m in degrees
    
    # Merge all exclusions
    if exclusion_polygons:
        merged_exclusions = unary_union(exclusion_polygons)
    else:
        merged_exclusions = None
    
    # Generate candidate grid (denser than final spacing)
    candidates = []
    lat_per_m = 1 / 111000
    lon_per_m = 1 / (111000 * np.cos(np.radians(center_lat)))
    
    grid_spacing = spacing_m * 0.7  # Denser candidate grid
    radius_lat = radius_km * 1000 * lat_per_m
    radius_lon = radius_km * 1000 * lon_per_m
    
    lat_steps = int(2 * radius_lat / (grid_spacing * lat_per_m))
    lon_steps = int(2 * radius_lon / (grid_spacing * lon_per_m))
    
    for i in range(lat_steps):
        for j in range(lon_steps):
            lat = center_lat - radius_lat + i * grid_spacing * lat_per_m
            lon = center_lon - radius_lon + j * grid_spacing * lon_per_m
            
            # Check if within radius
            dist = np.sqrt((lat - center_lat)**2 + (lon - center_lon)**2)
            if dist <= max(radius_lat, radius_lon):
                point = Point(lon, lat)
                
                # Check if NOT in exclusion zone
                if merged_exclusions is None or not merged_exclusions.contains(point):
                    candidates.append((lat, lon))
    
    # Apply spacing constraints - greedy selection
    selected = []
    min_spacing_deg = spacing_m * lat_per_m
    
    for candidate in candidates:
        # Check spacing from all selected turbines
        too_close = False
        for selected_turbine in selected:
            dist = np.sqrt((candidate[0] - selected_turbine[0])**2 + 
                          (candidate[1] - selected_turbine[1])**2)
            if dist < min_spacing_deg:
                too_close = True
                break
        
        if not too_close:
            selected.append(candidate)
            
            if len(selected) >= num_turbines_target:
                break
    
    return selected
```

#### C. Create Map with Terrain Features
```python
# After generating turbine positions, create comprehensive GeoJSON

# Start with terrain features
all_features = []

# Add terrain features if available
if terrain_geojson and terrain_geojson.get('features'):
    for feature in terrain_geojson['features']:
        # Add terrain features with styling
        feature_copy = feature.copy()
        feature_type = feature.get('properties', {}).get('type', 'unknown')
        
        # Add visual properties
        if feature_type == 'building':
            feature_copy['properties']['fill'] = '#ff0000'
            feature_copy['properties']['fill-opacity'] = 0.3
        elif feature_type == 'road':
            feature_copy['properties']['stroke'] = '#666666'
            feature_copy['properties']['stroke-width'] = 2
        elif feature_type == 'water':
            feature_copy['properties']['fill'] = '#0000ff'
            feature_copy['properties']['fill-opacity'] = 0.4
        
        all_features.append(feature_copy)

# Add turbine features
for i, (lat, lon) in enumerate(turbine_positions):
    turbine_feature = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [lon, lat]
        },
        'properties': {
            'type': 'turbine',
            'id': f'T{i+1:02d}',
            'capacity_MW': 2.5,
            'marker-color': '#00ff00',
            'marker-size': 'large',
            'marker-symbol': 'wind-turbine'
        }
    }
    all_features.append(turbine_feature)

# Create final GeoJSON
layout_geojson = {
    'type': 'FeatureCollection',
    'features': all_features
}
```

### 3. Deployment

After making these changes:

```bash
# The changes will be picked up by the sandbox automatically
# Just wait for the sandbox to detect and redeploy

# Or restart sandbox if needed:
# Ctrl+C to stop
# npx ampx sandbox
```

### 4. Testing

```
1. "analyze terrain at 32.7767, -96.797"
2. "optimize turbine layout"  
   → Should use intelligent placement
   → Map should show buildings/roads/water + turbines
3. "run wake simulation"
   → Should work now with layout data
```

## Why These Fixes Work

1. **Orchestrator fix**: Explicitly passes project_context so simulation Lambda can access layout data
2. **Intelligent placement**: Uses Shapely library to avoid OSM exclusion zones
3. **Terrain map integration**: Combines terrain GeoJSON with turbine positions in single map

## Files to Modify

1. `amplify/functions/renewableOrchestrator/handler.ts` - Add project_context to tool invocation
2. `amplify/functions/renewableTools/layout/handler.py` - Complete rewrite of layout generation logic

These are the ONLY two files that need changes to fix both issues.
