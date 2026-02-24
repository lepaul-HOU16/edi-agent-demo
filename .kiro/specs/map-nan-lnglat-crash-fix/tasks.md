# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - NaN Coordinates Reach Maplibre-GL APIs
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate NaN/null/undefined coordinates propagate through GeoJSON construction and crash maplibre-gl
  - **Scoped PBT Approach**: Use `fast-check` to generate well records with NaN, null, undefined, Infinity, and -Infinity coordinate values
  - Test file: `src/__tests__/map-nan-crash-fault.test.ts`
  - Extract the GeoJSON construction logic from `CatalogPage.tsx` (~line 500) into a testable helper, or replicate the `record.longitude || 0` pattern in the test
  - Extract the bounds calculation logic (`Math.min`/`Math.max` over coordinates) into a testable helper
  - Property: For any set of well records where at least one has non-finite longitude or latitude, the output GeoJSON features SHALL contain ONLY finite coordinates, AND the output bounds SHALL be null or contain only finite values
  - Concrete cases to include: `{ longitude: NaN, latitude: 10.5 }`, `{ longitude: undefined, latitude: undefined }`, `{ longitude: Infinity, latitude: -Infinity }`
  - Verify `Math.min(...coords)` returns NaN when any coord is NaN (confirms bug mechanism)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (proves the bug exists - NaN coordinates leak into GeoJSON and bounds)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Coordinate Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Test file: `src/__tests__/map-nan-crash-preservation.test.ts`
  - Observe on UNFIXED code: records with valid finite coordinates produce correct GeoJSON features with matching coordinates
  - Observe on UNFIXED code: `Math.min`/`Math.max` bounds calculation produces correct bounds for valid coordinate arrays
  - Observe on UNFIXED code: `fitBounds` with valid bounds calls maplibre-gl correctly
  - Observe on UNFIXED code: `restoreMapState` with valid center/zoom calls `map.jumpTo` correctly
  - Write property-based tests with `fast-check`:
    - Generate random valid longitude values in [-180, 180] and latitude values in [-90, 90]
    - Property: For all records with valid finite coordinates, GeoJSON features contain exactly those coordinates (no filtering, no modification)
    - Property: For all valid coordinate arrays, bounds equal `{ minLon: Math.min(...lngs), maxLon: Math.max(...lngs), minLat: Math.min(...lats), maxLat: Math.max(...lats) }`
    - Property: Records with `longitude: 0` or `latitude: 0` (equator/prime meridian) are NOT filtered out
    - Property: `fitBounds` with valid finite bounds calls `map.fitBounds` with correct LngLatBounds
    - Property: `restoreMapState` with valid finite center calls `map.jumpTo` with correct center and zoom
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for Invalid LngLat NaN crash

  - [x] 3.1 Add `isValidCoordinate` helper and filter invalid records in CatalogPage.tsx
    - Add helper function `isValidCoordinate(lng: unknown, lat: unknown): boolean` that returns `true` only when both `Number.isFinite(lng)` and `Number.isFinite(lat)` are true
    - In catalog search GeoJSON construction (~line 500): filter `filtered` array to only include records where `isValidCoordinate(record.longitude, record.latitude)` is true; remove the `|| 0` fallback pattern
    - In OSDU search GeoJSON construction (~line 650): apply the same coordinate filter
    - Guard bounds calculation: after filtering, check array is non-empty before `Math.min`/`Math.max`; if empty, set bounds to `null`
    - Filter records in analysis data construction for `setAnalysisData`
    - _Bug_Condition: isBugCondition(input) where any record has non-finite longitude or latitude_
    - _Expected_Behavior: Filter out records with non-finite coordinates before GeoJSON construction; bounds are null if no valid coordinates remain_
    - _Preservation: Records with valid finite coordinates (including 0) produce identical GeoJSON and bounds as before_
    - _Requirements: 2.1, 2.5, 3.1, 3.6_

  - [x] 3.2 Add `Number.isFinite` guards to `fitBoundsToFeatures` in MapComponent.tsx
    - Add `isFiniteCoord` helper: `(coord: [number, number]) => Number.isFinite(coord[0]) && Number.isFinite(coord[1])`
    - In `fitBoundsToFeatures` (~line 590 inside `updateMapData`): after collecting `allCoordinates`, filter with `isFiniteCoord`; if no valid coordinates remain, skip bounds fitting and log a warning
    - Guard the single-point `setCenter` path: validate the coordinate before calling `setCenter`
    - _Bug_Condition: isBugCondition(input) where GeoJSON features contain NaN coordinates_
    - _Expected_Behavior: Filter NaN coordinates; skip bounds fitting if none remain; no crash_
    - _Preservation: All-valid coordinates produce identical bounds and map animation_
    - _Requirements: 2.2, 2.6, 3.2_

  - [x] 3.3 Add `Number.isFinite` guard to `fitBounds` in MapComponent.tsx
    - At the top of `fitBounds` (~line 610): check all four bounds values (`minLon`, `maxLon`, `minLat`, `maxLat`) with `Number.isFinite`
    - If any value is not finite, log a warning with the invalid bounds and return early without calling `map.fitBounds`
    - _Bug_Condition: isBugCondition(input) where bounds contain NaN values_
    - _Expected_Behavior: Skip fitBounds call; log warning; no crash_
    - _Preservation: Valid finite bounds produce identical fitBounds behavior_
    - _Requirements: 2.3, 3.3_

  - [x] 3.4 Add `Number.isFinite` guard to `restoreMapState` in MapComponent.tsx
    - At the top of `restoreMapState` (~line 855): check `state.center[0]` and `state.center[1]` with `Number.isFinite`
    - If either is not finite, log a warning and return early without calling `map.jumpTo`
    - Also validate `state.zoom` is finite before using it
    - _Bug_Condition: isBugCondition(input) where center coordinates are NaN_
    - _Expected_Behavior: Skip jumpTo call; log warning; no crash_
    - _Preservation: Valid finite center and zoom produce identical jumpTo behavior_
    - _Requirements: 2.4, 3.4, 3.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - NaN Coordinates Never Reach Maplibre-GL APIs
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior: all GeoJSON coordinates are finite, bounds are null or finite
    - When this test passes, it confirms NaN coordinates are properly filtered at both CatalogPage and MapComponent layers
    - Run: `npx jest src/__tests__/map-nan-crash-fault.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Coordinate Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run: `npx jest src/__tests__/map-nan-crash-preservation.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions for valid coordinate data)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npx jest src/__tests__/map-nan-crash`
  - Verify both fault condition and preservation tests pass
  - Ensure no other tests are broken by the changes
  - Ask the user to test on localhost with `npm run dev` at http://localhost:3000
  - Verify map loads correctly with valid well data
  - Verify map handles search results with missing/NaN coordinates without crashing
