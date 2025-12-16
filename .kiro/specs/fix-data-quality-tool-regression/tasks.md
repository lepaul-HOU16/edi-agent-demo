# Implementation Plan

- [x] 1. Add data retrieval tools to Lambda handler
  - Implement list_wells tool to return all available wells from S3
  - Implement get_well_info tool to return well header and available curves
  - Implement get_curve_data tool to return curve values for specified depth range
  - Implement calculate_statistics tool to return min, max, mean, median for curves
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 1.1 Write property test for data retrieval tools
  - **Property 6: S3 Data Retrieval**
  - **Validates: Requirements 3.5, 8.3**

- [x] 2. Add data quality assessment helper functions
  - Create assess_curve_quality_impl() function for single curve analysis
  - Create calculate_data_completeness_impl() function for completeness metrics
  - Create validate_environmental_corrections_impl() function for correction validation
  - Add quality flag logic (excellent, good, fair, poor) based on metrics
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5_

- [ ]* 2.1 Write property test for data completeness calculation
  - **Property 4: Data Completeness Calculation**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [ ]* 2.2 Write property test for quality flag consistency
  - **Property 5: Quality Flag Consistency**
  - **Validates: Requirements 1.3, 2.2, 2.3, 2.4**

- [x] 3. Implement assess_well_data_quality tool
  - Add elif branch for assess_well_data_quality in tool router
  - Fetch LAS file from S3 for specified well
  - Iterate through all curves and assess quality using helper function
  - Calculate overall well quality summary (average completeness, outliers, noise)
  - Return response with artifacts containing quality results
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 3.1 Write property test for tool recognition
  - **Property 1: Tool Recognition**
  - **Validates: Requirements 1.1, 2.1, 3.1, 3.2, 3.3, 3.4, 4.1, 5.1, 7.2**

- [x] 4. Implement assess_curve_quality tool
  - Add elif branch for assess_curve_quality in tool router
  - Fetch LAS file from S3 for specified well
  - Extract specified curve data
  - Call assess_curve_quality_impl() helper function
  - Return response with artifacts containing curve quality results
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Implement calculate_data_completeness tool
  - Add elif branch for calculate_data_completeness in tool router
  - Fetch LAS file from S3 for specified well
  - Extract specified curve data
  - Call calculate_data_completeness_impl() helper function
  - Return response with completeness metrics
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 6. Implement validate_environmental_corrections tool
  - Add elif branch for validate_environmental_corrections in tool router
  - Fetch LAS file from S3 for specified well
  - Extract specified curve data
  - Call validate_environmental_corrections_impl() helper function
  - Return response with validation status and recommendations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 7. Add consistent response formatting
  - Ensure all tools return success, message, artifacts fields on success
  - Ensure all tools return success=False, error field on failure
  - Add artifact structure with messageContentType, analysisType, wellName, results
  - Validate response format in each tool implementation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 7.1 Write property test for response format consistency
  - **Property 2: Response Format Consistency**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ]* 7.2 Write property test for error response format
  - **Property 3: Error Response Format**
  - **Validates: Requirements 6.4, 6.5, 8.1, 8.2, 8.3, 8.4**

- [x] 8. Improve error handling and messages
  - Add clear error message for missing well (include well name)
  - Add clear error message for missing curves (list missing curve names)
  - Add clear error message for S3 access failures (include bucket and key)
  - Add clear error message for LAS parsing failures (include parsing details)
  - Ensure no mock or fake data is returned on errors
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 8.1 Write property test for no mock data
  - **Property 7: No Mock Data**
  - **Validates: Requirements 8.5**

- [ ]* 8.2 Write property test for parameter validation
  - **Property 8: Parameter Validation**
  - **Validates: Requirements 7.3**

- [ ]* 8.3 Write property test for curve existence check
  - **Property 9: Curve Existence Check**
  - **Validates: Requirements 8.2**

- [ ]* 8.4 Write property test for statistics calculation
  - **Property 10: Statistics Calculation**
  - **Validates: Requirements 3.4**

- [x] 9. Checkpoint - Deploy and test all backend tools
  - Deploy Lambda with all 11 tools: `cd cdk && npm run deploy`
  - Test on localhost: `npm run dev`
  - Verify assess_well_data_quality works without "Unknown tool" error
  - Verify all data retrieval tools work correctly
  - Verify all quality assessment tools return proper artifacts
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Fix verbose message text in assess_well_data_quality
  - Open petrophysics-calculator handler.py
  - Simplify the message text to be concise (1-2 sentences max)
  - Remove detailed curve-by-curve summary from message text (artifact shows this)
  - Keep only: overall quality, well name, and curve count in message
  - Ensure artifact still contains full data for CloudscapeDataQualityDisplay
  - Verify progress bar renders correctly in artifact (not in message text)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ]* 10.1 Write property test for progress bar rendering
  - **Property 11: Progress Bar Rendering**
  - **Validates: Requirements 9.1, 9.2**

- [ ]* 10.2 Write property test for progress bar color
  - **Property 12: Progress Bar Color**
  - **Validates: Requirements 9.4, 9.5**

- [x] 11. Final checkpoint - Test complete data quality flow
  - Test on localhost: `npm run dev`
  - Request data quality assessment for a well
  - Verify backend returns quality metrics without errors
  - Verify frontend displays progress bar for data completeness
  - Verify progress bar color matches completeness threshold (red < 90%, green >= 90%)
  - Verify all quality metrics display correctly
  - Ensure all tests pass, ask the user if questions arise.
