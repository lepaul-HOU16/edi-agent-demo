# Implementation Plan

## Task Overview

This implementation plan provides a systematic approach to diagnosing and fixing the renewable agent issues. Each task builds on the previous one, starting with logging and configuration verification, then moving to testing and fixing specific issues.

- [x] 1. Add comprehensive logging throughout the message flow
  - Add frontend logging in ChatBox and chatUtils
  - Add backend logging in Chat Lambda, Agent Router, Proxy Agent, and Orchestrator
  - Deploy changes and verify logs appear in CloudWatch
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2. Verify environment configuration
  - [ ] 2.1 Check Chat Lambda environment variables
    - Verify STORAGE_BUCKET is set
    - Verify CHAT_MESSAGE_TABLE is set
    - Verify all required table names are set
    - Verify PETROPHYSICS_CALCULATOR_FUNCTION_NAME is set
    - _Requirements: 3.2_
  
  - [ ] 2.2 Check Renewable Proxy Agent configuration
    - Verify getRenewableConfig() returns valid config
    - Verify orchestrator function name is correct
    - Verify region is set
    - Log configuration at agent initialization
    - _Requirements: 3.1, 3.2_
  
  - [ ] 2.3 Check Renewable Orchestrator environment variables
    - Verify RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME is set
    - Verify RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME is set
    - Verify RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME is set
    - Verify RENEWABLE_S3_BUCKET is set
    - Verify SESSION_CONTEXT_TABLE is set
    - _Requirements: 3.2_
  
  - [ ] 2.4 Verify IAM permissions
    - Check Chat Lambda can invoke orchestrator
    - Check Orchestrator can invoke tool Lambdas
    - Check all Lambdas can access DynamoDB tables
    - Check all Lambdas can access S3 bucket
    - _Requirements: 3.1, 3.2_

- [ ] 3. Test petrophysics agent (baseline verification)
  - [ ] 3.1 Send petrophysics query through UI
    - Use explicit agent selection (petrophysics)
    - Verify message appears in chat
    - Verify response is generated
    - Verify artifacts display correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 3.2 Review petrophysics agent logs
    - Check Chat Lambda logs
    - Check Agent Router logs
    - Check Petrophysics Agent logs
    - Verify no errors in flow
    - _Requirements: 6.5_

- [ ] 4. Test renewable agent routing
  - [ ] 4.1 Verify renewable agent initialization
    - Check Agent Router constructor logs
    - Verify RenewableProxyAgent is created
    - Verify renewableEnabled flag is true
    - Check for initialization errors
    - _Requirements: 2.5_
  
  - [ ] 4.2 Test explicit renewable agent selection
    - Select renewable agent in UI
    - Send simple query: "Analyze terrain at 40.7128, -74.0060"
    - Check Agent Router logs for routing decision
    - Verify "Routing to Renewable Energy Agent" is logged
    - _Requirements: 2.1, 2.3_
  
  - [ ] 4.3 Test auto agent selection
    - Set agent to 'auto'
    - Send renewable query
    - Check Agent Router pattern matching logs
    - Verify renewable agent is selected
    - _Requirements: 2.2, 2.3_

- [ ] 5. Test orchestrator invocation
  - [ ] 5.1 Verify proxy agent invokes orchestrator
    - Check Proxy Agent logs for Lambda invocation
    - Verify InvokeCommand is sent
    - Verify InvocationType is 'RequestResponse' (synchronous)
    - Check for invocation errors
    - _Requirements: 3.1, 3.2_
  
  - [ ] 5.2 Verify orchestrator receives request
    - Check Orchestrator CloudWatch logs
    - Verify query is received
    - Verify sessionId and userId are present
    - Check for parsing errors
    - _Requirements: 3.2_
  
  - [ ] 5.3 Verify orchestrator processes query
    - Check intent detection logs
    - Verify tool Lambda is invoked
    - Check for tool invocation errors
    - Verify results are generated
    - _Requirements: 3.3_
  
  - [ ] 5.4 Verify orchestrator returns artifacts
    - Check orchestrator response structure
    - Verify artifacts array is present
    - Verify thoughtSteps array is present
    - Check artifact data structure
    - _Requirements: 3.3, 3.4_

- [ ] 6. Test message persistence
  - [ ] 6.1 Verify user message is saved
    - Check Chat Lambda logs for "Saving user message"
    - Query DynamoDB for user message
    - Verify message has correct structure
    - Verify createdAt and updatedAt are set
    - _Requirements: 4.1_
  
  - [ ] 6.2 Verify AI message is saved
    - Check Chat Lambda logs for "Saving AI response"
    - Query DynamoDB for AI message
    - Verify message has correct structure
    - Verify responseComplete is true
    - _Requirements: 4.2, 4.5_
  
  - [ ] 6.3 Verify artifacts are included in AI message
    - Check AI message in DynamoDB
    - Verify artifacts array is present
    - Verify artifacts have correct structure
    - Verify artifacts are not empty
    - _Requirements: 4.4_
  
  - [ ] 6.4 Check for duplicate messages
    - Query DynamoDB for messages by sessionId
    - Verify no duplicate user messages
    - Verify no duplicate AI messages
    - Check message IDs are unique
    - _Requirements: 4.3_

