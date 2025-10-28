# Layout Map Critical Fixes

## Issues Fixed

### 1. NO TURBINES VISIBLE ON LAYOUT MAP
**Root Cause**: Turbine features were being filtered out because they don't always have `type: 'turbine'` property. Some only have `turbine_id` or are just Point geometries.

**Fix**: Updated turbine detection logic in `LayoutMapArtifact.tsx`:
```typescript
// OLD: Only checked for type='turbine'
const turbineFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type === 'turbine'
);

// NEW: Check multiple indicators
const turbineFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type === 'turbine' || 
  f.properties?.turbine_id !== undefined ||
  f.geometry?.type === 'Point'  // Turbines are always points
);
```

### 2. PERIMETER CIRCLE BLOCKS ALL INTERACTION
**Root Cause**: Perimeter polygon was capturing all click events inside it, preventing users from clicking turbines or terrain features.

**Fix**: Made perimeter non-interactive in `LayoutMapArtifact.tsx`:
```typescript
} else if (featureType === 'perimeter') {
  style.fillColor = 'transparent';
  style.color = '#00ff00';
  style.weight = 3;
  style.dashArray = '10, 5';
  style.fillOpacity = 0;
  style.interactive = false;  // CRITICAL: Don't capture clicks
}
```

Also removed popup binding for perimeter to prevent any interaction.

### 3. TAB TEXT WRAPPING ("Overvie w" instead of "Overview")
**Root Cause**: Cloudscape tabs component was wrapping text when there wasn't enough space.

**Fix**: Added CSS to prevent wrapping in `globals.css`:
```css
/* Fix tab text wrapping */
.awsui-tabs-tab-label {
  white-space: nowrap !important;
  overflow: visible !important;
}

.awsui-tabs-tab {
  white-space: nowrap !important;
}
```

### 4. TURBINES ALWAYS USE DUMB GRID PLACEMENT
**Root Cause**: Terrain handler was returning `exclusionZones` as a flat array, but layout handler expected it structured as:
```python
{
  'buildings': [...],
  'roads': [...],
  'waterBodies': [...]
}
```

Without this structure, the layout handler couldn't find OSM features and always fell back to basic grid.

**Fix**: Updated terrain handler to return structured exclusionZones:
```python
# Structure exclusionZones for intelligent placement
structured_exclusion_zones = {
    'buildings': [],
    'roads': [],
    'waterBodies': []
}

for feature in features:
    feature_type = feature.get('properties', {}).get('type', '')
    if feature_type == 'building':
        structured_exclusion_zones['buildings'].append(feature)
    elif feature_type == 'road':
        structured_exclusion_zones['roads'].append(feature)
    elif feature_type == 'water':
        structured_exclusion_zones['waterBodies'].append(feature)

response_data = {
    'exclusionZones': structured_exclusion_zones,  # STRUCTURED
    'allFeatures': features,  # Flat array for display
    ...
}
```

## Files Changed

1. `src/components/renewable/LayoutMapArtifact.tsx`
   - Fixed turbine detection logic
   - Made perimeter non-interactive
   - Removed perimeter popup

2. `src/app/globals.css`
   - Added tab text wrapping prevention

3. `amplify/functions/renewableTools/terrain/handler.py`
   - Structured exclusionZones for intelligent placement
   - Added allFeatures for backward compatibility

## Testing Required

1. **Turbine Visibility**: Run terrain + layout, verify turbines show on map
2. **Perimeter Interaction**: Click turbines inside perimeter, verify popups work
3. **Tab Text**: Check "Overview" and "Wake Heat Map" tabs don't wrap
4. **Intelligent Placement**: Run terrain + layout, verify turbines avoid buildings/roads/water

## Deployment

```bash
# Deploy backend changes
npx ampx sandbox

# Frontend changes are automatic (Next.js)
```

## Expected Behavior After Fix

- ✅ Turbines visible as blue markers on layout map
- ✅ Can click turbines inside perimeter to see details
- ✅ Tab labels stay on one line
- ✅ Turbines intelligently placed avoiding obstacles (when OSM features exist)
- ✅ Terrain features visible on layout map (buildings, roads, water, perimeter)
