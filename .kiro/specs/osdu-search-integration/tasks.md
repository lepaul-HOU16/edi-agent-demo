# Implementation Plan

- [x] 1. Create OSDU Proxy Lambda function with secure API key handling
  - Create `amplify/functions/osduProxy/` directory structure
  - Implement `resource.ts` with Lambda definition and environment variable configuration
  - Implement `handler.ts` with OSDU API proxy logic, request validation, and error sanitization
  - Ensure API key is read from environment variables only and never logged
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 2. Add osduSearch GraphQL query to data schema
  - Update `amplify/data/resource.ts` to add osduSearch query definition
  - Define query arguments (query, dataPartition, maxResults)
  - Connect query to osduProxyFunction handler
  - Add authentication requirement for query
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Register OSDU Proxy function in backend configuration
  - Update `amplify/backend.ts` to import osduProxyFunction
  - Add osduProxyFunction to defineBackend configuration
  - Configure environment variable for OSDU_API_KEY
  - _Requirements: 5.2, 5.8_

- [x] 4. Implement frontend intent detection logic
  - Add detectSearchIntent function to `src/app/catalog/page.tsx`
  - Implement keyword-based detection for "OSDU" queries
  - Add logging for detected intent (debugging purposes)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5. Integrate OSDU search into catalog chat flow
  - Update handleChatSearch function in `src/app/catalog/page.tsx`
  - Add conditional logic to route queries based on detected intent
  - Implement OSDU query execution using amplifyClient.queries.osduSearch
  - Parse OSDU response and create Message object with formatted results
  - Add OSDU-specific loading indicator message
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Implement OSDU result display formatting
  - Format OSDU answer text with markdown
  - Display record count prominently in response
  - Convert OSDU records to table format using existing json-table-data pattern
  - Ensure results display in existing CustomAIMessage component
  - _Requirements: 4.1, 4.2, 4.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Add comprehensive error handling
  - Implement try-catch blocks for OSDU query execution
  - Create user-friendly error messages for common failure scenarios
  - Add fallback behavior when OSDU API is unavailable
  - Ensure error messages never expose API key
  - _Requirements: 4.4, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 9.4_

- [x] 8. Configure environment variables securely
  - Add OSDU_API_KEY to `.env.local.example` with placeholder value
  - Document that real API key must be set in AWS Lambda configuration
  - Verify `.env.local` is in `.gitignore`
  - Add deployment instructions for setting production API key
  - _Requirements: 5.1, 5.2, 5.5, 5.8_

- [x] 9. Deploy and verify OSDU integration
  - Deploy to sandbox environment using `npx ampx sandbox`
  - Set OSDU_API_KEY environment variable in deployed Lambda
  - Verify Lambda function is deployed and accessible
  - Check CloudWatch logs for any deployment issues
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 10. Test OSDU search functionality end-to-end
  - Test query with "OSDU" keyword routes to OSDU API
  - Test query without "OSDU" keyword routes to catalog search
  - Verify OSDU results display correctly in chat interface
  - Test error handling when API key is missing
  - Test error handling when OSDU API returns error
  - Verify API key is never exposed in browser console or network tab
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11. Create integration test script
  - Create `tests/test-osdu-search-integration.js` test file
  - Implement test cases for OSDU API connectivity
  - Add tests for intent detection logic
  - Add tests for error handling scenarios
  - Document example OSDU search queries
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 12. Add monitoring and logging
  - Add request timing metrics to Lambda function
  - Log OSDU API request/response for debugging (without API key)
  - Add CloudWatch dashboard for OSDU search metrics
  - Document how to check OSDU search logs
  - _Requirements: 9.5, 10.4_

- [x] 13. Integrate OSDU results into collection context
  - Parse OSDU search results and convert to well data format
  - Add OSDU records to analysisData state alongside catalog wells
  - Include OSDU data in searchContext when filtering/refining queries
  - Mark OSDU records with source identifier for tracking
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1, 8.2_

- [x] 14. Enable OSDU data in collection creation
  - Allow OSDU records to be selected in collection modal
  - Store OSDU source metadata in collection records
  - Preserve OSDU data when saving collections to database
  - Display OSDU records in collection detail views
  - _Requirements: 1.4, 8.1, 8.2, 8.3_

- [x] 15. Implement OSDU data inheritance in canvases
  - Load OSDU records when opening collections in workspaces
  - Display OSDU data on maps alongside catalog wells
  - Enable analysis and visualization of OSDU records
  - Maintain OSDU source attribution in all views
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1, 8.2_
