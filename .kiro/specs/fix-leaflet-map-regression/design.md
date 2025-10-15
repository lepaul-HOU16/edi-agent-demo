# Design Document

## Overview

This design addresses multiple regressions in the TerrainMapArtifact component:

**Priority 1: Feature Styling Issues**
- Water bodies not filled (should be blue with 0.4 opacity)
- Buildings not filled (should be red with 0.4 opacity)
- Features incorrectly labeled as 'way' instead of proper type
- Lost original styling from Renewables notebook reference

**Priority 2: Missing Feature Table**
- Feature list table not displaying below map

**Priority 3: Map Initialization**
- Map loading issues (if still present)

The feature styling is the highest priority as it directly impacts user ability to interpret terrain analysis results.

## Root Cause Analysis

### Priority 1: Feature Styling Issues

**Current State Analysis:**
Looking at the code (lines 329-361 in TerrainMapArtifact.tsx), the `getFeatureStyle` function exists and defines correct colors:
- Water: blue fill with 0.4 opacity
- Buildings: red fill with 0.4 opacity
- Highways: orange lines with no fill

**Potential Root Causes:**

1. **Feature Type Mismatch**: Backend may be sending `feature_type: 'way'` instead of `'water'` or `'building'`
2. **Data Pipeline Issue**: OSM data processing may not be correctly identifying feature types
3. **GeoJSON Properties**: The `properties.feature_type` field may be missing or incorrect
4. **Backend Processing**: Python terrain analysis may not be properly categorizing OSM features

**Investigation Needed:**
1. Log actual feature properties from backend data
2. Check what `feature_type` values are being received
3. Verify OSM tag processing in Python backend
4. Compare with original Renewables notebook feature identification logic

### Priority 2: Missing Feature Table

**Current State Analysis:**
The table code exists (lines 682-745) and should render when `data.exclusionZones` has items.

**Potential Root Causes:**

1. **Data Property Mismatch**: Backend may be sending features in `data.geojson.features` but not in `data.exclusionZones`
2. **Empty Array**: `data.exclusionZones` may be undefined or empty array
3. **Conditional Rendering**: The condition `{data.exclusionZones && data.exclusionZones.length > 0 && (` may be failing
4. **CSS Display Issue**: Table may be rendering but hidden by CSS

**Investigation Needed:**
1. Log `data.exclusionZones` to see if it's populated
2. Check if features are in different property
3. Verify backend is sending exclusionZones array
4. Check browser DevTools for hidden table elements

### Priority 3: Map Initialization (If Needed)

1. **Dynamic Import Timing**: The component uses dynamic `import('leaflet')` which may be failing or timing out
2. **MapRef Availability**: The `mapRef.current` may not be available when Leaflet tries to initialize
3. **Duplicate Initialization**: The map may be trying to initialize multiple times on the same container

## Architecture

### Component Structure

```
TerrainMapArtifact
├── State Management
│   ├── mapRef (useRef) - DOM reference for map container
│   ├── mapInstanceRef (useRef) - Leaflet map instance
│   └── currentPageIndex (useState) - Pagination state
├── Effects
│   ├── Popup Styles Injection (useEffect)
│   └── Map Initialization (useEffect)
└── Rendering
    ├── Container with metrics
    ├── Map container div
    └── Feature table with pagination
```

### Map Initialization Flow

```
Component Mount
    ↓
useEffect triggered (dependency: data.projectId)
    ↓
Check if mapRef.current exists
    ↓
Check if map already initialized (mapInstanceRef.current)
    ↓
Clear container and Leaflet ID
    ↓
setTimeout (100ms delay for DOM readiness)
    ↓
Dynamic import('leaflet')
    ↓
Fix Leaflet icon paths
    ↓
Create map with L.map(mapRef.current, options)
    ↓
Store in mapInstanceRef.current
    ↓
Add tile layers (satellite + OSM)
    ↓
Add center marker
    ↓
Add GeoJSON features
    ↓
Fit bounds when ready
```

## Components and Interfaces

### Key Interfaces

```typescript
interface TerrainArtifactProps {
  data: {
    messageContentType: 'wind_farm_terrain_analysis';
    projectId: string;
    coordinates: { lat: number; lng: number };
    exclusionZones: GeoJSONFeature[];
    metrics: {
      totalFeatures: number;
      featuresByType: Record<string, number>;
    };
    geojson?: {
      type: 'FeatureCollection';
      features: GeoJSONFeature[];
    };
    mapHtml?: string;
  };
}
```

### Map Container Requirements

- Must have explicit dimensions (width: 100%, height: 600px)
- Must have a valid ref attached
- Must not have existing Leaflet instance
- Must be in the DOM when Leaflet initializes

## Diagnosis Strategy

