# Implementation Plan

## Overview

This implementation plan fixes the trajectory coordinate conversion error by creating a proper data transformation pipeline between OSDU data retrieval and Minecraft coordinate conversion.

## Tasks

- [x] 1. Fix OSDU data retrieval to return structured JSON
  - Modify `get_trajectory_coordinates_live()` in `edicraft-agent/tools/osdu_client.py`
  - Return JSON with coordinates array instead of human-readable text
  - Include metadata about data source and format
  - Preserve coordinate information in structured format
  - _Requirements: 1.1, 1.2_

- [x] 2. Create trajectory data parser
  - [x] 2.1 Implement `parse_trajectory_data()` function in `edicraft-agent/tools/trajectory_tools.py`
    - Parse JSON input and validate structure
    - Detect data format (coordinates vs survey data)
    - Validate required fields are present
    - Return standardized parsed data structure
    - _Requirements: 1.2, 2.1, 2.2_
  
  - [x] 2.2 Add data validation logic
    - Check for coordinates array with x, y, z fields
    - Check for survey data with tvd, azimuth, inclination fields
    - Return clear error messages for missing fields
    - Handle malformed JSON gracefully
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Create direct coordinate transformer
  - [x] 3.1 Implement `transform_coordinates_to_minecraft()` function in `edicraft-agent/tools/trajectory_tools.py`
    - Accept list of coordinate dictionaries
    - Convert to tuple format for existing transformation function
    - Call `transform_trajectory_to_minecraft()` from coordinates module
    - Return JSON with Minecraft coordinates
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 3.2 Add trajectory statistics calculation
    - Calculate max depth from coordinates
    - Calculate horizontal displacement
    - Include statistics in output JSON
    - _Requirements: 3.4_

- [x] 4. Update workflow orchestrator
  - [x] 4.1 Modify `build_wellbore_trajectory_complete()` in `edicraft-agent/tools/workflow_tools.py`
    - Add data parsing step after OSDU retrieval
    - Validate parsed data before proceeding
    - Branch based on data format (coordinates vs survey)
    - _Requirements: 1.1, 3.1, 3.5_
  
  - [x] 4.2 Implement branching logic for data formats
    - If coordinates format: use `transform_coordinates_to_minecraft()`
    - If survey format: use existing `calculate_trajectory_coordinates()`
    - Handle unknown formats with clear error
    - _Requirements: 3.2, 3.3_
  
  - [x] 4.3 Enhance error handling
    - Add try-catch blocks for each step
    - Provide context about which step failed
    - Log input data format on errors
    - Return actionable error messages
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 5. Test with WELL-005 data
  - [x] 5.1 Test OSDU data retrieval
    - Verify JSON structure is correct
    - Verify coordinates are present
    - Check metadata fields
    - _Requirements: 1.1, 1.2_
  
  - [x] 5.2 Test data parsing
    - Verify parser detects coordinate format
    - Verify validation passes for valid data
    - Test error handling for invalid data
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.3 Test coordinate transformation
    - Verify Minecraft coordinates are generated
    - Check coordinate ranges are reasonable
    - Verify statistics are calculated
    - _Requirements: 3.4, 3.5_
  
  - [x] 5.4 Test complete workflow end-to-end
    - Run "Build trajectory for WELL-005" query
    - Verify success message is returned
    - Check no JSON parsing errors occur
    - Verify wellbore is built in Minecraft
    - _Requirements: 1.5, 3.5_

- [x] 6. Validate error handling
  - [x] 6.1 Test with invalid trajectory ID
    - Verify appropriate error message
    - Check no crashes occur
    - _Requirements: 2.4, 2.5_
  
  - [x] 6.2 Test with malformed data
    - Test with invalid JSON
    - Test with missing required fields
    - Verify clear error messages
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 6.3 Test authentication failures
    - Mock authentication failure
    - Verify error message is clear
    - _Requirements: 2.5_

- [x] 7. Deploy and verify in production
  - Deploy updated Lambda functions
  - Test with real user query
  - Verify CloudWatch logs show no errors
  - Confirm wellbore visualization works
  - _Requirements: 1.5, 3.5_
