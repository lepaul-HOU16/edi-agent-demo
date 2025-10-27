# Perimeter Circle Colors Explained

## What You're Seeing

You have **TWO dashed circles** on the map:

### 🟢 Green Dashed Circle
- **Source:** Perimeter feature with `properties.type = 'perimeter'`
- **Color:** `#00ff00` (bright green)
- **Style:** 3px dashed line (10px dash, 5px gap)
- **Purpose:** Site boundary/perimeter
- **Code location:** `LayoutMapArtifact.tsx` line ~293

### 🟣 Purple/Gray Dashed Circle  
- **Source:** Unknown - likely a SECOND perimeter feature with different type
- **Color:** `#999999` (gray, appears purplish on satellite)
- **Style:** Default polygon style
- **Problem:** This is a duplicate perimeter!

## Why Two Circles?

The backend is likely creating TWO perimeter features:

1. **Terrain Lambda** creates a perimeter → Stored in terrain context
2. **Layout Lambda** creates ANOTHER perimeter → Merged with terrain features
3. **Result:** Both perimeters end up in the final GeoJSON

## How to Fix

### Option 1: Remove Duplicate in Backend (Recommended)

**File:** `amplify/functions/renewableTools/layout/handler.py`

Around line 356-388, when merging terrain features:

```python
# CRITICAL: Include terrain features from OSM in the layout map
if terrain_geojson and terrain_geojson.get('features'):
    logger.info(f"📍 Adding {len(terrain_geojson['features'])} terrain features to layout map")
    for terrain_feature in terrain_geojson['features']:
        # Copy terrain feature and add styling
        feature_copy = terrain_feature.copy()
        feature_type = feature_copy.get('properties', {}).get('type', 'unknown')
        
        # SKIP PERIMETER - we'll create our own
        if feature_type == 'perimeter':
            continue  # ← ADD THIS LINE
        
        # ... rest of code
```

### Option 2: Style Both the Same (Quick Fix)

Make the default polygon style also green:

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

```typescript
} else {
  // Default polygon style - make it green too
  style.fillColor = 'transparent';
  style.color = '#00ff00';  // Green like perimeter
  style.weight = 3;
  style.dashArray = '10, 5';
  style.fillOpacity = 0;
}
```

### Option 3: Filter in Frontend

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

```typescript
// Separate terrain features from turbine features
const terrainFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type !== 'turbine' && 
  f.properties?.type !== 'perimeter'  // ← Skip perimeter
);

// Then add only ONE perimeter at the end
const perimeterFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type === 'perimeter'
);

// Render only the first perimeter
if (perimeterFeatures.length > 0) {
  // Render perimeterFeatures[0] only
}
```

## Recommended Action

**Use Option 1** - Fix in backend to prevent duplicate perimeters from being created in the first place.

This is cleaner and prevents the issue at the source.

## Testing

After fix, you should see:
- ✅ ONE green dashed circle (perimeter)
- ✅ Red building polygons
- ✅ Gray road lines  
- ✅ Blue water polygons
- ✅ Blue turbine markers

## Current Status

- ✅ Perimeter color changed to green
- ✅ Duplicate ActionButtons removed
- ⏳ Need to fix duplicate perimeter (choose option above)
- ⏳ Need to verify GeoJSON data flow from backend