### Step 1: Add Debug Logging

Add console.log statements to track:
- When useEffect runs
- If mapRef.current exists
- If dynamic import succeeds
- If map creation succeeds
- Any errors during initialization

### Step 2: Check Import Pattern

The current pattern uses:
```typescript
import('leaflet').then((L) => {
  // Initialize map
});
```

This should work, but we need to verify:
- The import resolves
- The L object is valid
- No errors in the promise chain

### Step 3: Verify DOM Readiness

The component uses a 100ms setTimeout to ensure DOM readiness:
```typescript
const timer = setTimeout(() => {
  if (!mapRef.current) return;
  // Initialize map
}, 100);
```

This may not be sufficient if:
- The component is rendering in a modal or hidden container
- The parent container is still mounting
- CSS is still loading

### Step 4: Check for Duplicate Initialization

The component has guards against duplicate initialization:
```typescript
if (mapInstanceRef.current) {
  console.log('Map already exists, skipping re-initialization');
  return;
}
```

But this may fail if:
- The cleanup function doesn't run properly
- The mapInstanceRef is not cleared on unmount
- The component re-mounts without cleanup

## Proposed Solutions

### Priority 1: Fix Feature Styling

#### Solution 1A: Diagnose Feature Type Values

Add logging to see what feature types are actually being received:

```typescript
console.log('[TerrainMap] Feature types in data:', 
  data.geojson.features.map(f => ({
    type: f.properties?.feature_type,
    tags: f.properties?.tags,
    geometry: f.geometry?.type
  }))
);
```

#### Solution 1B: Fix Feature Type Identification

If backend is sending incorrect feature types, we need to:

1. **Check OSM tags directly** - Look at `tags.natural`, `tags.building`, `tags.waterway` to identify features
2. **Update getFeatureStyle** - Add fallback logic to check tags if feature_type is wrong
3. **Fix backend processing** - Update Python terrain analysis to correctly set feature_type

Example fix in frontend:

```typescript
const getFeatureStyle = (feature: GeoJSONFeature) => {
  const props = feature.properties || {};
  const tags = props.tags || {};
  const geometry = feature.geometry;
  
  // Determine actual feature type from tags if feature_type is wrong
  let featureType = props.feature_type;
  
  if (featureType === 'way' || !featureType) {
    // Identify from OSM tags
    if (tags.natural === 'water' || tags.waterway) {
      featureType = 'water';
    } else if (tags.building) {
      featureType = 'building';
    } else if (tags.highway) {
      featureType = 'highway';
    }
  }
  
  // Apply styling based on corrected feature type
  switch (featureType) {
    case 'water':
      return {
        fillColor: 'blue',
        color: 'darkblue',
        weight: 2,
        fillOpacity: 0.4,
        opacity: 0.8,
        fill: true  // Explicitly enable fill
      };
    case 'building':
      return {
        fillColor: 'red',
        color: 'darkred',
        weight: 2,
        fillOpacity: 0.4,
        opacity: 0.8,
        fill: true  // Explicitly enable fill
      };
    case 'highway':
      return {
        color: 'darkorange',
        weight: 3,
        fillOpacity: 0,
        opacity: 1,
        fill: false  // Explicitly disable fill
      };
    default:
      return {
        fillColor: 'purple',
        color: 'darkviolet',
        weight: 2,
        fillOpacity: 0.4,
        opacity: 0.8,
        fill: true
      };
  }
};
```

#### Solution 1C: Verify Backend Feature Processing

Check the Python terrain analysis handler to ensure it's setting feature_type correctly:

```python
# In terrain analysis Python code
for feature in osm_features:
    tags = feature.get('tags', {})
    
    # Correctly identify feature type
    if 'natural' in tags and tags['natural'] == 'water':
        feature['properties']['feature_type'] = 'water'
    elif 'waterway' in tags:
        feature['properties']['feature_type'] = 'water'
    elif 'building' in tags:
        feature['properties']['feature_type'] = 'building'
    elif 'highway' in tags:
        feature['properties']['feature_type'] = 'highway'
    else:
        feature['properties']['feature_type'] = 'other'
```

### Priority 2: Fix Missing Feature Table

#### Solution 2A: Diagnose Data Property

Add logging to check what data is available:

```typescript
console.log('[TerrainMap] Table data check:', {
  hasExclusionZones: !!data.exclusionZones,
  exclusionZonesLength: data.exclusionZones?.length,
  hasGeojson: !!data.geojson,
  geojsonFeaturesLength: data.geojson?.features?.length
});
```

#### Solution 2B: Use Correct Data Source

If `exclusionZones` is empty but `geojson.features` has data, update the table to use the correct source:

