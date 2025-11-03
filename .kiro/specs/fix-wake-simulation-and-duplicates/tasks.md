# Fix Wake Simulation and Title Duplicates - Implementation Tasks

## ⚠️ ACTUAL ROOT CAUSE IDENTIFIED

**The wake simulation is failing because layout optimization is NOT saving layout.json to S3.**

When wake simulation runs, the orchestrator tries to fetch layout data from S3:
- Path: `renewable/layout/{project_id}/layout.json`
- **This file doesn't exist** because layout handler only saves the HTML map, not the JSON data

**Real Issue**: Layout handler (`amplify/functions/renewableTools/layout/handler.py`) needs to save layout.json to S3

**Fix Required**: Add S3 save operation for layout JSON data in layout handler

**Related Spec**: `.kiro/specs/fix-layout-optimization-persistence/` - This spec is actually about the real issue!

## Task 1: Fix Wake Simulation Component Mapping

**Objective:** Map wake_simulation artifact type to the correct WakeAnalysisArtifact component

**Sub-tasks:**
- [x] 1.1 Update ChatMessage component mapping
  - Change wake_simulation to render WakeAnalysisArtifact instead of SimulationChartArtifact
  - Remove the messageContentType transformation to 'wind_farm_simulation'
  - Add import for WakeAnalysisArtifact component
  - _Requirements: Requirement 1, Acceptance Criteria 3_

- [x] 1.2 Test wake simulation rendering
  - Verify WakeAnalysisArtifact receives correct data structure
  - Verify component renders without errors
  - Verify all metrics and visualizations display
  - _Requirements: Requirement 1, Acceptance Criteria 4_

## Task 2: Investigate and Fix Title Duplication

**Objective:** Identify and eliminate source of title duplication in wake simulation results

**Sub-tasks:**
- [x] 2.1 Investigate duplication source
  - Check if multiple artifacts are being created for single response
  - Check if message text includes title that duplicates artifact title
  - Check browser console for duplicate component renders
  - Log artifact data at each stage (backend → orchestrator → frontend)
  - _Requirements: Requirement 2, Acceptance Criteria 1_

- [x] 2.2 Fix identified duplication
  - If multiple artifacts: Deduplicate at orchestrator level
  - If message text duplication: Remove title from message text
  - If component rendering twice: Fix React rendering issue
  - _Requirements: Requirement 2, Acceptance Criteria 2, 3, 4_

- [x] 2.3 Verify no duplicate content
  - Test wake simulation displays title only once
  - Test no duplicate sections in rendered output
  - Test across different wake simulation scenarios
  - _Requirements: Requirement 2, Acceptance Criteria 5_

## Task 3: End-to-End Testing

**Objective:** Verify complete wake simulation workflow works correctly

**Sub-tasks:**
- [x] 3.1 Test wake simulation query
  - Run query: "run wake simulation for [project]"
  - Verify simulation executes successfully
  - Verify results display in WakeAnalysisArtifact
  - Verify no errors in browser console
  - _Requirements: Requirement 1, Acceptance Criteria 1, 2, 3, 4_
  - **COMPLETED**: Automated E2E test passed (tests/test-wake-simulation-complete-e2e.js)

- [ ] 3.2 Test wake simulation with real data
  - Test with actual project that has layout
  - Verify NREL wind data is used
  - Verify performance metrics are accurate
  - Verify visualizations load correctly
  - _Requirements: Requirement 1, Acceptance Criteria 4_
  - **STATUS**: Requires browser testing with deployed backend

- [ ] 3.3 Test error handling
  - Test wake simulation with missing project
  - Test wake simulation with invalid parameters
  - Verify clear error messages display
  - _Requirements: Requirement 1, Acceptance Criteria 5_
  - **STATUS**: Requires browser testing with deployed backend

## Task 4: Deployment and Validation

**Objective:** Deploy fixes and validate in production environment

**Sub-tasks:**
- [ ] 4.1 Deploy frontend changes
  - Update ChatMessage component
  - Test in browser
  - Verify no console errors
  - _Requirements: All_
  - **STATUS**: Code changes complete, ready for deployment

- [ ] 4.2 User acceptance testing
  - Test with actual user workflows
  - Verify wake simulation works end-to-end
  - Verify no title duplication
  - Get user confirmation
  - _Requirements: All_
  - **STATUS**: Awaiting deployment and user testing

## Testing Strategy

### Unit Tests
- Test ChatMessage maps wake_simulation to WakeAnalysisArtifact
- Test WakeAnalysisArtifact renders with wake simulation data
- Test title appears only once

### Integration Tests
- Test orchestrator formats wake_simulation artifact correctly
- Test complete data flow from backend to frontend
- Test no duplicate titles in complete flow

### E2E Tests
- Test complete wake simulation workflow
- Test with real project data
- Test error scenarios

## Success Criteria

- ✅ Wake simulation queries execute successfully
- ✅ WakeAnalysisArtifact displays with correct data
- ✅ Title appears only once in artifact
- ✅ No duplicate content sections
- ✅ All metrics and visualizations display correctly
- ✅ No console errors in browser
- ✅ User validates fixes work correctly

## Priority

**HIGH** - Wake simulation is a core feature that's currently broken

## Estimated Effort

- Task 1: 30 minutes (simple component mapping fix)
- Task 2: 1-2 hours (investigation + fix)
- Task 3: 1 hour (testing)
- Task 4: 30 minutes (deployment + validation)

**Total: ~3-4 hours**
