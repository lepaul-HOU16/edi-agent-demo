# Map NaN LngLat Crash Fix - Bugfix Design

## Overview

The map crashes with `Invalid LngLat object: (NaN, NaN)` when well records have missing, null, undefined, or NaN coordinates. The root cause is twofold: (1) `CatalogPage.tsx` uses `record.longitude || 0` which doesn't catch `NaN` and feeds it into GeoJSON features and bounds calculations, and (2) `MapComponent.tsx` has zero validation before passing coordinates to maplibre-gl APIs (`LngLatBounds.extend`, `fitBounds`, `setCenter`, `jumpTo`). The fix adds coordinate validation at both the data-production layer (CatalogPage) and the data-consumption layer (MapComponent) for defense-in-depth.

## Glossary

- **Bug_Condition (C)**: Any coordinate value that is `NaN`, `null`, `undefined`, `Infinity`, or `-Infinity` reaching a maplibre-gl API call
- **Property (P)**: All coordinates passed to maplibre-gl APIs must be finite numbers; invalid coordinates are silently filtered out
- **Preservation**: Valid well data with finite coordinates must continue to render on the map, fit bounds, and restore state exactly as before
- **`fitBoundsToFeatures`**: Inner function in `MapComponent.tsx` `updateMapData` that collects coordinates from GeoJSON features and calls `LngLatBounds.extend` / `setCenter`
- **`fitBounds`**: Exposed method on `MapComponentRef` that creates `LngLatBounds` from `{minLon, maxLon, minLat, maxLat}` and calls `map.fitBounds`
- **`restoreMapState`**: Exposed method on `MapComponentRef` that calls `map.jumpTo` with a center `[lng, lat]` and zoom
- **`record.longitude || 0`**: The faulty fallback pattern in `CatalogPage.tsx` that passes `NaN` through because `NaN || 0` evaluates to `0` only when the value is falsy — but `NaN` IS falsy, so the real issue is when the field is a non-NaN truthy value that later becomes NaN through computation, or when the field is literally the number `NaN` from a parsed API response

## Bug Details

### Fault Condition

The bug manifests when catalog search results contain well records where `longitude` or `latitude` is `NaN`, `null`, `undefined`, or non-finite. The `CatalogPage.tsx` GeoJSON construction uses `record.longitude || 0` / `record.latitude || 0` which does NOT reliably catch `NaN` from parsed numeric fields. These invalid coordinates propagate into GeoJSON features, bounds calculations (`Math.min`/`Math.max` return `NaN` when any input is `NaN`), and map state — ultimately crashing maplibre-gl.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { records: WellRecord[], mapAction: 'updateMapData' | 'fitBounds' | 'restoreMapState' }
  OUTPUT: boolean

  FOR ANY record IN input.records:
    lng := record.longitude
    lat := record.latitude
    IF NOT isFinite(lng) OR NOT isFinite(lat) THEN
      RETURN true   // At least one record has invalid coordinates
    END IF
  END FOR

  IF input.mapAction == 'fitBounds' THEN
    bounds := input.bounds
    IF NOT isFinite(bounds.minLon) OR NOT isFinite(bounds.maxLon)
       OR NOT isFinite(bounds.minLat) OR NOT isFinite(bounds.maxLat) THEN
      RETURN true
    END IF
  END IF

  IF input.mapAction == 'restoreMapState' THEN
    center := input.state.center
    IF NOT isFinite(center[0]) OR NOT isFinite(center[1]) THEN
      RETURN true
    END IF
  END IF

  RETURN false
