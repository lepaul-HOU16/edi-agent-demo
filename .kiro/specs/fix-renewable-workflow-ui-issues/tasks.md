# Implementation Plan: Fix Renewable Workflow UI Issues

## Task Overview

This plan fixes 6 critical UI issues in the renewable energy workflow by implementing changes across backend Lambdas, orchestrator, and frontend components. Tasks are ordered to build incrementally with testing after each major component.

---

## Backend Layer: Data Generation Fixes

- [x] 1. Add perimeter feature generation to terrain tool
  - Modify `amplify/functions/renewableTools/terrain/handler.py`
  - Add `generate_perimeter_feature()` function that creates circular polygon
  - Include perimeter in GeoJSON features array with type="perimeter"
  - Add perimeter properties: name, radius_km, area_km2
  - Test: Verify perimeter feature appears in terrain analysis GeoJSON
  - _Requirements: 2.1, 2.2_

- [x] 2. Merge terrain features into layout GeoJSON
  - Modify `amplify/functions/renewableTools/layout/handler.py`
  - Add `merge_terrain_and_turbines()` function
  - Extract terrain features from context.terrain_results.geojson
  - Combine terrain features + turbine features in single GeoJSON
  - Preserve all feature properties and types
  - Test: Verify layout GeoJSON contains both terrain and turbine features
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Add turbine properties to layout features
  - In `amplify/functions/renewableTools/layout/handler.py`
  - Ensure each turbine feature has type="turbine"
  - Add properties: turbine_id, capacity_MW, hub_height_m, rotor_diameter_m
  - Use sequential IDs: T001, T002, T003, etc.
  - Test: Verify turbine features have all required properties
  - _Requirements: 4.1, 4.2_

- [x] 4. Generate wake heat map visualization
  - Modify `amplify/functions/renewableTools/simulation/handler.py`
  - Add `generate_wake_heat_map()` function using Plotly
  - Create interactive HTML heat map with wake deficit data
  - Upload HTML to S3 at `projects/{project_id}/visualizations/wake_heat_map.html`
  - Generate presigned URL (7-day expiration)
  - Add URL to visualizations.wake_heat_map in response
  - Test: Verify wake_heat_map URL is present and accessible
  - _Requirements: 5.1, 5.2_

---

## Orchestrator Layer: Intent & Action Button Fixes

- [x] 5. Fix financial analysis intent classification
  - Modify `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts`
  - Move financial analysis patterns BEFORE terrain patterns in INTENT_PATTERNS array
  - Add patterns: /financial\s+analysis/i, /roi\s+calculation/i, /economic\s+analysis/i
  - Add excludePatterns to terrain_analysis to exclude financial keywords
  - Test: Verify "financial analysis" query returns report_generation intent
  - _Requirements: 6.1, 6.2_

- [x] 6. Implement action button generation in formatArtifacts
  - Modify `amplify/functions/renewableOrchestrator/handler.ts`
  - In `formatArtifacts()` function, call `generateActionButtons()` for each artifact
  - Pass artifact type, project name, and project data to generateActionButtons
  - Include actions array in artifact object
  - Add logging: "Generated X action buttons for {type}"
  - Test: Verify artifacts include actions array in CloudWatch logs
  - _Requirements: 7.1, 7.5_

- [x] 7. Enhance generateActionButtons with dashboard access
  - Modify `amplify/functions/shared/actionButtonTypes.ts`
  - For terrain_analysis: Add "Optimize Layout" (primary) + "View Dashboard" (secondary)
  - For wind_farm_layout: Add "Run Wake Simulation" (primary) + "View Dashboard" + "Refine Layout"
  - For wake_simulation: Add "Generate Report" (primary) + "View Dashboard" + "Financial Analysis" + "Optimize Layout"
  - For report_generation: Add "View Dashboard" (primary) + "Export Report"
  - Test: Verify correct buttons generated for each artifact type
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 8. Add default title and subtitle generation
  - In `amplify/functions/renewableOrchestrator/handler.ts`
  - Add `getDefaultTitle()` function with titles for each artifact type
  - Add `getDefaultSubtitle()` function that includes coordinates if available
  - Apply defaults in formatArtifacts if title/subtitle missing
  - Test: Verify all artifacts have title and subtitle
  - _Requirements: 7.5_

---

## Frontend Layer: Rendering & Error Handling Fixes

