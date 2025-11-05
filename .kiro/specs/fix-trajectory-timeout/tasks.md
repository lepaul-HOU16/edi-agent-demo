# Implementation Plan

- [ ] 1. Update Lambda timeout configuration
  - Modify `amplify/functions/edicraftAgent/resource.ts` to set `timeoutSeconds: 900`
  - Add initialization logging to confirm timeout value
  - Deploy configuration change via sandbox restart
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Verify Lambda configuration deployment
  - Use AWS CLI to check deployed Lambda timeout value
  - Verify timeout is set to 900 seconds in AWS Console
  - Check memory allocation remains at 1024 MB
  - Document verification commands in test file
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 3. Implement progress tracking in Python agent
  - [ ] 3.1 Add progress tracking function to `edicraft-agent/agent.py`
    - Create `track_trajectory_progress()` function
    - Calculate completion percentage
    - Estimate remaining time based on average
    - Log progress at each trajectory completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 3.2 Integrate progress tracking into trajectory workflow
    - Call progress tracker before each trajectory visualization
    - Track start time at workflow beginning
    - Calculate elapsed time for each trajectory
    - Log final completion summary
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Implement timeout-aware response handling
  - [ ] 4.1 Add timeout detection to TypeScript handler
    - Track execution start time in `handler.ts`
    - Check elapsed time before each major operation
    - Implement early return at 850-second mark
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 4.2 Create timeout response interfaces
    - Define `TimeoutAwareResponse` interface
    - Add `partialCompletion` flag
    - Include `completedCount` and `totalRequested` fields
    - Add `visualizationComplete` boolean
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 4.3 Implement response formatting logic
    - Format success response for complete workflows
    - Format partial success for timeout scenarios
    - Distinguish timeout-after-completion from failures
    - Provide clear user-facing messages
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Test single trajectory workflow
  - Create test script for single trajectory request
  - Verify completion within timeout
  - Check response format correctness
  - Validate CloudWatch logs show progress
  - Confirm no regressions from configuration change
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6. Test multi-trajectory workflow (5 trajectories)
  - Create test script for 5-trajectory request
  - Verify all trajectories complete within timeout
  - Check progress logging in CloudWatch
  - Validate response includes all trajectory statuses
  - Measure total execution time
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [ ] 7. Test multi-trajectory workflow (10 trajectories)
  - Create test script for 10-trajectory request
  - Verify completion or graceful timeout handling
  - Check partial completion response if timeout occurs
  - Validate user receives appropriate feedback
  - Measure execution time and compare to timeout
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1_

- [ ]* 8. Implement RCON command batching optimization
  - [ ]* 8.1 Add command batching to `rcon_executor.py`
    - Implement batch command queue
    - Set batch size to 100 commands
    - Process batches with minimal delay
    - _Requirements: 3.2_
  
  - [ ]* 8.2 Measure performance improvement
    - Test single trajectory with and without batching
    - Compare execution times
    - Validate no visual differences in Minecraft
    - _Requirements: 3.2_
  
  - [ ]* 8.3 Deploy batching if beneficial
    - Deploy if >10% performance improvement
    - Monitor for any regressions
    - Document performance gains
    - _Requirements: 3.2_

- [ ] 9. End-to-end user workflow validation
  - Test trajectory selection in UI
  - Submit multi-trajectory visualization request
  - Verify success response received
  - Check Minecraft visualization completes
  - Validate no timeout errors displayed to user
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 10. Documentation and monitoring setup
  - Document new timeout configuration
  - Add CloudWatch dashboard for trajectory metrics
  - Create runbook for timeout troubleshooting
  - Update user documentation with multi-trajectory limits
  - _Requirements: 4.1, 4.2, 4.3, 4.4_
