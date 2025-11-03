# Async Renewable Energy Job Pattern - Implementation Tasks

## Overview
Implement async job pattern to bypass AppSync's 30-second timeout limit for renewable energy queries.

## Tasks

- [x] 1. Backend: Modify renewable proxy agent for async invocation
  - Update `renewableProxyAgent.ts` to invoke orchestrator with `InvocationType: 'Event'`
  - Return immediately with "processing" message
  - Pass chatSessionId and userId to orchestrator for result writing
  - _Requirements: 1, 2_

- [x] 2. Backend: Ensure orchestrator writes results to DynamoDB
  - Verify `writeResultsToChatMessage` function works correctly
  - Test DynamoDB write permissions
  - Add error handling for write failures
  - _Requirements: 1, 3_

- [x] 3. Backend: Add IAM permissions for DynamoDB writes
  - Grant orchestrator permission to write to ChatMessage table
  - Grant orchestrator permission to query table name from environment
  - _Requirements: 1_

- [x] 4. Frontend: Add polling mechanism for job completion
  - Create hook to poll ChatMessage table for new messages
  - Poll every 3-5 seconds while job is processing
  - Stop polling when results appear
  - _Requirements: 2, 3_

- [x] 5. Frontend: Update UI to show processing state
  - Display "Analyzing..." message immediately
  - Show progress indicator
  - Auto-update when results arrive
  - _Requirements: 2, 3_

- [x] 6. Testing: Verify end-to-end flow
  - Test terrain query completes without timeout
  - Verify results appear in chat automatically
  - Test error scenarios
  - _Requirements: 1, 2, 3, 4_

- [x] 7. Deploy and validate
  - Deploy all changes
  - Test with real terrain query
  - Verify no timeout errors
  - Verify results display correctly
  - _Requirements: All_