- [ ] 7. Test API response format
  - [ ] 7.1 Verify Chat Lambda response structure
    - Check response has success field
    - Check response has message field
    - Check response has response.text field
    - Check response has response.artifacts field
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 7.2 Verify artifact format in response
    - Check artifacts array structure
    - Verify each artifact has type field
    - Verify each artifact has data field
    - Verify data has messageContentType field
    - _Requirements: 5.3_
  
  - [ ] 7.3 Test API response in browser
    - Check browser network tab
    - Verify HTTP 200 status code
    - Verify response body structure
    - Check for JSON parsing errors
    - _Requirements: 5.4_

- [ ] 8. Test frontend display
  - [ ] 8.1 Verify message appears in chat
    - Check ChatBox component state
    - Verify user message is added to messages array
    - Verify AI message is added to messages array
    - Check for rendering errors
    - _Requirements: 1.1, 1.3_
  
  - [ ] 8.2 Verify loading indicator
    - Check isLoading state
    - Verify loading indicator shows during processing
    - Verify loading indicator hides after response
    - Check for stuck loading states
    - _Requirements: 1.2_
  
  - [ ] 8.3 Verify artifacts are displayed
    - Check ChatMessage component receives artifacts
    - Verify artifact components are rendered
    - Check for "No response generated" errors
    - Verify artifact data is passed correctly
    - _Requirements: 1.4, 1.5_

- [ ] 9. Fix identified issues
  - [ ] 9.1 Fix configuration issues
    - Set missing environment variables
    - Update CDK stack if needed
    - Redeploy affected Lambdas
    - Verify configuration in CloudWatch logs
    - _Requirements: 3.1, 3.2_
  
  - [ ] 9.2 Fix routing issues
    - Fix agent initialization if broken
    - Fix pattern matching if needed
    - Update agent selection logic if needed
    - Test routing with various queries
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 9.3 Fix orchestrator invocation issues
    - Fix Lambda function name if incorrect
    - Fix IAM permissions if missing
    - Fix payload format if incorrect
    - Test invocation directly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ] 9.4 Fix message persistence issues
    - Fix DynamoDB table names if incorrect
    - Fix message structure if invalid
    - Fix artifact serialization if broken
    - Test persistence with various message types
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 9.5 Fix API response format issues
    - Fix response structure if incorrect
    - Fix artifact transformation if broken
    - Fix error handling if inadequate
    - Test API response with various scenarios
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 9.6 Fix frontend display issues
    - Fix message state management if broken
    - Fix artifact rendering if broken
    - Fix loading state management if broken
    - Test UI with various message types
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 10. End-to-end verification
  - [ ] 10.1 Test complete renewable workflow
    - Send terrain analysis query
    - Verify message appears immediately
    - Verify loading indicator shows
    - Verify response is generated
    - Verify artifacts display correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 10.2 Test error scenarios
    - Test with invalid coordinates
    - Test with missing parameters
    - Test with orchestrator timeout
    - Verify error messages are clear
    - Verify error handling is graceful
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 10.3 Verify logging completeness
    - Review all CloudWatch log groups
    - Verify logs at each integration point
    - Verify error logs include stack traces
    - Check for missing or incomplete logs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 10.4 Test petrophysics agent (regression check)
    - Send petrophysics query
    - Verify it still works correctly
    - Verify no impact from renewable fixes
    - Check for any regressions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Notes

- Start with Task 1 (logging) to ensure visibility into all subsequent tests
- Task 2 (configuration) is critical - many issues may be configuration-related
- Task 3 (petrophysics baseline) helps isolate renewable-specific issues
- Tasks 4-8 are diagnostic - they identify issues without fixing them
- Task 9 contains the actual fixes based on findings from Tasks 4-8
- Task 10 is final verification that everything works end-to-end

## Testing Commands

### Test Petrophysics Agent
```bash
# In browser console
"Calculate porosity for WELL-001 using density method"
```

### Test Renewable Agent (Explicit Selection)
```bash
# Select renewable agent in UI, then send:
"Analyze terrain at 40.7128, -74.0060"
```

### Test Renewable Agent (Auto Selection)
```bash
# Set agent to 'auto', then send:
"I want to analyze wind farm terrain at coordinates 40.7128, -74.0060"
```

### Query DynamoDB for Messages
```bash
aws dynamodb query \
  --table-name ChatMessage-<hash>-NONE \
  --index-name chatSessionId-index \
  --key-condition-expression "chatSessionId = :sessionId" \
  --expression-attribute-values '{":sessionId":{"S":"<session-id>"}}'
```

### Check CloudWatch Logs
```bash
# Chat Lambda logs
aws logs tail /aws/lambda/<stack-name>-chat --follow

# Orchestrator logs
aws logs tail /aws/lambda/renewable-orchestrator --follow

# API Gateway logs
aws logs tail /aws/apigateway/<stack-name>-http-api --follow
```
