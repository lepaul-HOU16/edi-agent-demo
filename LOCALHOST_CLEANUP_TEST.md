# Localhost Cleanup Testing Guide

## Task 6: Testing Backend Cleanup Changes Locally

This guide shows how to test the cleanup integration on localhost **before** deploying to production.

## Prerequisites

1. **Local development environment running**:
   ```bash
   npm run dev
   ```

2. **AWS credentials configured** (for DynamoDB access)

3. **DynamoDB table accessible** (either local or AWS)

## Test Options

### Option 1: Automated Test Script

Run the automated test that creates a streaming message, runs cleanup, and verifies deletion:

```bash
node test-cleanup-localhost.js
```

**What it tests**:
- ✅ Creates a mock streaming message in DynamoDB
- ✅ Verifies the message exists
- ✅ Runs the cleanup function
- ✅ Verifies the message is deleted
- ✅ Confirms no streaming messages remain

### Option 2: Manual Testing with Local Dev Server

1. **Start the local development server**:
   ```bash
   npm run dev
   ```

2. **Open localhost** in your browser:
   ```
   http://localhost:5173
   ```

3. **Send a test query** to any agent

4. **Open browser DevTools** (F12) and check:
   - Network tab: Look for streaming message updates
   - Console: Look for cleanup logs

5. **Check DynamoDB** for streaming messages:
   ```bash
   aws dynamodb query \
     --table-name ChatMessage-fhzj4la45fevdnax5s2o4hbuqy-NONE \
     --index-name byChatSession \
     --key-condition-expression "chatSessionId = :sid" \
     --filter-expression "#role = :role" \
     --expression-attribute-names '{"#role":"role"}' \
     --expression-attribute-values '{":sid":{"S":"YOUR_SESSION_ID"},":role":{"S":"ai-stream"}}'
   ```

6. **Reload the page** and verify no stale "Thinking" indicators appear

### Option 3: Integration Test with Backend

Test the full flow with the Lambda handler:

```bash
node test-cleanup-integration.js
```

This tests:
- User message saved
- Agent processes request
- AI response saved
- **Cleanup runs automatically**
- Streaming messages deleted

## What to Look For

### ✅ Success Indicators

1. **In Console Logs**:
   ```
   🧹 Starting cleanup of streaming messages for session: xxx
   🔍 Querying for streaming messages in session xxx
   📊 Found X streaming message(s) to delete
   ✅ Deleted streaming message: xxx
   🧹 Cleanup complete: X message(s) deleted, 0 error(s)
   ```

2. **In DynamoDB**:
   - No messages with `role='ai-stream'` after response completes
   - Only `role='human'` and `role='ai'` messages remain

3. **In Browser**:
   - "Thinking" indicator appears during processing
   - Indicator disappears when response completes
   - No stale indicators after page reload

### ❌ Failure Indicators

1. **Cleanup doesn't run**:
   - No cleanup logs in console
   - Streaming messages remain in DynamoDB

2. **Cleanup fails**:
   - Error logs in console
   - Streaming messages not deleted

3. **Stale indicators**:
   - "Thinking" indicator persists after response
   - Indicator reappears after page reload

## Debugging

### Check if cleanup function is imported:

```bash
grep -n "cleanupStreamingMessages" cdk/lambda-functions/chat/handler.ts
```

Should show:
- Import statement at top
- Function call after AI response is saved

### Check cleanup function implementation:

```bash
grep -A 20 "export async function cleanupStreamingMessages" cdk/lambda-functions/shared/thoughtStepStreaming.ts
```

Should show the full cleanup function with:
- DynamoDB query for streaming messages
- Delete operations
- Error handling
- Logging

### Test cleanup function directly:

```javascript
const { cleanupStreamingMessages } = require('./cdk/lambda-functions/shared/thoughtStepStreaming');

cleanupStreamingMessages('test-session-id', 'test-user-id')
  .then(result => {
    console.log('Deleted:', result.deleted);
    console.log('Errors:', result.errors);
  });
```

## Expected Results

After running tests, you should see:

1. ✅ Cleanup function executes without errors
2. ✅ Streaming messages are deleted from DynamoDB
3. ✅ No stale "Thinking" indicators appear
4. ✅ Cleanup logs appear in console
5. ✅ Error handling works correctly

## Next Steps

Once localhost testing is complete and all tests pass:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add cleanup integration for streaming messages"
   ```

2. **Then deploy to production** (Task 6):
   ```bash
   cd cdk && npm run deploy
   ```

3. **Test in production** (Task 7)

## Notes

- Cleanup runs **asynchronously** after response is saved
- Cleanup failures don't block response delivery
- Frontend also has 5-minute timeout for stale messages
- Both backend and frontend work together for reliability

---

**Remember**: Test locally first, commit changes, then deploy to production.
