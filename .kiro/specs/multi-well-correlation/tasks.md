# Multi-Well Correlation Workflow - Implementation Tasks

## Phase 1: Data Matrix Visualization

- [ ] 1. Implement data matrix generation in petrophysics calculator
  - Add `generate_data_matrix()` function to handler.py
  - Scan all 24 LAS files and extract curve availability
  - Calculate completeness percentages for each well-curve combination
  - Return artifact in data_matrix format
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Add intent detection for data matrix queries
  - Add patterns to enhancedStrandsAgent.ts for "data matrix", "show available data"
  - Route to data matrix handler
  - Test with various query phrasings
  - _Requirements: 1.1, 5.1_

- [ ] 3. Create DataMatrixComponent frontend component
  - Build React component using Plotly heatmap
  - Display wells as rows, curves as columns
  - Color code by completeness percentage
  - Add hover tooltips showing exact percentages
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 4. Add click handling for well selection
  - Implement onClick handler in DataMatrixComponent
  - Trigger follow-up query for selected well
  - Maintain context of selected well
  - _Requirements: 1.5, 5.3_

- [ ] 4.1 Write integration tests for data matrix
  - Test matrix generation with all 24 wells
  - Verify completeness calculations
  - Test artifact format
  - _Requirements: 1.1, 1.2, 1.3_

## Phase 2: Data Quality Assessment

- [ ] 5. Implement data quality assessment tool
  - Add `assess_well_data_quality()` function to handler.py
  - Read LAS file for specified well
  - Analyze each curve for completeness, outliers, gaps
  - Identify quality issues with depth ranges
  - Return artifact with log data and annotations
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 6. Create DataQualityPlotComponent
  - Build React component using Plotly for log plots
  - Display multiple curves in separate tracks
  - Render quality issue annotations as highlighted zones
  - Add hover tooltips for issue descriptions
  - Show summary statistics panel
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Integrate quality assessment with matrix clicks
  - Update agent to handle well selection from matrix
  - Generate quality plot when well is clicked
  - Display quality plot as new artifact in chat
  - _Requirements: 2.1, 5.2, 5.3_

- [ ] 7.1 Write tests for data quality assessment
  - Test quality analysis on wells with known issues
  - Verify outlier detection
  - Verify gap identification
  - Test annotation generation
  - _Requirements: 2.2, 2.3, 2.4_

## Phase 3: Multi-Well Correlation Analysis

- [ ] 8. Implement correlation analysis tool
  - Add `run_correlation_analysis()` function to handler.py
  - Calculate porosity, shale volume, saturation for each well
  - Apply cutoff criteria to identify reservoir zones
  - Correlate zones across wells by depth
  - Calculate gross and net pay for each zone
  - _Requirements: 3.1, 3.2, 3.5_

- [ ] 9. Add cutoff parameter handling
  - Parse cutoff values from user query or use defaults
  - Validate cutoff ranges (0-1 for fractions, reasonable for other params)
  - Document cutoffs used in response
  - _Requirements: 3.2, 3.3_

- [ ] 10. Implement net pay calculation
  - For each zone, calculate thickness where all cutoffs are met
  - Sum net pay across depth intervals
  - Handle missing data gracefully
  - _Requirements: 3.5, 4.1, 4.2_

- [ ] 11. Create CorrelationReportComponent
  - Build React component for professional report display
  - Show cutoffs used in header
  - Display zone-by-zone table with all wells
  - Include depth ranges, net pay, and properties
  - Add summary statistics section
  - _Requirements: 3.4, 3.5, 4.2, 4.4_

- [ ] 11.1 Write tests for correlation analysis
  - Test zone identification with known data
  - Verify net pay calculations
  - Test with different cutoff values
  - Test with missing curves
  - _Requirements: 3.1, 3.2, 4.1_

## Phase 4: NPV Calculation

- [ ] 12. Implement NPV calculation logic
  - Add economic parameters (oil price, recovery factor, costs)
  - Calculate reserves from net pay, porosity, saturation
  - Apply economic model to calculate NPV per zone
  - Sum NPV across all zones
  - _Requirements: 4.3, 4.4_

- [ ] 13. Add NPV to correlation report
  - Display NPV for each zone in each well
  - Show total field NPV in summary
  - Document assumptions used
  - Add configurable parameters for sensitivity
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 14. Add parameter configuration
  - Allow users to specify economic parameters in query
  - Provide sensible defaults
  - Document all assumptions in report
  - _Requirements: 4.5, 5.4_

- [ ] 14.1 Write tests for NPV calculation
  - Test with known reserves and prices
  - Verify NPV formula
  - Test with different economic scenarios
  - _Requirements: 4.3, 4.4_

## Phase 5: Workflow Integration

- [ ] 15. Add conversational flow management
  - After matrix, suggest "Click a well to see data quality"
  - After quality, suggest "Run correlation on selected wells"
  - After correlation, suggest "Adjust cutoffs" or "Add more wells"
  - _Requirements: 5.2, 5.4_

- [ ] 16. Implement context preservation
  - Store selected wells in session context
  - Remember cutoff values across queries
  - Allow incremental refinement
  - _Requirements: 5.3, 5.4_

- [ ] 17. Add example prompts to UI
  - "Show me the data matrix for all wells"
  - "What's the data quality for WELL-001?"
  - "Run correlation on WELL-001, WELL-002, WELL-003"
  - _Requirements: 5.1, 5.2_

- [ ] 17.1 End-to-end workflow testing
  - Test complete workflow from matrix to NPV
  - Verify context preservation
  - Test with different well combinations
  - Verify all artifacts render correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Phase 6: Polish and Optimization

- [ ] 18. Optimize performance
  - Cache LAS file parsing results
  - Vectorize calculations with numpy
  - Limit artifact sizes for DynamoDB
  - _Design: Performance Considerations_

- [ ] 19. Add error handling
  - Handle missing wells gracefully
  - Provide helpful messages for invalid cutoffs
  - Handle wells with insufficient data
  - _Design: Error Handling_

- [ ] 20. Update documentation
  - Add workflow examples to user guide
  - Document economic assumptions
  - Create demo video script
  - _Requirements: All_
