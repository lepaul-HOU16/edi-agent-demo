# Implementation Plan

- [x] 1. Diagnose the map loading failure
  - Add debug logging to track initialization flow
  - Check browser console for Leaflet errors
  - Verify mapRef.current exists when useEffect runs
  - Verify dynamic import('leaflet') resolves successfully
  - Document the root cause of the regression
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Fix Leaflet map initialization
  - [ ] 2.1 Add error handling for dynamic import
    - Wrap import('leaflet') in try-catch
    - Log import errors to console
    - Show fallback UI if import fails
    - _Requirements: 2.1, 3.4_
  
  - [ ] 2.2 Improve DOM readiness checks
    - Verify mapRef.current exists before initialization
    - Check container has valid dimensions (getBoundingClientRect)
    - Add retry logic if container not ready
    - _Requirements: 2.1, 3.1_
  
  - [ ] 2.3 Prevent duplicate initialization
    - Check mapInstanceRef.current before creating map
    - Clear Leaflet container ID properly
    - Ensure cleanup function runs on unmount
    - _Requirements: 2.1, 3.2, 3.3_
  
  - [ ] 2.4 Add fallback rendering
    - Show Folium HTML iframe if Leaflet fails
    - Show error message if no map data available
    - Provide graceful degradation path
    - _Requirements: 2.1, 3.4_

- [ ] 3. Restore map features and interactions
  - [ ] 3.1 Verify map displays correctly
    - Ensure center marker appears at analysis coordinates
    - Verify GeoJSON features render with correct styling
    - Check tile layers load (satellite and OSM)
    - _Requirements: 2.2, 2.3_
  
  - [ ] 3.2 Restore map interactions
    - Enable dragging, zooming, and panning
    - Verify feature popups display on click
    - Test layer switcher functionality
    - _Requirements: 2.4, 2.5_
  
  - [ ] 3.3 Fix map bounds and positioning
    - Ensure fitBounds works correctly
    - Verify map centers on features
    - Check invalidateSize is called after render
    - _Requirements: 2.3, 2.5_

- [ ] 4. Test and verify the fix
  - [ ] 4.1 Test with real terrain data
    - Load terrain analysis artifact in UI
    - Verify map renders without console errors
    - Check all features display correctly
    - _Requirements: 4.1, 4.5_
  
  - [ ] 4.2 Test map interactions
    - Test drag, zoom, and pan functionality
    - Click on features to verify popups
    - Switch between satellite and street map layers
    - _Requirements: 4.4_
  
  - [ ] 4.3 Verify map container dimensions
    - Check container has 600px height
    - Verify width fills parent container
    - Test responsive behavior
    - _Requirements: 4.2_
  
  - [ ] 4.4 Test error handling
    - Simulate import failure
    - Test with missing geojson data
    - Verify fallback UI displays
    - _Requirements: 3.4_

- [ ] 5. Document the fix and prevention measures
  - Document the root cause of the regression
  - Update component comments with initialization notes
  - Add troubleshooting guide for future issues
  - Create regression test to prevent future breakage
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
