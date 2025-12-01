# Implementation Plan

- [x] 1. Fix ChainOfThoughtDisplay to remove duplicate Thinking indicator
  - Remove ThinkingIndicator rendering from ChainOfThoughtDisplay component
  - Only render the component when thoughtSteps.length > 0
  - Update component to be purely for displaying thought steps, not managing waiting states
  - Test locally that only one indicator appears during processing
  - _Requirements: 1.1, 1.2, 1.4_

- [ ]* 1.1 Write property test for single thinking indicator
  - **Property 1: Single Thinking Indicator**
  - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 2. Deploy frontend fix for thinking indicators
  - Run `./deploy-frontend.sh` to deploy ChainOfThoughtDisplay changes
  - Wait 1-2 minutes for CloudFront cache invalidation
  - Test at production URL: https://d2hkqpgqguj4do.cloudfront.net
  - Verify only one Thinking indicator appears
  - Verify indicator disappears when response completes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement streaming message cleanup function
  - Create cleanupStreamingMessages function in `cdk/lambda-functions/shared/thoughtStepStreaming.ts`
  - Query DynamoDB for messages with role='ai-stream' for given sessionId
  - Delete all matching streaming messages
  - Return count of deleted messages and any errors
  - Add comprehensive logging for cleanup operations
  - Handle errors gracefully without blocking
  - _Requirements: 2.1, 2.2_

- [ ]* 3.1 Write property test for streaming message cleanup
  - **Property 2: Streaming Message Cleanup**
  - **Validates: Requirements 2.1, 2.2**

- [ ]* 3.2 Write unit tests for cleanup function
  - Test cleanup deletes correct messages
  - Test cleanup handles empty results
  - Test cleanup doesn't delete non-streaming messages
  - Test error handling
  - _Requirements: 2.1, 2.2_

- [x] 4. Integrate cleanup into chat handler
  - Import cleanupStreamingMessages in chat Lambda handler
  - Call cleanup after storing final response to DynamoDB
  - Add error handling for cleanup failures
  - Log cleanup results (number of messages deleted)
  - Ensure cleanup doesn't block response delivery
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 5. Add frontend cleanup for stale messages
  - Add timestamp check in ChatPage when loading messages
  - Ignore streaming messages older than 5 minutes
  - Log warning if stale messages detected
  - Update UI to not show stale Thinking indicators
  - _Requirements: 2.3, 2.4_

- [ ]* 5.1 Write property test for indicator removal
  - **Property 3: Indicator Removal on Completion**
  - **Validates: Requirements 2.3, 2.4**

- [x] 6. Deploy backend cleanup changes
  - Run `cd cdk && npm run deploy` to deploy cleanup function and integration
  - Verify Lambda functions updated successfully
  - Check CloudWatch logs for cleanup operations
  - Monitor for any errors in cleanup execution
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 7. Test cleanup in production
  - Send test queries and verify streaming messages are cleaned up
  - Reload page and verify no stale indicators appear
  - Check DynamoDB to confirm streaming messages are deleted
  - Monitor CloudWatch logs for cleanup success/errors
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 8. Checkpoint - Verify thinking indicators and cleanup working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Revert General Knowledge Agent to working streaming implementation
  - Use git history to find last working version before BaseEnhancedAgent changes
  - Restore direct use of addStreamingThoughtStep and updateStreamingThoughtStep
  - Remove BaseEnhancedAgent inheritance if present
  - Ensure all streaming function calls are properly awaited
  - Add comments explaining why direct streaming is used
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 9.1 Write property test for immediate DynamoDB writes
  - **Property 4: Immediate DynamoDB Writes**
  - **Validates: Requirements 3.1, 3.2**

- [ ]* 9.2 Write property test for incremental display
  - **Property 5: Incremental Thought Step Display**
  - **Validates: Requirements 3.3**

- [x] 10. Test General Knowledge Agent locally
  - Run local development environment
  - Send test query to General Knowledge Agent
  - Verify thought steps appear incrementally (not batched)
  - Measure timing between steps (should be 3-5 seconds)
  - Verify steps are written to DynamoDB immediately
  - Check that all streaming operations are awaited
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 11. Deploy General Knowledge Agent fix
  - Run `cd cdk && npm run deploy` to deploy reverted agent
  - Verify Lambda function updated successfully
  - Check CloudWatch logs for any errors
  - Monitor deployment completion
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Test streaming in production
  - Send test query to General Knowledge Agent at production URL
  - Verify thought steps stream incrementally
  - Verify no batching occurs
  - Verify timing is approximately 3-5 seconds between steps
  - Test with multiple queries to ensure consistency
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 13. Fix BaseEnhancedAgent streaming methods (optional improvement)
  - Make streamThoughtStep async and await DynamoDB writes
  - Update all agents using BaseEnhancedAgent to benefit from fix
  - Add tests for BaseEnhancedAgent streaming
  - Document proper usage of BaseEnhancedAgent streaming
  - _Requirements: 3.5_

