# Implementation Plan

- [x] 1. Add orchestrator health check endpoint
  - Add health check handler to orchestrator that responds to `__health_check__` query
  - Return orchestrator metadata (function name, version, region)
  - Return tool configuration status (which tool Lambdas are configured)
  - Log environment variables on health check
  - _Requirements: 6.1, 6.2_

- [x] 1.1 Write unit tests for health check endpoint
  - Test health check returns correct metadata
  - Test health check reports tool configuration status
  - Test health check with missing environment variables
  - Test health check response structure
  - _Requirements: 6.1, 6.2_

- [x] 2. Enhance RenewableProxyAgent with comprehensive logging
  - Add detailed logging before orchestrator invocation (function name, payload)
  - Add detailed logging after orchestrator invocation (success, response structure)
  - Log execution duration for orchestrator calls
  - Add request ID tracking for correlation
  - Log project ID and feature count from responses
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 2.1 Write unit tests for RenewableProxyAgent logging
  - Test logging before orchestrator invocation
  - Test logging after successful invocation
  - Test logging after failed invocation
  - Test execution duration tracking
  - Test request ID correlation
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 3. Add orchestrator invocation validation
  - Validate orchestrator function name is set before invocation
  - Check if orchestrator Lambda exists using Lambda client
  - Add pre-flight check that runs on first invocation
  - Cache validation result to avoid repeated checks
  - Return clear error if orchestrator is not accessible
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 3.1 Write unit tests for orchestrator validation
  - Test validation with valid orchestrator function name
  - Test validation with missing function name
  - Test validation with non-existent Lambda
  - Test validation caching mechanism
  - Test error messages for validation failures
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Implement retry logic in RenewableProxyAgent
  - Add retry logic with exponential backoff (3 attempts)
  - Retry on timeout errors and transient failures
  - Don't retry on permission errors or validation errors
  - Log each retry attempt with reason
  - Return aggregated error after all retries fail
  - _Requirements: 7.1, 7.5_

- [x] 4.1 Write unit tests for retry logic
  - Test successful invocation on first attempt
  - Test retry on timeout error
  - Test retry on transient failure
  - Test no retry on permission error
  - Test exponential backoff timing
  - Test aggregated error after all retries fail
  - _Requirements: 7.1, 7.5_

- [x] 5. Add timeout detection and handling
  - Set timeout threshold (60 seconds)
  - Log warning if orchestrator takes > 30 seconds
  - Return timeout error if orchestrator takes > 60 seconds
  - Include timeout-specific remediation steps
  - Clear loading state on timeout
  - _Requirements: 1.5, 4.4, 7.2_

- [x] 5.1 Write unit tests for timeout handling
  - Test warning logged at 30 seconds
  - Test timeout error at 60 seconds
  - Test timeout error message includes remediation
  - Test loading state cleared on timeout
  - Test timeout with retry logic
  - _Requirements: 1.5, 4.4, 7.2_

- [x] 6. Enhance orchestrator logging
  - Log entry point with full request payload
  - Log intent detection results (type, confidence, params)
  - Log tool Lambda invocation (function name, payload)
  - Log tool Lambda response (success, artifact count)
  - Log project ID generation
  - Log final response structure before returning
  - Add execution time tracking for each step
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 6.1 Write unit tests for orchestrator logging
  - Test entry point logging with request payload
  - Test intent detection logging
  - Test tool Lambda invocation logging
  - Test tool Lambda response logging
  - Test project ID generation logging
  - Test execution time tracking
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 7. Verify and fix project ID generation
  - Verify orchestrator generates unique project ID in correct format
  - Ensure project ID is passed to terrain Lambda
  - Log project ID at each step of the flow
  - Verify project ID appears in final response
  - Test that multiple analyses get different project IDs
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.1 Write unit tests for project ID generation
  - Test project ID format matches expected pattern
  - Test project ID is unique for each request
  - Test project ID is passed to terrain Lambda
  - Test project ID appears in response
  - Test project ID generation with provided ID
  - Test project ID generation without provided ID
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8. Verify terrain Lambda parameter passing
  - Check orchestrator passes all required parameters to terrain Lambda
  - Verify radius_km parameter is set correctly
  - Verify project_id is included in terrain Lambda payload
  - Log full payload sent to terrain Lambda
  - Compare with working parameters from previous version
  - _Requirements: 3.1, 3.4_

- [x] 8.1 Write unit tests for terrain Lambda parameter passing
  - Test all required parameters are included
  - Test radius_km parameter value
  - Test project_id parameter value
  - Test parameter format matches expected structure
  - Test with various query inputs
  - _Requirements: 3.1, 3.4_

- [x] 9. Add response validation
  - Validate orchestrator response has required fields (success, message, artifacts)
  - Validate artifacts array structure
  - Validate project ID is present and not "default-project"
  - Log validation failures with details
  - Return clear error if response is invalid
  - _Requirements: 1.3, 2.3, 7.1_

- [x] 9.1 Write unit tests for response validation
  - Test validation with valid response
  - Test validation with missing required fields
  - Test validation with invalid artifacts structure
  - Test validation with "default-project" ID
  - Test validation error messages
  - _Requirements: 1.3, 2.3, 7.1_

