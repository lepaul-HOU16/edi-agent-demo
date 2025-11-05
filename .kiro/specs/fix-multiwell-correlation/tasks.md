# Implementation Plan

- [x] 1. Implement well name extraction utility
  - Create `extractMultipleWellNames()` method in Enhanced Strands Agent
  - Use regex pattern to find all WELL-XXX mentions in query
  - Remove duplicates and normalize to uppercase
  - Return array of well names
  - _Requirements: 1.2, 2.2_

- [x] 2. Create multi-well correlation handler
  - [x] 2.1 Create `handleMultiWellCorrelation()` method signature
    - Accept message and optional wellNames parameter
    - Return Promise<any> matching other handler signatures
    - Add console logging for debugging
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Implement well name extraction and validation
    - Call `extractMultipleWellNames()` to get wells from message
    - Validate at least 2 wells are specified
    - If fewer than 2 wells, return helpful error message with available wells
    - Log extracted well names for debugging
    - _Requirements: 2.3, 2.4, 4.1, 4.2_

  - [x] 2.3 Implement well existence validation
    - Call `listWellsTool` to get available wells
    - Check each extracted well exists in available wells list
    - If wells don't exist, return error message identifying missing wells
    - Log validation results
    - _Requirements: 2.2, 4.3_

  - [x] 2.4 Implement correlation artifact generation
    - Create artifact with messageContentType 'multi_well_correlation_analysis'
    - Include all specified well names in artifact
    - Add placeholder correlation data structure
    - Include statistics (well count, common curves, depth range)
    - Add visualizations array with correlation panel description
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.5 Wire handler to processMessage() switch statement
    - Add case for 'multi_well_correlation' intent type
    - Call `handleMultiWellCorrelation()` with message
    - Ensure handler result is returned properly
    - Add logging for handler invocation
    - _Requirements: 2.1_

- [x] 3. Verify and enhance intent detection
  - Review existing multi-well correlation patterns in `detectUserIntent()`
  - Ensure patterns match preloaded prompt #2 text
  - Verify patterns don't conflict with single well analysis
  - Test pattern matching with various query formats
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 4. Implement error handling and user guidance
  - [x] 4.1 Add error handling for no wells specified
    - Detect when extractMultipleWellNames returns empty array
    - Call listWellsTool to get available wells
    - Return message with example queries and available wells list
    - _Requirements: 4.1_

  - [x] 4.2 Add error handling for single well
    - Detect when only 1 well is extracted
    - Return message explaining 2+ wells required
    - Suggest additional wells from available list
    - _Requirements: 4.2_

  - [x] 4.3 Add error handling for non-existent wells
    - Compare extracted wells against available wells
    - Identify which wells don't exist
    - Return message listing invalid wells and valid alternatives
    - _Requirements: 4.3_

- [x] 5. Test multi-well correlation workflow
  - [x] 5.1 Test with preloaded prompt #2
    - Send exact preloaded prompt text
    - Verify intent detected as 'multi_well_correlation'
    - Verify handleMultiWellCorrelation is called
    - Verify artifact is generated with all 5 wells
    - Verify no single-well dashboard is returned
    - _Requirements: 1.4, 2.1, 3.1_

  - [x] 5.2 Test with custom multi-well query
    - Send "multi-well correlation for WELL-001, WELL-002, WELL-003"
    - Verify 3 wells are extracted
    - Verify artifact contains all 3 wells
    - Verify correlation data structure is present
    - _Requirements: 1.1, 2.2, 3.1_

  - [x] 5.3 Test error scenarios
    - Test with no wells specified
    - Test with only 1 well
    - Test with non-existent wells
    - Verify helpful error messages are returned
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.4 Test for regressions
    - Verify single well analysis still works (WELL-001 info)
    - Verify porosity calculation still works
    - Verify shale volume calculation still works
    - Verify no other workflows are broken
    - _Requirements: All_

- [x] 6. Deploy and validate in sandbox
  - Deploy changes to AWS Amplify sandbox
  - Test multi-well correlation in actual chat interface
  - Verify artifacts render correctly in frontend
  - Verify no console errors
  - Get user validation that workflow is fixed
  - _Requirements: 3.5, All_