- [ ]* 13.1 Write property test for awaited streaming operations
  - **Property 6: Awaited Streaming Operations**
  - **Validates: Requirements 3.5**

- [ ] 14. Checkpoint - Verify streaming restored
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Add comprehensive project context logging
  - Add logging in artifact components when setActiveProject is called
  - Add logging in WorkflowCTAButtons when including projectContext in API calls
  - Add logging in Lambda handler when extracting projectContext from request
  - Add logging in agent router when passing projectContext to agents
  - Add logging in agents when receiving projectContext
  - Use consistent emoji prefixes for easy log filtering
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.4, 5.5_

- [x] 16. Deploy backend with project context logging
  - Run `cd cdk && npm run deploy` to deploy logging changes
  - Verify Lambda functions updated successfully
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 17. Test and trace project context flow
  - Load renewable project artifact in production
  - Click workflow button
  - Examine CloudWatch logs to trace projectContext through entire flow
  - Identify where projectContext is lost or becomes undefined
  - Document the exact point of failure
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 17.1 Write property test for project context extraction
  - **Property 7: Project Context Extraction**
  - **Validates: Requirements 4.1**

- [ ]* 17.2 Write property test for project context in requests
  - **Property 8: Project Context in Requests**
  - **Validates: Requirements 4.2, 4.4**

- [ ]* 17.3 Write property test for project context flow
  - **Property 9: Project Context Flow**
  - **Validates: Requirements 4.3**

- [x] 18. Fix identified project context issue
  - Based on findings from step 17, implement the fix
  - If context is lost in frontend: Fix WorkflowCTAButtons or API call
  - If context is lost in backend: Fix Lambda handler or agent router
  - If context is not extracted: Fix artifact components
  - Add validation to ensure context is present at each step
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 18.1 Write unit tests for project context extraction
  - Test extraction from various artifact data structures
  - Test handling of missing fields
  - Test handling of malformed data
  - _Requirements: 4.1_

- [x] 19. Add error handling for missing project context
  - Update WorkflowCTAButtons to check for activeProject before sending request
  - Display Alert component when no active project is set
  - Disable workflow buttons when activeProject is null
  - Add tooltip explaining that a project must be selected
  - Log warning to console with current context state
  - _Requirements: 4.5_

- [x] 20. Deploy project context fix
  - Deploy frontend if frontend changes were made: `./deploy-frontend.sh`
  - Deploy backend if backend changes were made: `cd cdk && npm run deploy`
  - Wait for deployments to complete
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 21. Test project context in production
  - Load renewable project artifact
  - Verify project context is extracted and stored
  - Click workflow button
  - Verify request includes correct projectContext
  - Verify agent receives and uses projectContext
  - Verify action executes on correct project
  - Test error message when no project is selected
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 22. Checkpoint - Verify project context working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 23. Run comprehensive regression tests
  - Test all four agents (General Knowledge, Petrophysics, Maintenance, Renewables)
  - Verify streaming works for each agent
  - Verify only one Thinking indicator appears for each
  - Verify cleanup works after each response
  - Verify no stale indicators after page reload
  - Verify project context works for Renewables workflow
  - _Requirements: All_

- [ ]* 23.1 Write integration tests for end-to-end streaming
  - Test query → streaming → cleanup flow
  - Test multiple concurrent queries
  - Test page reload scenarios
  - _Requirements: Testing Strategy section_

- [ ]* 23.2 Write integration tests for project context flow
  - Test artifact → context → button → request → agent flow
  - Test multi-project switching
  - Test session persistence
  - _Requirements: Testing Strategy section_

- [x] 24. Monitor production for 24 hours
  - Check CloudWatch logs for errors
  - Monitor for stale streaming messages in DynamoDB
  - Monitor for duplicate Thinking indicators
  - Monitor for project context errors
  - Verify streaming performance is acceptable
  - _Requirements: All_

- [x] 25. Final checkpoint - All regressions fixed
  - Ensure all tests pass, ask the user if questions arise.

- [x] 26. Document fixes and lessons learned
  - Update project documentation with fix details
  - Document why BaseEnhancedAgent streaming doesn't work
  - Document proper streaming patterns to use
  - Document project context flow for future reference
  - Create runbook for similar issues in the future
  - _Requirements: All_
