# Implementation Plan

- [x] 1. Enhance parameter validator to accept project context
  - Create ProjectContext interface in parameterValidator.ts
  - Add projectContext parameter to validateParameters() function
  - Implement canSatisfyFromContext() helper function
  - Add CONTEXT_SATISFIABLE_PARAMS mapping for each intent type
  - Update validation logic to check context before marking parameters as missing
  - Add satisfiedByContext and contextUsed fields to ParameterValidationResult
  - _Requirements: 1.1, 1.4, 2.3, 2.4, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Reorder orchestrator flow to load context before validation
  - Move project resolution step before parameter validation in handler.ts
  - Move project data loading step before parameter validation
  - Create projectContext object from loaded project data
  - Auto-fill intent parameters from project context before validation
  - Pass projectContext to validateParameters() call
  - Add logging for auto-filled parameters
  - Update thought steps to reflect new flow order
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 3. Enhance error messages for missing context
  - Add formatMissingContextError() to errorMessageTemplates.ts
  - Create intent-specific guidance messages for layout_optimization, wake_simulation, report_generation
  - Include active project name in error messages when available
  - Update formatValidationError() to use new context-aware messages
  - Add suggestions for how to provide missing information
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update validation logging
  - Add projectContext information to validation failure logs
  - Log which parameters were satisfied by context
  - Log whether context was used in validation
  - Add hasActiveProject and hasCoordinates flags to logs
  - Enhance CloudWatch log structure for better debugging
  - _Requirements: 1.4, 4.4_

- [x] 5. Create unit tests for context-aware validation
  - [x] 5.1 Test layout optimization with project coordinates
    - Create test case for valid context with coordinates
    - Verify satisfiedByContext includes latitude and longitude
    - Verify validation passes without explicit coordinates
    - _Requirements: 1.1, 4.2_
  
  - [x] 5.2 Test layout optimization without context
    - Create test case for missing context
    - Verify validation fails with missing required parameters
    - Verify error message includes helpful guidance
    - _Requirements: 3.1_
  
  - [x] 5.3 Test explicit parameters override context
    - Create test case with both explicit params and context
    - Verify explicit parameters take precedence
    - Verify satisfiedByContext is empty
    - _Requirements: 5.1_
  
  - [x] 5.4 Test wake simulation with layout context
    - Create test case for wake simulation with layout_results in context
    - Verify validation passes without explicit layout parameter
    - _Requirements: 2.4, 4.2_

- [x] 6. Create integration tests for orchestrator flow
  - [x] 6.1 Test terrain analysis followed by layout optimization
    - Run terrain analysis with coordinates
    - Run layout optimization without coordinates
    - Verify coordinates auto-filled from project
    - Verify layout optimization succeeds
    - _Requirements: 1.1, 2.1, 2.2, 2.3_
  
  - [x] 6.2 Test layout optimization followed by wake simulation
    - Run layout optimization
    - Run wake simulation without project ID
    - Verify layout data auto-filled from project
    - Verify wake simulation succeeds
    - _Requirements: 2.4_
  
  - [x] 6.3 Test error handling for missing context
    - Request layout optimization without prior terrain analysis
    - Verify helpful error message returned
    - Verify suggestions included in response
    - _Requirements: 3.1, 3.2_

- [x] 7. Create end-to-end tests for conversational workflow
  - [x] 7.1 Test complete workflow without repeating parameters
    - Run terrain analysis with coordinates
    - Run layout optimization (no coordinates)
    - Run wake simulation (no project ID)
    - Run report generation (no project ID)
    - Verify all steps succeed
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_
  
  - [x] 7.2 Test explicit parameters override context
    - Run terrain analysis at location A
    - Run layout optimization at location B (explicit coordinates)
    - Verify location B coordinates used, not location A
    - _Requirements: 5.1_
  
  - [x] 7.3 Test project switching
    - Create project A with terrain analysis
    - Create project B with terrain analysis
    - Switch to project A and run layout optimization
    - Verify project A coordinates used
    - _Requirements: 5.2_

- [x] 8. Deploy and validate fix
  - Deploy updated orchestrator to sandbox
  - Verify deployment successful
  - Test "optimize layout" after terrain analysis in UI
  - Verify coordinates auto-filled from project
  - Verify layout optimization succeeds
  - Check CloudWatch logs for proper context usage
  - Test error cases (no context, missing data)
  - Verify error messages are helpful
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 5.4_