- [x] 10. Implement error categorization
  - Create error type enum (NotFound, Timeout, PermissionDenied, InvalidResponse, ToolFailure)
  - Map Lambda errors to error categories
  - Provide category-specific error messages
  - Include remediation steps for each category
  - Log error category and details
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 10.1 Write unit tests for error categorization
  - Test NotFound error mapping and message
  - Test Timeout error mapping and message
  - Test PermissionDenied error mapping and message
  - Test InvalidResponse error mapping and message
  - Test ToolFailure error mapping and message
  - Test remediation steps for each category
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Create diagnostic utility
  - Create `orchestratorDiagnostics.ts` utility
  - Implement `checkOrchestratorExists()` method
  - Implement `testOrchestratorInvocation()` method
  - Implement `checkEnvironmentVariables()` method
  - Implement `runFullDiagnostics()` method
  - Return structured diagnostic results
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 11.1 Write unit tests for diagnostic utility
  - Test checkOrchestratorExists with existing Lambda
  - Test checkOrchestratorExists with non-existent Lambda
  - Test testOrchestratorInvocation with successful response
  - Test testOrchestratorInvocation with failed response
  - Test checkEnvironmentVariables with all vars set
  - Test checkEnvironmentVariables with missing vars
  - Test runFullDiagnostics returns all results
  - _Requirements: 1.1, 1.2, 6.1_

- [x] 12. Add diagnostic API endpoint
  - Create API route at `/api/renewable/diagnostics`
  - Invoke diagnostic utility from API route
  - Return diagnostic results as JSON
  - Include CloudWatch log stream links
  - Restrict access to authenticated users
  - _Requirements: 6.1, 6.4_

- [x] 12.1 Write integration tests for diagnostic API
  - Test API returns diagnostic results
  - Test API includes CloudWatch links
  - Test API requires authentication
  - Test API handles diagnostic failures
  - Test API response format
  - _Requirements: 6.1, 6.4_

- [x] 13. Create frontend diagnostic panel
  - Create `OrchestratorDiagnosticPanel.tsx` component
  - Add button to run diagnostics
  - Display diagnostic results in table format
  - Show success/failure status for each check
  - Display remediation steps for failures
  - Add link to CloudWatch logs
  - _Requirements: 6.1, 6.4_

- [x] 13.1 Write component tests for diagnostic panel
  - Test panel renders correctly
  - Test run diagnostics button triggers API call
  - Test diagnostic results display in table
  - Test success/failure status indicators
  - Test remediation steps display
  - Test CloudWatch log links
  - _Requirements: 6.1, 6.4_

- [x] 14. Test orchestrator invocation flow
  - Deploy changes to sandbox environment
  - Send terrain analysis query through UI
  - Check CloudWatch logs for orchestrator invocation
  - Verify orchestrator is called (not bypassed)
  - Verify terrain Lambda is called by orchestrator
  - Verify response includes unique project ID
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 15. Test feature count restoration
  - Send terrain analysis query for test location
  - Verify response includes all features (not limited to 60)
  - Compare feature count with previous working version
  - Check if OSM query has artificial limits
  - Verify orchestrator passes correct parameters
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 16. Test loading state completion
  - Send terrain analysis query through UI
  - Verify loading indicator appears
  - Verify loading indicator disappears when complete
  - Test with successful response
  - Test with error response
  - Test with timeout scenario
  - Verify no page reload is needed
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 17. Test error scenarios
  - Test with orchestrator not deployed (simulate by using wrong function name)
  - Test with permission denied (simulate by removing IAM permissions)
  - Test with timeout (simulate by adding delay in orchestrator)
  - Test with invalid response (simulate by returning malformed data)
  - Verify error messages are clear and helpful
  - Verify remediation steps are accurate
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 18. Run diagnostic panel tests
  - Open diagnostic panel in UI
  - Run full diagnostics
  - Verify all checks pass when orchestrator is deployed
  - Verify appropriate checks fail when orchestrator is not deployed
  - Verify remediation steps are displayed
  - Test CloudWatch log links
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 19. Document findings and fixes
  - Create summary document of root cause
  - Document what was broken and how it was fixed
  - Include before/after CloudWatch log examples
  - Document how to use diagnostic panel
  - Add troubleshooting guide for future issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 20. Fix intent detection for layout creation vs wake analysis
  - Update layout_optimization patterns to include "create", "generate", "design" keywords
  - Add exclusion patterns to wake_analysis to exclude layout creation queries
  - Add specific patterns for "create wind farm layout", "generate layout", "design layout"
  - Ensure wake_analysis only matches when analyzing existing layouts
  - Test with queries: "create a wind farm layout", "analyze wake effects", "optimize turbine placement"
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 20.1 Write tests for layout vs wake intent detection
  - Test "create wind farm layout" routes to layout_optimization
  - Test "analyze wake effects for project X" routes to wake_simulation
  - Test "optimize turbine placement" routes to layout_optimization
  - Test "wake analysis" routes to wake_simulation
  - Test confidence scores are high (>80%) for clear queries
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 21. Deploy and validate in production
  - Deploy all changes to production environment
  - Run diagnostic panel to verify orchestrator is healthy
  - Test terrain analysis with real user query
  - Test layout creation query ("create a wind farm layout at 40.7128, -74.0060")
  - Test wake analysis query ("analyze wake effects for project-123")
  - Verify project ID is unique
  - Verify feature count is correct (151 or actual OSM count)
  - Verify loading state completes properly
  - Monitor CloudWatch logs for any errors
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