```typescript
// Use geojson.features if exclusionZones is not populated
const tableFeatures = data.exclusionZones && data.exclusionZones.length > 0 
  ? data.exclusionZones 
  : data.geojson?.features || [];

{tableFeatures.length > 0 && (
  <Box>
    <Box variant="awsui-key-label" margin={{ bottom: 'xs' }}>
      Features ({tableFeatures.length})
    </Box>
    <Table
      items={tableFeatures.slice(...)}
      // ...
    />
  </Box>
)}
```

#### Solution 2C: Fix Backend Data Structure

Ensure Python backend sends features in both properties:

```python
return {
    'geojson': geojson_data,
    'exclusionZones': geojson_data['features'],  # Duplicate for table
    'metrics': metrics
}
```

## Error Handling

### Import Errors

```typescript
try {
  const L = await import('leaflet');
  // Use L
} catch (error) {
  console.error('Leaflet import failed:', error);
  setMapError('Failed to load map library');
}
```

### Initialization Errors

```typescript
try {
  const map = L.map(mapRef.current, options);
  mapInstanceRef.current = map;
} catch (error) {
  console.error('Map initialization failed:', error);
  setMapError('Failed to initialize map');
}
```

### Graceful Degradation

If Leaflet fails:
1. Show error message to user
2. Fall back to Folium HTML if available
3. Show static image if available
4. Show "Map unavailable" message as last resort

## Testing Strategy

### Unit Tests

1. Test component renders without errors
2. Test mapRef is attached correctly
3. Test cleanup function removes map instance
4. Test error handling for missing data

### Integration Tests

1. Test with real terrain data
2. Test map interactions (pan, zoom, click)
3. Test feature popups
4. Test layer switching

### Manual Testing

1. Open terrain analysis in UI
2. Check browser console for errors
3. Verify map displays correctly
4. Test all interactions
5. Test on different browsers

## Implementation Plan

### Phase 1: Diagnose Feature Styling (10 minutes)

1. Add logging to see actual feature_type values from backend
2. Check OSM tags in feature properties
3. Verify which features are being styled incorrectly
4. Compare with original Renewables notebook logic
5. Document findings

### Phase 2: Fix Feature Styling (20 minutes)

1. Update getFeatureStyle to check OSM tags as fallback
2. Add explicit `fill: true` for water and buildings
3. Ensure feature_type is correctly identified
4. Test styling with real terrain data
5. Verify all feature types render correctly

### Phase 3: Diagnose Missing Table (5 minutes)

1. Log data.exclusionZones vs data.geojson.features
2. Check which property has the feature data
3. Verify table conditional rendering logic
4. Check browser DevTools for hidden elements

### Phase 4: Fix Missing Table (10 minutes)

1. Update table to use correct data source
2. Add fallback to geojson.features if exclusionZones empty
3. Verify table renders with all features
4. Test pagination controls
5. Verify feature data accuracy

### Phase 5: Verification (15 minutes)

1. Test with real terrain data
2. Verify water bodies are blue and filled
3. Verify buildings are red and filled
4. Verify highways are orange lines
5. Verify feature table displays all features
6. Test all interactions
7. Check browser console for errors

## Success Criteria

**Priority 1: Feature Styling**
- ✅ Water bodies render with blue fill (fillOpacity: 0.4)
- ✅ Buildings render with red fill (fillOpacity: 0.4)
- ✅ Highways render as orange lines (no fill)
- ✅ Features show correct type in popups (not 'way')
- ✅ Styling matches original Renewables notebook

**Priority 2: Feature Table**
- ✅ Feature table displays below map
- ✅ Table shows all features with correct data
- ✅ Pagination works correctly
- ✅ Feature count is accurate

**Priority 3: Map Functionality**
- ✅ Map loads without console errors
- ✅ Map displays all GeoJSON features
- ✅ Map interactions work (pan, zoom, click)
- ✅ Feature popups display correctly
- ✅ Layer switcher works

## Rollback Plan

If the fix causes issues:

1. Revert to previous component version
2. Use Folium HTML iframe as primary display
3. Disable Leaflet map temporarily
4. Investigate alternative map libraries

## Dependencies

- `leaflet` package (already installed)
- `leaflet/dist/leaflet.css` (already imported)
- React refs and hooks
- Browser DOM APIs

## Performance Considerations

- Dynamic import adds ~100ms load time
- Map initialization adds ~200ms render time
- GeoJSON processing depends on feature count
- Total time to interactive: ~500ms

## Security Considerations

- Leaflet CDN URLs for marker icons (HTTPS)
- Tile layer URLs (HTTPS)
- No user-generated content in map
- Popup content is sanitized

## Accessibility

- Map container has proper ARIA labels
- Keyboard navigation supported by Leaflet
- Screen reader support for feature information
- High contrast mode compatible
