# OSM Features & Perimeter Display Fixes

## Issues to Fix

### 1. OSM Features Not Showing on Layout Map ❌
**Expected:** Buildings, roads, water bodies from OpenStreetMap should display on the layout map
**Current:** OSM features may not be visible or rendering properly

### 2. Perimeter Needs Buffer/Shading ❌
**Expected:** Perimeter should have a thick, shaded buffer zone (like a corridor)
**Current:** Perimeter is just a thin dashed line

## Root Cause Analysis

### Issue 1: OSM Features Display

Looking at the code, I can see:
- ✅ Backend correctly includes OSM features in GeoJSON (line 356-388 in layout/handler.py)
- ✅ Frontend correctly filters and renders OSM features (LayoutMapArtifact.tsx)
- ❓ **Possible Issue:** OSM features might be rendering UNDER the basemap tiles

**The Problem:** Leaflet renders layers in the order they're added. If the satellite/OSM basemap is added AFTER the terrain features, it covers them up!

### Issue 2: Perimeter Buffer

Current perimeter styling (LayoutMapArtifact.tsx, line ~320):
```typescript
else if (featureType === 'perimeter') {
  style.fillColor = 'transparent';
  style.color = '#333333';
  style.weight = 3;
  style.dashArray = '10, 5';
  style.fillOpacity = 0;
}
```

**The Problem:** 
- `fillOpacity = 0` makes it invisible
- `weight = 3` is too thin
- No buffer zone around the perimeter line

## Fixes Required

### Fix 1: Ensure OSM Features Render on Top of Basemap

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

**Current rendering order:**
1. Create map
2. Add satellite basemap ← This covers everything!
3. Add terrain features (buildings, roads, water)
4. Add turbine markers

**Fixed rendering order:**
1. Create map
2. Add satellite basemap
3. **Re-add terrain features AFTER basemap** ← Key fix!
4. Add turbine markers

**Code Change:**
```typescript
// After adding basemap and layer control (around line 270)
satelliteLayer.addTo(map);

// Add layer control
L.control.layers(
  {
    'Satellite': satelliteLayer,
    'Street Map': osmLayer,
  },
  {},
  { position: 'topright' }
).addTo(map);

// NOW render terrain features (they'll be on top of basemap)
const terrainFeatures = data.geojson.features.filter((f: any) => 
  f.properties?.type !== 'turbine'
);

// ... rest of terrain rendering code
```

### Fix 2: Add Perimeter Buffer Zone

**File:** `src/components/renewable/LayoutMapArtifact.tsx`

**Option A: Use Leaflet Buffer (Recommended)**

Create a buffer polygon around the perimeter line:

```typescript
else if (featureType === 'perimeter') {
  // Create a buffer zone around the perimeter
  // For a polygon, we can use a semi-transparent fill with a border
  
  style.fillColor = '#333333';      // Dark gray fill
  style.fillOpacity = 0.1;          // Very light shading
  style.color = '#333333';          // Dark border
  style.weight = 3;                 // Thicker border
  style.dashArray = '10, 5';        // Dashed pattern
  
  // Add a second layer for the buffer zone
  const bufferStyle = {
    fillColor: '#ffcc00',           // Yellow/orange buffer
    fillOpacity = 0.15;             // Light shading
    color: '#ffcc00',               // Yellow border
    weight: 8,                      // Thick buffer
    opacity: 0.3
  };
  
  // Render both the perimeter line and buffer
  const perimeterLayer = L.geoJSON(feature, { style: style }).addTo(map);
  const bufferLayer = L.geoJSON(feature, { style: bufferStyle }).addTo(map);
  
  terrainLayers.push(perimeterLayer, bufferLayer);
}
```

**Option B: Use Thick Semi-Transparent Line (Simpler)**

```typescript
else if (featureType === 'perimeter') {
  // Thick, semi-transparent line with shading effect
  style.fillColor = 'transparent';
  style.color = '#ff6600';          // Orange color
  style.weight = 15;                // Much thicker!
  style.opacity = 0.4;              // Semi-transparent
  style.dashArray = '20, 10';       // Larger dashes
  
  // Add a second layer underneath for shadow effect
  const shadowStyle = {
    color: '#333333',
    weight: 20,
    opacity: 0.2,
    dashArray: '20, 10'
  };
  
  const shadowLayer = L.geoJSON(feature, { style: shadowStyle }).addTo(map);
  const perimeterLayer = L.geoJSON(feature, { style: style }).addTo(map);
  
  terrainLayers.push(shadowLayer, perimeterLayer);
}
```

