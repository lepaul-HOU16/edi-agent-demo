# Fix Async Polling Timeout - Tasks

## Root Cause
The renewable energy analysis uses async invocation (to avoid timeouts), and the orchestrator successfully writes results to DynamoDB. However, **the polling hook (`useRenewableJobPolling`) is not integrated into the chat UI**, so the frontend never fetches the results.

## Tasks

- [ ] 1. Integrate polling hook into chat interface
  - Add `useRenewableJobPolling` to chat page
  - Enable polling when renewable job starts
  - Handle new messages from polling
  - Display artifacts when they arrive
  - _Requirements: US1, US2_

- [ ] 2. Add visual feedback for async processing
  - Show "Processing..." indicator when job starts
  - Update indicator when polling detects results
  - Clear indicator when results render
  - _Requirements: US1_

- [ ] 3. Test end-to-end flow
  - Send terrain analysis request
  - Verify immediate "processing" response
  - Verify polling starts automatically
  - Verify results appear in 30-60 seconds
  - Verify map renders with terrain data
  - _Requirements: US1, US2_

- [ ] 4. Add error handling
  - Handle polling failures gracefully
  - Show error if results don't arrive in 2 minutes
  - Allow manual retry
  - _Requirements: US2_

## Success Criteria
- ✅ User sends terrain analysis
- ✅ Gets immediate response
- ✅ Results appear automatically
- ✅ Map renders with data
- ✅ No timeout errors
- ✅ Works consistently
