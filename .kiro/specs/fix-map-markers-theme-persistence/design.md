# Design Document

## Overview

Fix the map marker disappearing bug by ensuring well data is persisted in React state when `updateMapData()` is called. Currently, markers render correctly but disappear permanently when switching themes because `setStyle()` wipes all layers/sources and there's no data saved to restore them.

## Root Cause Analysis

**Current Flow (BROKEN):**
1. User searches for wells → `updateMapData(geoJsonData)` called
2. Function renders markers on map ✅
3. Function does NOT save `geoJsonData` to state ❌
4. User switches theme → `setStyle()` wipes all layers/sources
5. `styledata` event fires → tries to restore from `currentMapState.wellData`
6. `currentMapState.wellData` is `null` → no markers restored ❌

**Fixed Flow:**
1. User searches for wells → `updateMapData(geoJsonData)` called
2. Function saves `geoJsonData` to `currentMapState.wellData` ✅
3. Function renders markers on map ✅
4. User switches theme → `setStyle()` wipes all layers/sources
5. `styledata` event fires → checks `currentMapState.wellData`
6. `currentMapState.wellData` exists → calls `updateMapData()` to restore ✅

## Architecture

### State Management

```typescript
const [currentMapState, setCurrentMapState] = useState<{
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  wellData: any;           // ADD: Store well GeoJSON data
  weatherLayers: string[]; // ADD: Track active weather layers
}>({
  center: [106.9, 10.2],
  zoom: 5,
  pitch: 0,
  bearing: 0,
  wellData: null,          // NEW
  weatherLayers: []        // NEW
});
```

### Key Changes

**1. Save Data in `updateMapData()`**
```typescript
const updateMapData = useCallback((geoJsonData: any) => {
  // FIRST: Save data to state
  setCurrentMapState(prev => ({
    ...prev,
    wellData: geoJsonData
  }));
  
  // THEN: Render markers
  renderWellsLayer(geoJsonData);
  // ... rest of rendering logic
}, []);
```

**2. Restore Data in Theme Change Handler**
```typescript
useEffect(() => {
  if (mapRef.current) {
    // Save current state
    const currentCenter = mapRef.current.getCenter();
    // ... save other state
    
    // Update style
    mapRef.current.setStyle(newStyle);
    
    // Restore after style loads
    mapRef.current.once('styledata', () => {
      // Restore camera
      mapRef.current!.jumpTo({ center: currentCenter, ... });
      
      // Restore markers if they exist
      if (currentMapState.wellData) {
        console.log('🎨 Restoring', currentMapState.wellData.features.length, 'markers');
        updateMapData(currentMapState.wellData);
      }
      
      // Restore weather layers if active
      if (currentMapState.weatherLayers.length > 0) {
        currentMapState.weatherLayers.forEach(layer => {
          toggleWeatherLayer(layer, true);
        });
      }
    });
  }
}, [mapColorScheme]);
```

**3. Track Weather Layers**
```typescript
const toggleWeatherLayer = useCallback((layerType: string, visible: boolean) => {
  // ... existing toggle logic
  
  // Track active layers in state
  setCurrentMapState(prev => ({
    ...prev,
    weatherLayers: visible 
      ? [...prev.weatherLayers, layerType]
      : prev.weatherLayers.filter(l => l !== layerType)
  }));
}, []);
```

**4. Clear State in `clearMap()`**
```typescript
const clearMap = useCallback(() => {
  // ... existing clear logic
  
  setCurrentMapState({
    center: [106.9, 10.2],
    zoom: 5,
    pitch: 0,
    bearing: 0,
    wellData: null,        // Clear well data
    weatherLayers: []      // Clear weather layers
  });
}, []);
```

## Data Models

### GeoJSON Well Data Structure
```typescript
interface WellGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [lon, lat]
    };
    properties: {
      name: string;
      operator?: string;
      depth?: string;
      status?: string;
      [key: string]: any;
    };
  }>;
  metadata?: {
    queryType?: string;
    [key: string]: any;
  };
  weatherLayers?: {
    [layerType: string]: {
      visible: boolean;
      [key: string]: any;
    };
  };
}
```

### Map State Structure
```typescript
interface MapState {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  wellData: WellGeoJSON | null;
  weatherLayers: string[];
}
```

## Component Interactions

```
CatalogPage
    ↓
MapComponent (ref)
    ↓
updateMapData(geoJsonData)
    ↓
    ├─→ setCurrentMapState({ wellData: geoJsonData })
    ├─→ renderWellsLayer(geoJsonData)
    └─→ renderWeatherLayers(...)

Theme Change
    ↓
useEffect([mapColorScheme])
    ↓
    ├─→ Save current state
    ├─→ setStyle(newStyle)
    └─→ once('styledata')
            ↓
            ├─→ Restore camera position
            ├─→ if (wellData) → updateMapData(wellData)
            └─→ if (weatherLayers) → restore layers
```

## Error Handling

### Edge Cases

1. **No well data exists**
   - Theme change completes without errors
   - No restoration attempted

2. **Map in 3D mode**
   - Theme change preserves pitch and bearing
   - 3D button state updates correctly

3. **Polygons drawn**
   - MapLibre Draw handles polygon persistence automatically
   - No additional state management needed

4. **Multiple rapid theme changes**
   - Use functional setState to avoid stale closures
   - Each theme change waits for `styledata` before restoring

5. **Weather layers active**
   - Track active layers in state
   - Restore visibility after theme change

## Performance Considerations

1. **State Updates**
   - Use functional setState: `setCurrentMapState(prev => ({ ...prev, ... }))`
   - Avoids stale closure issues

2. **Marker Restoration**
   - Reuse existing `updateMapData()` function
   - No duplication of rendering logic

3. **Theme Transition**
   - Complete in under 1 second
   - Use `jumpTo()` for instant camera restore
   - Markers render immediately after style loads

4. **Memory Management**
   - Well data stored in state (not duplicated)
   - Cleared when `clearMap()` is called
   - No memory leaks

## Testing Strategy

### Manual Testing
1. Search for wells → verify markers appear
2. Switch theme → verify markers remain visible
3. Switch theme multiple times → verify no issues
4. Search again → verify new markers replace old ones
5. Clear map → verify state is cleared
6. Switch theme with no data → verify no errors

### Edge Case Testing
1. Theme change while in 3D mode
2. Theme change with weather layers active
3. Theme change with polygons drawn
4. Rapid theme switching
5. Theme change immediately after search

### Validation
- Check console logs for restoration messages
- Verify marker count matches before/after theme change
- Confirm no errors in console
- Test on both Light and Dark themes

## Logging Strategy

```typescript
// In updateMapData
console.log('🔄 Saving well data to state:', geoJsonData.features.length, 'wells');

// In theme change handler
console.log('🎨 Theme change:', mapColorScheme);
console.log('🎨 Current well data:', currentMapState.wellData?.features.length || 0, 'wells');

// In styledata handler
console.log('🎨 Style loaded, restoring state');
if (currentMapState.wellData) {
  console.log('🎨 Restoring', currentMapState.wellData.features.length, 'markers');
}

// After restoration
console.log('✅ Markers restored successfully');
```

## Implementation Notes

- **Minimal changes**: Only modify state management, no rendering logic changes
- **Backward compatible**: Existing functionality unchanged
- **No breaking changes**: All existing features continue working
- **Quick fix**: Can be implemented and tested in under 30 minutes