**Option C: Use Polygon Buffer (Most Visual)**

If the perimeter is a polygon, expand it outward:

```typescript
else if (featureType === 'perimeter') {
  // Main perimeter line
  style.fillColor = 'transparent';
  style.color = '#333333';
  style.weight = 3;
  style.dashArray = '10, 5';
  style.fillOpacity = 0;
  
  const perimeterLayer = L.geoJSON(feature, { style: style }).addTo(map);
  
  // Create a buffer zone (shaded area around perimeter)
  // This requires turf.js or similar for actual buffering
  // For now, we can use a semi-transparent fill on the polygon itself
  if (geometry.type === 'Polygon') {
    const bufferStyle = {
      fillColor: '#ffcc00',
      fillOpacity: 0.15,
      color: '#ffcc00',
      weight: 1,
      opacity: 0.3
    };
    
    const bufferLayer = L.geoJSON(feature, { style: bufferStyle }).addTo(map);
    terrainLayers.push(bufferLayer);
  }
  
  terrainLayers.push(perimeterLayer);
}
```

### Fix 3: Add Legend Entry for Perimeter Buffer

Update the legend to show the perimeter buffer:

```typescript
if (hasPerimeter) {
  html += '<div style="margin-bottom: 4px;">';
  html += '<span style="display: inline-block; width: 16px; height: 12px; ';
  html += 'background-color: rgba(255,204,0,0.15); ';  // Buffer color
  html += 'border: 2px dashed #333333; ';              // Perimeter line
  html += 'margin-right: 6px;"></span>';
  html += 'Site Perimeter & Buffer Zone';
  html += '</div>';
}
```

## Implementation Steps

### Step 1: Fix OSM Feature Rendering Order
1. Open `src/components/renewable/LayoutMapArtifact.tsx`
2. Find where basemap is added (around line 260)
3. Ensure terrain features are rendered AFTER basemap
4. Test: OSM features should now be visible on top of satellite imagery

### Step 2: Add Perimeter Buffer Styling
1. Find perimeter styling code (around line 320)
2. Implement Option B (thick semi-transparent line) - simplest and most effective
3. Add shadow layer for depth effect
4. Test: Perimeter should now have a thick, visible buffer zone

### Step 3: Update Legend
1. Find legend creation code (around line 450)
2. Update perimeter legend entry to show buffer
3. Test: Legend should indicate buffer zone

### Step 4: Test Both Maps
1. Test terrain analysis map - should show perimeter with buffer
2. Test layout map - should show OSM features + perimeter with buffer
3. Verify all features are visible and properly styled

## Expected Visual Results

### Before Fix:
- Thin dashed perimeter line (hard to see)
- OSM features hidden under basemap
- No visual indication of buffer zone

### After Fix:
- **Thick, semi-transparent perimeter line** (15-20px wide)
- **Shadow effect** for depth
- **OSM features visible** on top of basemap:
  - Red buildings with 500m setback
  - Gray roads
  - Blue water bodies
- **Clear buffer zone** around perimeter
- **Updated legend** showing all features

## Testing Checklist

- [ ] OSM buildings appear as red polygons on layout map
- [ ] OSM roads appear as gray lines on layout map
- [ ] OSM water bodies appear as blue polygons on layout map
- [ ] Perimeter has thick, visible buffer (not just thin line)
- [ ] Perimeter buffer is semi-transparent (can see through it)
- [ ] Perimeter has shadow effect for depth
- [ ] All features visible on both terrain and layout maps
- [ ] Legend shows perimeter buffer zone
- [ ] Turbines still render on top of everything
- [ ] Map is interactive (can zoom, pan, click features)

## Code Files to Modify

1. **`src/components/renewable/LayoutMapArtifact.tsx`**
   - Fix rendering order (OSM features after basemap)
   - Add perimeter buffer styling
   - Update legend

## Estimated Time

- Fix 1 (OSM rendering order): 15 minutes
- Fix 2 (Perimeter buffer): 30 minutes
- Fix 3 (Legend update): 10 minutes
- Testing: 15 minutes
- **Total: ~1 hour**

## Notes

- The perimeter buffer should be visually distinct but not overwhelming
- Use semi-transparent colors so underlying features are still visible
- Consider adding a toggle to show/hide buffer zone
- May need to adjust buffer width based on zoom level
