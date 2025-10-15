git # Implementation Plan

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

- [ ] 5. Fix feature list table rendering
  - [ ] 5.1 Diagnose why table is not displaying
    - Check if data.exclusionZones is populated
    - Verify table component is rendering in DOM
    - Check for CSS issues hiding the table
    - Log table data and rendering state
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 5.2 Restore table visibility
    - Ensure table section renders after map
    - Verify pagination controls work correctly
    - Check table header alignment
    - Test with various feature counts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Fix water body styling
  - [x] 6.1 Diagnose water feature rendering issues
    - Check current water feature styling in getFeatureStyle
    - Verify water features are identified correctly
    - Check if fillOpacity is being applied
    - Log water feature properties and geometry
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 6.2 Apply correct water styling
    - Set fillColor to 'blue' with fillOpacity 0.4
    - Set border color to 'darkblue' with weight 2
    - Ensure fill is enabled for water polygons
    - Verify feature_type is 'water' not 'way'
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Fix building styling
  - [ ] 7.1 Diagnose building feature rendering issues
    - Check current building styling in getFeatureStyle
    - Verify buildings are identified correctly
    - Check if fillOpacity is being applied
    - Log building properties and geometry
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 7.2 Apply correct building styling
    - Set fillColor to 'red' with fillOpacity 0.4
    - Set border color to 'darkred' with weight 2
    - Ensure polygons are properly closed
    - Verify building details show in popups
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Verify against original Renewables notebook
  - [ ] 8.1 Compare feature styling
    - Review original notebook feature colors
    - Match color scheme exactly
    - Verify highway rendering as lines
    - Verify water/buildings as filled polygons
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 8.2 Verify popup content
    - Check feature names display correctly
    - Verify OSM tags show in popups
    - Match popup styling to original
    - Test popup interactions
    - _Requirements: 7.4, 7.5_

- [ ] 9. Complete end-to-end testing
  - [ ] 9.1 Test map rendering
    - Verify map loads without errors
    - Check all features display correctly
    - Test map interactions (drag, zoom, click)
    - Verify layer switcher works
    - _Requirements: 8.1, 8.3, 8.4, 8.5_
  
  - [ ] 9.2 Test feature table
    - Verify table displays all features
    - Test pagination controls
    - Check feature data accuracy
    - Verify table styling and alignment
    - _Requirements: 8.2_
  
  - [ ] 9.3 Test feature styling
    - Verify water bodies are blue and filled
    - Verify buildings are red and filled
    - Verify highways are orange lines
    - Check all popups display correctly
    - _Requirements: 8.1, 8.2_

- [ ] 10. Document the fix and prevention measures
  - Document all root causes of regressions
  - Update component comments with styling notes
  - Add troubleshooting guide for future issues
  - Create regression test to prevent future breakage
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
