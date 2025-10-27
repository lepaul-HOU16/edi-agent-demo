# Fix WindRose UI and Plotly Integration - Implementation Tasks

## Task 1: Fix WindRose Plotly Data Format

**Objective:** Convert legacy wind rose data format to Plotly-compatible format

**Sub-tasks:**
- [ ] 1.1 Update wind rose artifact response to use Plotly format
  - Ensure `plotlyWindRose` contains `data` and `layout` properties
  - Remove legacy `directions`, `speeds`, `frequencies` arrays from top level
  - _Requirements: US3 (WindRose Chart Integration)_

- [ ] 1.2 Update WindRoseArtifact component to handle Plotly format
  - Modify component to expect `plotlyWindRose.data` and `plotlyWindRose.layout`
  - Add proper error handling for missing Plotly data
  - _Requirements: US3, TR3 (Plotly Integration)_

- [ ] 1.3 Add data format validation
  - Validate Plotly data structure before rendering
  - Provide meaningful error messages for malformed data
  - _Requirements: TR2 (Data Flow Validation)_

## Task 2: Remove Duplicate Content in Wake Analysis

**Objective:** Clean up duplicate titles and sections in wake simulation results

**Sub-tasks:**
- [ ] 2.1 Audit wake simulation response structure
  - Identify all places where titles are added
  - Document current data structure
  - _Requirements: US2 (Wake Simulation Content Quality)_

- [ ] 2.2 Consolidate title fields
  - Keep only one `title` field at artifact level
  - Remove duplicate `title` fields from nested objects
  - _Requirements: US2, TR4 (Content Deduplication)_

- [ ] 2.3 Clean up wake analysis content generation
  - Remove redundant headings in analysis report
  - Ensure each section appears only once
  - _Requirements: US2, TR4_

## Task 3: Fix Artifact Component Error Handling

**Objective:** Add proper error boundaries and loading states to all artifact components

**Sub-tasks:**
- [ ] 3.1 Add error boundary to WindRoseArtifact
  - Wrap component in error boundary
  - Display meaningful error messages
  - _Requirements: US1, TR1 (Component Error Handling)_

- [ ] 3.2 Add loading states to artifact components
  - Show loading spinner while data is being fetched
  - Handle async data loading gracefully
  - _Requirements: US1_

- [ ] 3.3 Add fallback UI for missing data
  - Display helpful message when data is unavailable
  - Provide retry option for failed loads
  - _Requirements: TR1_

## Task 4: Update Backend Data Generation

**Objective:** Fix backend to generate properly structured artifact data

**Sub-tasks:**
- [ ] 4.1 Update simulation handler Plotly data generation
  - Ensure `generate_plotly_wind_rose` returns correct format
  - Validate output structure matches frontend expectations
  - _Requirements: US3, TR3_

- [ ] 4.2 Clean up wake simulation artifact structure
  - Remove duplicate title generation
  - Simplify nested data structures
  - _Requirements: US2, TR4_

- [ ] 4.3 Add backend data validation
  - Validate artifact structure before returning
  - Log warnings for malformed data
  - _Requirements: TR2_

## Task 5: Integration Testing

**Objective:** Verify complete workflow works end-to-end

**Sub-tasks:**
- [ ] 5.1 Test wind rose visualization
  - Verify Plotly chart renders correctly
  - Test with real NREL data
  - Check responsive behavior
  - _Requirements: US3_

- [ ] 5.2 Test wake simulation content
  - Verify no duplicate titles
  - Check content organization
  - Validate all sections display correctly
  - _Requirements: US2_

- [ ] 5.3 Test complete renewable workflow
  - Run terrain → layout → wake simulation
  - Verify all artifacts load properly
  - Check for any regressions
  - _Requirements: US1_

## Task 6: Deployment and Validation

**Objective:** Deploy fixes and validate in production environment

**Sub-tasks:**
- [ ] 6.1 Deploy backend changes
  - Update simulation Lambda
  - Restart sandbox to apply changes
  - Verify deployment success
  - _Requirements: All_

- [ ] 6.2 Deploy frontend changes
  - Update artifact components
  - Test in browser
  - Verify no console errors
  - _Requirements: All_

- [ ] 6.3 User acceptance testing
  - Test with actual user workflows
  - Verify all issues resolved
  - Get user confirmation
  - _Requirements: All_

## Testing Strategy

### Unit Tests
- Test Plotly data format conversion
- Test duplicate content removal logic
- Test error boundary behavior

### Integration Tests
- Test artifact data flow from backend to frontend
- Test component rendering with real data
- Test error handling scenarios

### E2E Tests
- Test complete renewable energy workflow
- Test all artifact types load correctly
- Test responsive behavior

## Success Criteria

- ✅ All wind rose charts display using Plotly format
- ✅ Zero duplicate titles in wake analysis
- ✅ All artifacts load without errors
- ✅ Proper error messages for failures
- ✅ Smooth user experience throughout workflow
- ✅ No console errors in browser
- ✅ User validates fixes work correctly

## Priority

**HIGH** - These are blocking issues preventing users from viewing analysis results.

## Estimated Effort

- Task 1: 2 hours
- Task 2: 1.5 hours
- Task 3: 2 hours
- Task 4: 2 hours
- Task 5: 1.5 hours
- Task 6: 1 hour

**Total: ~10 hours**
