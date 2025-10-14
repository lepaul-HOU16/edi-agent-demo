# Design Document

## Overview

This design addresses the Leaflet map loading regression in the TerrainMapArtifact component. The map was previously working but has stopped rendering, likely due to changes in the component lifecycle, import patterns, or DOM manipulation.

## Root Cause Analysis

### Potential Issues

1. **Dynamic Import Timing**: The component uses dynamic `import('leaflet')` which may be failing or timing out
2. **MapRef Availability**: The `mapRef.current` may not be available when Leaflet tries to initialize
3. **Duplicate Initialization**: The map may be trying to initialize multiple times on the same container
4. **CSS Loading**: Leaflet CSS may not be loaded before map initialization
5. **Container Dimensions**: The map container may not have proper dimensions when Leaflet initializes

### Investigation Approach

1. Check if the dynamic import is resolving correctly
2. Verify the mapRef is attached to a valid DOM element
3. Confirm the useEffect dependencies are correct
4. Check for any console errors during map initialization
5. Verify Leaflet CSS is loaded

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

### Solution 1: Improve Import Error Handling

Add error handling to the dynamic import:

```typescript
import('leaflet')
  .then((L) => {
    // Initialize map
  })
  .catch((error) => {
    console.error('Failed to load Leaflet:', error);
    // Show fallback UI
  });
```

### Solution 2: Ensure DOM Readiness

Use a more robust DOM readiness check:

```typescript
const initializeMap = () => {
  if (!mapRef.current) {
    console.warn('Map container not ready');
    return;
  }
  
  // Check if container has dimensions
  const rect = mapRef.current.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    console.warn('Map container has no dimensions');
    return;
  }
  
  // Proceed with initialization
};
```

### Solution 3: Add Fallback to Folium HTML

If Leaflet fails to load, fall back to the Folium HTML iframe:

```typescript
{data.mapHtml ? (
  <iframe srcDoc={data.mapHtml} ... />
) : data.geojson ? (
  <div ref={mapRef} ... />
) : (
  <div>Map data not available</div>
)}
```

### Solution 4: Simplify Initialization

Remove the setTimeout and use a more direct approach:

```typescript
useEffect(() => {
  if (!mapRef.current || !data.geojson || mapInstanceRef.current) {
    return;
  }

  // Initialize immediately
  import('leaflet').then((L) => {
    if (!mapRef.current) return;
    
    // Create map
    const map = L.map(mapRef.current, { ... });
    mapInstanceRef.current = map;
    
    // Add layers
    // ...
  });
}, [data.projectId, data.geojson]);
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

### Phase 1: Diagnosis (15 minutes)

1. Add debug logging to useEffect
2. Check browser console for errors
3. Verify mapRef.current exists
4. Verify Leaflet import succeeds
5. Document findings

### Phase 2: Fix Implementation (30 minutes)

1. Implement error handling for import
2. Add DOM readiness checks
3. Improve cleanup logic
4. Add fallback UI
5. Test locally

### Phase 3: Verification (15 minutes)

1. Test with real terrain data
2. Verify no console errors
3. Test all map interactions
4. Test on multiple browsers
5. Document fix

## Success Criteria

- ✅ Map loads without console errors
- ✅ Map displays all GeoJSON features
- ✅ Map interactions work (pan, zoom, click)
- ✅ Feature popups display correctly
- ✅ Layer switcher works
- ✅ No duplicate initialization
- ✅ Proper cleanup on unmount
- ✅ Graceful error handling

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
