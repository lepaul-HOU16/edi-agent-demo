# Implementation Plan

- [x] 1. Update state interface to include wellData and weatherLayers
  - Add `wellData: any | null` to currentMapState type
  - Add `weatherLayers: string[]` to currentMapState type
  - Initialize both to `null` and `[]` respectively
  - Update initial state object
  - _Requirements: 1.1, 1.5_

- [x] 2. Save well data in updateMapData function
  - Add `setCurrentMapState(prev => ({ ...prev, wellData: geoJsonData }))` at start of function
  - Use functional setState to avoid stale closures
  - Log saved data count for debugging
  - Ensure state update happens before rendering
  - _Requirements: 1.1, 1.2, 1.4, 6.2_

- [x] 3. Track active weather layers in toggleWeatherLayer
  - Add state update when layer is enabled: add to weatherLayers array
  - Add state update when layer is disabled: remove from weatherLayers array
  - Use functional setState
  - Log active layers for debugging
  - _Requirements: 3.1, 3.2, 6.2_

- [x] 4. Restore markers in theme change handler
  - In `styledata` event handler, check if `currentMapState.wellData` exists
  - If exists, call `updateMapData(currentMapState.wellData)` to restore markers
  - Log restoration with marker count
  - Ensure restoration happens after camera position restore
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.3, 6.4_

- [x] 5. Restore weather layers in theme change handler
  - In `styledata` event handler, check if `currentMapState.weatherLayers` has items
  - Loop through active layers and call `toggleWeatherLayer(layer, true)`
  - Log which layers are being restored
  - Ensure restoration happens after markers
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.3_

- [x] 6. Clear state in clearMap function
  - Set `wellData: null` in state update
  - Set `weatherLayers: []` in state update
  - Ensure state is cleared before map reset
  - Log state clearing
  - _Requirements: 1.3, 6.2_

- [x] 7. Add defensive logging throughout
  - Log when saving well data (count of wells)
  - Log when theme change starts (new theme, current data)
  - Log when restoring markers (count being restored)
  - Log when restoration completes
  - Log any errors with context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Test theme switching with markers
  - Search for wells to populate map
  - Switch from Light to Dark theme
  - Verify markers remain visible
  - Check console logs for restoration messages
  - Verify marker count matches
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 9. Test theme switching with weather layers
  - Enable weather layers
  - Switch theme
  - Verify weather layers remain visible
  - Check console logs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 10. Test edge cases
  - Theme change with no data (should not error)
  - Theme change in 3D mode (should preserve pitch/bearing)
  - Theme change with polygons drawn (should preserve polygons)
  - Multiple rapid theme changes (should handle gracefully)
  - Clear map then theme change (should not error)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 11. Verify performance
  - Measure theme change completion time (should be < 1 second)
  - Verify no duplicate rendering
  - Check for memory leaks (wellData cleared on clearMap)
  - Verify smooth transition
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Deploy and validate
  - Deploy backend if needed: `cd cdk && npm run deploy`
  - Test on localhost: `npm run dev`
  - Test all scenarios from tasks 8-11
  - Verify no console errors
  - Confirm markers persist across theme changes
  - _Requirements: All requirements_
