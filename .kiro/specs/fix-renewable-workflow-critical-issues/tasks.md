# Implementation Plan

- [x] 1. Fix layout S3 persistence
  - Modify `amplify/functions/renewableTools/layout/handler.py` to save complete layout JSON to S3 after generation
  - Include turbines array, perimeter polygon, OSM features array, and algorithm metadata in saved JSON
  - Return S3 key in Lambda response for downstream tools
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Fix wake simulation S3 retrieval
  - Modify `amplify/functions/renewableTools/simulation/handler.py` to load layout.json from S3 before simulation
  - Add error handling for missing layout data with clear error message
  - Pass complete layout data to py-wake calculation engine
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3. Fix intelligent placement algorithm selection
  - Modify `amplify/functions/renewableTools/layout/intelligent_placement.py` to prioritize intelligent placement when OSM features exist
  - Add logging for algorithm selection decision
  - Only fall back to grid layout when OSM features are completely unavailable
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Add terrain feature visualization to layout map
  - Modify `src/components/renewable/LayoutOptimizationArtifact.tsx` to render terrain features layer
  - Add perimeter polygon rendering with boundary styling
  - Add OSM feature rendering (roads as lines, buildings as polygons, water as blue polygons)
  - Layer turbine markers on top of terrain features
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Implement call-to-action button system
- [x] 5.1 Create WorkflowCTAButtons component
  - Create `src/components/renewable/WorkflowCTAButtons.tsx` with button definitions for each workflow step
  - Implement button enable/disable logic based on completed steps
  - Add click handler to send queries to chat
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.2 Integrate CTA buttons into artifact footers
  - Modify artifact components to include WorkflowCTAButtons in footer
  - Pass completed steps context from orchestrator response
  - Style buttons to match Cloudscape design system
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Add dashboard intent detection and routing
  - Modify `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts` to detect dashboard queries
  - Route dashboard queries to ProjectDashboardArtifact component
  - Include all completed analysis results in dashboard response
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Implement enhanced error message templates
  - Modify `amplify/functions/shared/errorMessageTemplates.ts` to add renewable-specific error templates
  - Include actionable messages for missing prerequisites
  - Add CTA buttons to error messages where applicable
  - Update orchestrator error handling to use templates
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Deploy and validate complete workflow
  - Deploy all backend changes to AWS
  - Deploy frontend changes
  - Test complete workflow: terrain → layout → simulation → windrose → dashboard
  - Verify CTA buttons enable click-through navigation
  - Verify terrain features display on layout map
  - Verify wake simulation executes without errors
  - _Requirements: All_