END FUNCTION
```

### Examples

- Well record `{ name: "Well-A", longitude: NaN, latitude: 10.5 }` → `coordinates: [NaN, 10.5]` → `LngLatBounds.extend([NaN, 10.5])` → crash: `Invalid LngLat object: (NaN, 10.5)`
- Well record `{ name: "Well-B", longitude: undefined, latitude: undefined }` → `coordinates: [0, 0]` via `|| 0` fallback → renders at null island (0,0) instead of being filtered out — not a crash but incorrect behavior
- Well records `[{lng: NaN, lat: NaN}, {lng: 106.5, lat: 10.2}]` → `Math.min(NaN, 106.5)` = `NaN` → `bounds: { minLon: NaN, ... }` → `fitBounds` crash
- `restoreMapState({ center: [NaN, NaN], zoom: 5 })` → `map.jumpTo({ center: [NaN, NaN] })` → crash
- All records have valid coordinates `[106.5, 10.2]` → no crash, works correctly (preservation case)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Well records with valid finite longitude and latitude must continue to produce GeoJSON features and render on the map
- `fitBoundsToFeatures` with all-valid coordinates must continue to calculate bounds and animate the map
- `fitBounds` with valid finite bounds must continue to call `maplibregl.LngLatBounds` and fit the map
- `restoreMapState` with valid finite center and zoom must continue to call `map.jumpTo` and restore the view
- Panel switching with valid saved map state must continue to restore wells, bounds, and center
- Mouse clicks, popups, polygon drawing, weather layers, and 3D toggle must be completely unaffected

**Scope:**
All inputs where every coordinate is a finite number should be completely unaffected by this fix. This includes:
- Search results where all wells have valid lat/lng
- Bounds calculations where all coordinates are finite
- Map state restoration with valid center coordinates
- All non-coordinate-related map interactions (polygons, weather, 3D, theme switching)

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Faulty Fallback Pattern in CatalogPage.tsx**: `record.longitude || 0` does not guard against `NaN`. While `NaN` is falsy in JS (so `NaN || 0` = `0`), the real problem is that API responses may return string values like `"NaN"` or empty strings that get parsed to `NaN` after the `|| 0` check, or the field may be a number that is literally `NaN` from `parseFloat("unknown")`. The `|| 0` pattern also incorrectly maps `null`/`undefined` to `0` (null island) instead of filtering the record out.

2. **No Coordinate Validation in MapComponent.tsx**: The three crash-site functions (`fitBoundsToFeatures`, `fitBounds`, `restoreMapState`) pass coordinates directly to maplibre-gl without any `isFinite` check. This is the immediate cause of the crash.

3. **NaN Propagation Through Math.min/Math.max**: In `CatalogPage.tsx`, bounds are calculated as `Math.min(...coordinates.map(c => c[0]))`. If ANY coordinate is `NaN`, the entire result is `NaN`, poisoning all four bounds values and every downstream consumer.

4. **No Validation on Map State Restoration Path**: When switching panels, `CatalogPage.tsx` restores `mapState.bounds` and `mapState.wellData` without checking if they contain NaN values that were stored from a previous buggy search.

## Correctness Properties

Property 1: Fault Condition - NaN Coordinates Never Reach Maplibre-GL

_For any_ input where well records contain NaN, null, undefined, or non-finite longitude/latitude values, the fixed code SHALL filter out those records before constructing GeoJSON features, and SHALL validate all coordinates before passing them to maplibre-gl APIs (`LngLatBounds.extend`, `fitBounds`, `setCenter`, `jumpTo`), preventing any `Invalid LngLat object` crash.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Valid Coordinate Behavior Unchanged

_For any_ input where all well records have valid finite longitude and latitude values, the fixed code SHALL produce exactly the same GeoJSON features, bounds calculations, map animations, and state restoration as the original code, preserving all existing map functionality for valid data.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/CatalogPage.tsx`

**Specific Changes**:
1. **Add `isValidCoordinate` helper function**: Create a reusable function `isValidCoordinate(lng: unknown, lat: unknown): boolean` that returns `true` only if both values are finite numbers (using `Number.isFinite`).

2. **Filter records before GeoJSON construction** (catalog search path ~line 500): Before building `filteredGeoJSON`, filter `filtered` array to only include records where `isValidCoordinate(record.longitude, record.latitude)` is true. Remove the `|| 0` fallback pattern.

3. **Filter records before GeoJSON construction** (OSDU search path ~line 650): Same filter applied to the OSDU data path.

4. **Guard bounds calculation**: After filtering coordinates, check that the filtered array is non-empty before calling `Math.min`/`Math.max`. If empty, set `bounds` to `null`.

5. **Filter records in analysis data construction**: Apply the same coordinate filter when building `filteredWellData` for `setAnalysisData`.

**File**: `src/pages/MapComponent.tsx`

