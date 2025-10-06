# Debug Steps for File Scanning Issues

## Check AWS CloudWatch Logs

1. Go to AWS CloudWatch Console
2. Look for logs from your ReAct agent Lambda function
3. Search for logs containing "getGlobalDirectoryContext" or "scanSessionDirectory"
4. Verify you see entries like: "Session directory scan found X files"

## Test S3 Structure

1. Check your S3 bucket
2. Verify files are stored in: `chatSessionArtifacts/sessionId=<your-session-id>/`
3. Confirm the session ID matches what the agent is scanning

## Manual Testing Commands

Use these in a chat session to debug:

```
Agent, use the listFiles tool to show me all files in my session.
```

```
Agent, can you tell me what directory context you have access to?
```

## Expected Log Messages

You should see logs like:
- "Scanning session directory for chatSessionId: [ID]"
- "Session directory scan found [N] files"
- "Cache cleared for session: [ID]"

## Common Issues

1. **Session ID Mismatch**: Verify the chat session ID matches the S3 prefix
2. **Cache Not Clearing**: Check that file upload triggers cache invalidation
3. **Permissions**: Ensure Lambda has S3 read permissions for session directories
4. **Timing**: Allow a few seconds after upload before testing agent awareness

## Quick Test Script

1. Upload a file named "test.txt" with content "Hello World"
2. Ask: "What files do you see?"
3. Ask: "Read test.txt"
4. Expected: Agent lists test.txt and reads "Hello World"