- [x] 9. Add defensive rendering to LayoutMapArtifact
  - Modify `src/components/renewable/LayoutMapArtifact.tsx`
  - Add validation before map initialization: check geojson, features, container dimensions
  - Add fallback UI for missing GeoJSON with Alert component
  - Add error logging for validation failures
  - Ensure map only initializes if all validations pass
  - Test: Verify graceful handling when GeoJSON is missing
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 10. Render perimeter with dashed line styling
  - In `src/components/renewable/LayoutMapArtifact.tsx`
  - In terrain feature rendering loop, detect type="perimeter"
  - Apply style: transparent fill, dashed border (#333333), weight 3
  - Add popup with "Site Perimeter" label and area
  - Add perimeter to map legend
  - Test: Verify perimeter renders as dashed boundary
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 11. Ensure turbines render on top of terrain
  - In `src/components/renewable/LayoutMapArtifact.tsx`
  - Render terrain features first (buildings, roads, water, perimeter)
  - Render turbine markers second (after terrain layers)
  - Use Leaflet default markers (blue teardrop)
  - Add turbine popup with specifications
  - Test: Verify turbines appear on top of terrain features
  - _Requirements: 3.4, 3.5, 4.3, 4.4, 4.5_

- [x] 12. Add wake heat map fallback UI
  - Modify `src/components/renewable/WakeAnalysisArtifact.tsx`
  - Check if visualizations.wake_heat_map exists before rendering iframe
  - If missing, display Alert with "Wake Heat Map Not Available" message
  - Provide button to switch to "Analysis Charts" tab if wake_analysis exists
  - Add onError handler to iframe for load failures
  - Test: Verify fallback UI displays when heat map missing
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 13. Always render WorkflowCTAButtons
  - Modify `src/components/renewable/WorkflowCTAButtons.tsx`
  - Remove early return that hides buttons when none enabled
  - If no buttons enabled, show first button as hint
  - Change header text based on enabled state: "Next Steps" vs "Suggested Next Step"
  - Test: Verify buttons always render, even with no completed steps
  - _Requirements: 8.1_

- [x] 14. Add container dimension validation
  - In `src/components/renewable/LayoutMapArtifact.tsx`
  - Check mapRef.current.getBoundingClientRect() before map creation
  - If width or height is 0, log error and display fallback message
  - Add retry logic or instructions to user
  - Test: Verify error handling when container has no dimensions
  - _Requirements: 8.4_

- [x] 15. Add comprehensive error boundaries
  - In all artifact components (LayoutMapArtifact, WakeAnalysisArtifact)
  - Wrap rendering logic in try-catch blocks
  - Set error state on catch
  - Display user-friendly error Alert with reload button
  - Log errors to console with context
  - Test: Verify graceful error handling for rendering failures
  - _Requirements: 8.5_

---

## Integration & Testing

- [x] 16. Deploy backend changes
  - Deploy terrain, layout, and simulation tool Lambdas
  - Verify environment variables are set correctly
  - Check CloudWatch logs for successful deployments
  - Test each tool Lambda individually with direct invocation
  - _Requirements: All backend requirements_

- [x] 17. Deploy orchestrator changes
  - Deploy orchestrator Lambda with intent and action button fixes
  - Verify RENEWABLE_*_FUNCTION_NAME environment variables
  - Test intent classification with sample queries
  - Verify action buttons appear in CloudWatch logs
  - _Requirements: All orchestrator requirements_

- [x] 18. Deploy frontend changes
  - Build and deploy Next.js application
  - Clear browser cache
  - Test artifact rendering with real data
  - Verify all error states display correctly
  - _Requirements: All frontend requirements_

- [x] 19. End-to-end workflow test
  - Test complete workflow: Terrain → Layout → Wake → Report
  - Verify perimeter shows on terrain map
  - Verify terrain features show on layout map
  - Verify turbines show on layout map
  - Verify wake heat map loads in iframe
  - Verify action buttons appear at each step
  - Verify dashboard is accessible at each step
  - Verify financial analysis query generates report
  - _Requirements: All requirements_

- [x] 20. User acceptance testing
  - Have user test complete workflow in deployed environment
  - Verify all 6 reported issues are resolved
  - Collect feedback on workflow flow and button placement
  - Make any final adjustments based on feedback
  - _Requirements: All requirements_

---

## Notes

- Each task should be tested immediately after implementation
- Backend tasks (1-4) can be done in parallel
- Orchestrator tasks (5-8) depend on backend completion
- Frontend tasks (9-15) can be done in parallel with orchestrator
- Integration tasks (16-20) must be done sequentially
- Always check CloudWatch logs after deployment
- Always test in browser after frontend changes
- Keep diagnostic test script updated with new test cases