**Specific Changes**:
1. **Add `isFiniteCoord` helper**: Create `isFiniteCoord(coord: [number, number]): boolean` that validates both elements are finite numbers.

2. **Guard `fitBoundsToFeatures`** (~line 590 inside `updateMapData`): After collecting `allCoordinates`, filter out any entries where either value is not finite. If no valid coordinates remain, skip bounds fitting entirely.

3. **Guard `fitBounds`** (~line 610): At the top of `fitBounds`, check all four bounds values with `Number.isFinite`. If any is not finite, log a warning and return early.

4. **Guard `restoreMapState`** (~line 855): At the top of `restoreMapState`, check `state.center[0]` and `state.center[1]` with `Number.isFinite`. If either is not finite, log a warning and return early (don't call `jumpTo`).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that construct well records with NaN/null/undefined coordinates, build GeoJSON features using the current `|| 0` pattern, and attempt to pass them to maplibre-gl-like bounds calculations. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **NaN Longitude Test**: Create a record with `longitude: NaN, latitude: 10.5`, construct GeoJSON, verify `coordinates` contains NaN (will fail on unfixed code)
2. **Undefined Coordinates Test**: Create a record with `longitude: undefined, latitude: undefined`, verify the `|| 0` fallback produces `[0, 0]` instead of filtering (will demonstrate incorrect behavior on unfixed code)
3. **NaN Bounds Propagation Test**: Create coordinates array `[[NaN, 10], [106, 10]]`, compute `Math.min(...coords.map(c => c[0]))`, verify result is NaN (will fail on unfixed code)
4. **Mixed Valid/Invalid Test**: Create records with mix of valid and NaN coordinates, verify bounds calculation produces NaN (will fail on unfixed code)

**Expected Counterexamples**:
- GeoJSON features contain `[NaN, NaN]` or `[0, 0]` coordinates from invalid records
- `Math.min`/`Math.max` returns NaN when any coordinate is NaN
- Possible causes: `|| 0` doesn't catch NaN from parsed API responses, no validation in MapComponent

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := processWellRecords_fixed(input.records)
  ASSERT all coordinates in result.geoJSON are finite numbers
  ASSERT result.bounds is null OR all bounds values are finite
  ASSERT no maplibre-gl API receives NaN coordinates
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT processWellRecords_original(input) = processWellRecords_fixed(input)
  ASSERT fitBounds_original(input.bounds) = fitBounds_fixed(input.bounds)
  ASSERT restoreMapState_original(input.state) = restoreMapState_fixed(input.state)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain of valid coordinates
- It catches edge cases like coordinates at exactly 0, negative coordinates, extreme but valid values (180, -180, 90, -90)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for valid coordinate inputs, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid GeoJSON Preservation**: Verify that records with valid coordinates produce identical GeoJSON features before and after fix
2. **Valid Bounds Preservation**: Verify that bounds calculated from valid coordinates are identical before and after fix
3. **Valid Map State Restoration**: Verify that restoreMapState with valid center coordinates behaves identically
4. **Zero Coordinate Preservation**: Verify that records with legitimate `longitude: 0` or `latitude: 0` (equator/prime meridian) are NOT filtered out

### Unit Tests

- Test `isValidCoordinate` helper with NaN, null, undefined, Infinity, -Infinity, 0, valid numbers
- Test GeoJSON construction filters out records with invalid coordinates
- Test bounds calculation returns null when all coordinates are invalid
- Test bounds calculation works correctly with mix of valid/invalid (only valid used)
- Test `fitBounds` returns early for NaN bounds
- Test `restoreMapState` returns early for NaN center
- Test `fitBoundsToFeatures` filters NaN coordinates before calling maplibre-gl

### Property-Based Tests

- Generate random well records with mix of valid finite coordinates and NaN/null/undefined, verify no NaN reaches GeoJSON output
- Generate random valid coordinate sets, verify bounds calculation matches original behavior exactly
- Generate random valid map states, verify restoreMapState behavior is identical to original

### Integration Tests

- Test full catalog search → map display flow with records containing NaN coordinates (no crash)
- Test panel switching with saved map state containing NaN bounds (no crash, map stays at current position)
- Test mix of valid and invalid wells renders only valid wells on map
