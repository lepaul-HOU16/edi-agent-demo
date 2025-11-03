# Implementation Plan

- [x] 1. Create Enhanced RCON Executor
  - Create `edicraft-agent/tools/rcon_executor.py` with RCONExecutor class
  - Implement timeout mechanism (10 seconds per command)
  - Implement retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
  - Implement command result verification and parsing
  - Create RCONResult dataclass for structured results
  - Add unit tests for timeout, retry, and verification logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement Command Batching
  - Add `batch_fill_command()` method to split large fills into 32x32x32 chunks
  - Implement `execute_fill()` method with automatic batching
  - Add logic to calculate optimal chunk sizes based on region dimensions
  - Test batching with large regions (500x255x500)
  - Verify total blocks filled matches expected count
  - _Requirements: 2.2, 7.2_

- [x] 3. Implement Result Parsers
  - Create `parse_fill_response()` to extract blocks filled count
  - Create `parse_gamerule_response()` to extract gamerule values
  - Create `is_success_response()` to detect success/failure
  - Add regex patterns for various Minecraft response formats
  - Test parsers with real Minecraft server responses
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Update Clear Environment Tool
  - Replace direct RCON calls with RCONExecutor in `clear_environment_tool.py`
  - Use batched fill commands for clearing large areas
  - Verify each block type clearing operation succeeded
  - Track blocks cleared per category (wellbores, rigs, markers)
  - Handle partial success gracefully (continue on errors)
  - Return detailed ClearOperationResult with counts and errors
  - _Requirements: 2.1, 2.3, 2.4, 2.5, 6.4_

- [x] 5. Update Time Lock Tool
  - Replace direct RCON calls with RCONExecutor in `workflow_tools.py`
  - Implement gamerule verification after setting
  - Add retry logic if gamerule verification fails (up to 3 attempts)
  - Log gamerule state before and after changes
  - Return confirmation with verified gamerule state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Fix Clear Button UI Behavior
  - Update `EDIcraftAgentLanding.tsx` to invoke agent directly without creating chat message
  - Remove `onSendMessage` call that creates visible user prompt
  - Use direct GraphQL mutation to `invokeEDIcraftAgent` with silent flag
  - Display result as Alert notification on landing page (not in chat)
  - Add auto-dismiss after 5 seconds for success messages
  - Keep error messages visible until user dismisses
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 7. Implement Response Deduplication
  - Add stable content hash generation in `EDIcraftResponseComponent.tsx`
  - Use `data-content-hash` attribute to track rendered responses
  - Add processing lock in `EnhancedArtifactProcessor` to prevent concurrent processing
  - Skip render if content hash already exists in DOM
  - Add render count tracking for debugging
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Add Error Handling and Recovery
  - Implement `format_error_response()` with categorized errors
  - Add connection error handling with RCON troubleshooting steps
  - Add timeout error handling with operation-specific messages
  - Add command error handling with syntax and permission checks
  - Add verification error handling with retry suggestions
  - Test all error scenarios (connection failed, timeout, invalid command)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Implement Performance Optimizations
  - Add parallel command execution using ThreadPoolExecutor
  - Implement smart terrain fill (skip layers with no air blocks)
  - Add response caching for gamerule queries (60 second TTL)
  - Tune batch sizes based on server performance
  - Add execution time tracking and logging
  - _Requirements: 7.1, 7.3, 7.5_

- [x] 10. Test Complete Workflows
  - Test clear operation: build wellbore → clear → verify clean
  - Test time lock: set daylight → wait 60 seconds → verify still day
  - Test terrain fill: clear with holes → verify surface repaired
  - Test clear button: click button → verify no user prompt → verify alert shown
  - Test error recovery: disconnect RCON → verify error message → reconnect → retry
  - Test performance: clear 500x255x500 region → verify completes in < 30 seconds
  - _Requirements: All_

- [x] 11. Deploy and Validate
  - Deploy updated Python tools to Lambda
  - Deploy updated React components to frontend
  - Test in actual Minecraft server environment
  - Verify clear button works without showing prompt
  - Verify time lock persists (daylight stays locked)
  - Verify terrain fill repairs surface holes
  - Verify no response duplication in chat
  - Document any issues found
  - _Requirements: All_
