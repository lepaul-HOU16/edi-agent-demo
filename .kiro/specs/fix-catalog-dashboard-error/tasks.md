# Implementation Plan

- [x] 1. Add safe coordinate formatting helper to GeoscientistDashboard
  - Create `formatCoordinates` helper function with comprehensive null checks
  - Validate coordinates exist and are properly formatted [number, number] tuple
  - Return "N/A" for undefined, invalid, or NaN coordinate values
  - Format valid coordinates as "lat, lon" with 4 decimal places
  - Use `useCallback` hook for memoization
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Fix coordinate access in Data Table tab
  - Replace direct array access `well.coordinates[1]` with `formatCoordinates(well.coordinates)`
  - Update TableCell in Data Table tab to use safe helper function
  - Verify no direct coordinate array access remains in component
  - Test rendering with valid and invalid coordinate data
  - _Requirements: 1.1, 1.3, 1.4, 1.5_

- [ ] 3. Add null safety to crossplot visualization
  - Add coordinate validation before plotting points in SVG
  - Filter wells to only include those with valid coordinates for plotting
  - Add null checks for porosity and permeability before calculating plot positions
  - Ensure crossplot renders without errors when some wells lack data
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 4. Add null safety to operations planning section
  - Add defensive checks in phase well assignments
  - Validate well objects exist before accessing properties
  - Use optional chaining for well.name access
  - Add try-catch block around operations planning rendering (already exists, verify)
  - _Requirements: 4.1, 4.2_

- [ ] 5. Create data validation function in catalog page
  - Add `validateWellData` function to catalog page component
  - Validate coordinates are valid [number, number] tuple or undefined
  - Handle fallback from separate longitude/latitude fields
  - Log warnings for wells with invalid coordinate data
  - Ensure all required WellData properties have fallback values
  - Use `useCallback` hook for memoization
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Apply validation before setting analysisData
  - Call `validateWellData` before setting `analysisData` state
  - Apply validation in all locations where `analysisData` is set
  - Verify validation runs for OSDU search results
  - Verify validation runs for query builder results
  - Verify validation runs for catalog search results
  - _Requirements: 2.1, 2.3, 2.5_

- [ ] 7. Enhance error boundary messaging
  - Update GeoscientistDashboardErrorBoundary error display
  - Add detailed error message with possible causes
  - Include troubleshooting recommendations
  - Improve error logging with structured data
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 8. Add comprehensive null checks to all dashboard calculations
  - Review all property access in `enhancedWells` mapping
  - Add null coalescing for porosity, permeability, netPay, waterSaturation
  - Ensure EUR calculations handle undefined values
  - Verify field statistics calculations exclude invalid data
  - Add null checks to weather operations rendering
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 9. Test dashboard with various data scenarios
  - Test with complete well data (all fields present)
  - Test with missing coordinates
  - Test with undefined coordinates property
  - Test with invalid coordinate array (length < 2)
  - Test with NaN coordinate values
  - Test with mixed valid/invalid data
  - Verify "N/A" displays for missing coordinates
  - Verify no console errors in any scenario
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.5_

- [ ] 10. Verify error boundary catches remaining issues
  - Intentionally trigger error in dashboard component
  - Verify error boundary catches and displays fallback
  - Verify error message is user-friendly
  - Verify fallback table displays available data
  - Verify error details logged to console
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Test complete catalog search flows
  - Perform OSDU search and view Analytics panel
  - Execute query builder query and view Analytics panel
  - Perform catalog search and view Analytics panel
  - Switch between Map, Chat, Analytics, and Chain of Thought panels
  - Verify dashboard loads without errors in all scenarios
  - Verify all dashboard tabs accessible
  - _Requirements: 1.5, 2.5, 3.5, 4.5_

- [ ] 12. Deploy and validate in sandbox environment
  - Deploy changes to sandbox
  - Test with real OSDU data
  - Test with query builder
  - Verify no regression in existing functionality
  - Verify Analytics panel works for all search types
  - Get user validation
  - _Requirements: All_
