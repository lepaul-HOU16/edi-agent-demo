# Diagnostic Checklist for Current Issues

## Issue 1: Layout Generating for Different Project

**Symptom**: When creating a layout, it's using data from a different project

**Possible Causes**:
1. Project context not being passed correctly to the renewable orchestrator
2. Frontend not sending the correct project ID
3. Backend not reading the project context from the request

**What to Check**:
- [ ] Is `activeProject` being passed in the chat request?
- [ ] Is the renewable orchestrator receiving the project context?
- [ ] Is the orchestrator using the project context to filter data?

## Issue 2: Chain of Thought Still Batching

**Symptom**: All thought steps appear at once instead of streaming in realtime

**Possible Causes**:
1. Frontend polling not enabled (but we verified it is)
2. Backend not writing to DynamoDB (most likely)
3. Session ID mismatch between frontend and backend
4. DynamoDB table permissions issue

**What to Check**:
- [ ] Are thought steps being written to DynamoDB?
- [ ] Is the session ID consistent between frontend and backend?
- [ ] Is the polling hook finding the streaming messages?
- [ ] Are there any errors in CloudWatch logs?

## Immediate Actions

### 1. Check CloudWatch Logs for Chat Lambda
```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow --since 5m
```

Look for:
- "🌊 Streamed thought steps to DynamoDB" messages
- Any DynamoDB errors
- Session ID values

### 2. Check if Streaming Messages Exist in DynamoDB
```bash
aws dynamodb scan \
  --table-name ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE \
  --filter-expression "begins_with(id, :prefix)" \
  --expression-attribute-values '{":prefix":{"S":"streaming-"}}' \
  --limit 5
```

### 3. Test with Browser DevTools
1. Open https://d2hkqpgqguj4do.cloudfront.net
2. Open DevTools → Network tab
3. Send a message
4. Look for:
   - POST to `/api/chat/message` - Check request body for sessionId
   - GET to `/api/sessions/{sessionId}/messages` - Check if polling is happening
   - Check response for streaming messages

### 4. Check Project Context
1. Open browser console
2. Send a layout request
3. Look for console logs showing project context
4. Check the request payload to renewable orchestrator

## Quick Fixes to Try

### Fix 1: Clear All Caches
```bash
# Clear CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E18FPAPGJR8ZNO \
  --paths "/*"

# Clear browser cache (hard refresh)
# Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Fix 2: Verify Backend Deployment
```bash
# Check Lambda last modified time
aws lambda get-function \
  --function-name EnergyInsights-development-chat \
  --query 'Configuration.LastModified'

# Should be recent (within last hour)
```

### Fix 3: Test Streaming Directly
Create a test message and check DynamoDB:
```bash
# After sending a message, check for streaming message
aws dynamodb get-item \
  --table-name ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE \
  --key '{"id":{"S":"streaming-YOUR_SESSION_ID"},"chatSessionId":{"S":"YOUR_SESSION_ID"}}'
```

## Root Cause Analysis

Based on the symptoms, the most likely issues are:

1. **For Layout Issue**: Project context is not being preserved when calling the renewable orchestrator
   - Check: `src/utils/chatUtils.ts` - Does it pass project context?
   - Check: Renewable orchestrator handler - Does it receive and use project context?

2. **For CoT Batching**: Backend is not actually calling the streaming functions
   - The refactor may have broken something
   - Check: Are there compilation errors in the Lambda?
   - Check: Is `setSessionContext()` being called with valid IDs?

## Next Steps

1. Check CloudWatch logs for the chat Lambda
2. Verify streaming messages are being written to DynamoDB
3. Check browser network tab to see if polling is working
4. If streaming messages exist but aren't showing, it's a frontend issue
5. If streaming messages don't exist, it's a backend issue
