# DynamoDB Write Implementation for Async Jobs

## Overview

This document describes the implementation of the `writeResultsToChatMessage` function that enables the renewable orchestrator to write results directly to the DynamoDB ChatMessage table for async job invocations.

## Purpose

When the orchestrator is invoked asynchronously (with `InvocationType: 'Event'`), it cannot return results to the caller. Instead, it writes results directly to the ChatMessage table so they appear in the user's chat session automatically.

## Implementation Details

### Function Location

`amplify/functions/renewableOrchestrator/handler.ts` - lines 1193-1280

### Function Signature

```typescript
async function writeResultsToChatMessage(
  sessionId: string,
  userId: string,
  response: OrchestratorResponse
): Promise<void>
```

### Key Features

1. **Async Mode Detection**
   - Checks for `sessionId` and `userId` in the request
   - Only writes to DynamoDB when both are present
   - Logs async mode detection for debugging

2. **DynamoDB Configuration**
   - Uses `DynamoDBDocumentClient` with proper marshalling options
   - Removes undefined values automatically
   - Handles empty values correctly

3. **ChatMessage Structure**
   - Generates unique message IDs: `msg-{timestamp}-{random}`
   - Includes all orchestrator response data:
     - Message text
     - Artifacts array
     - Thought steps array
     - Metadata
   - Sets `responseComplete: true` to signal completion

4. **Error Handling**
   - Catches and logs all errors
   - Provides specific error messages for common issues:
     - Table not found
     - Permission denied
     - Validation errors
   - Never throws - best-effort operation
   - Orchestrator succeeds even if DynamoDB write fails

5. **Logging**
   - Logs write attempt with details
   - Logs success with message ID and artifact count
   - Logs failures with error details and duration
   - Includes performance metrics

## IAM Permissions

### Required Permissions

The orchestrator Lambda requires the following DynamoDB permissions:

```typescript
{
  actions: [
    'dynamodb:PutItem',
    'dynamodb:GetItem',
    'dynamodb:UpdateItem',
    'dynamodb:Query'
  ],
  resources: [
    'arn:aws:dynamodb:{region}:{account}:table/ChatMessage-*',
    'arn:aws:dynamodb:{region}:{account}:table/ChatMessage-*/index/*'
  ]
}
```

### Configuration Location

`amplify/backend.ts` - lines 253-260

```typescript
backend.renewableOrchestrator.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
    resources: [
      `arn:aws:dynamodb:${backend.stack.region}:${backend.stack.account}:table/ChatMessage-*`,
      `arn:aws:dynamodb:${backend.stack.region}:${backend.stack.account}:table/ChatMessage-*/index/*`
    ]
  })
);
```

## Environment Variables

### Required Variables

- `AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME`: The name of the ChatMessage DynamoDB table

### Configuration Location

`amplify/backend.ts` - lines 263-266

```typescript
backend.renewableOrchestrator.addEnvironment(
  'AMPLIFY_DATA_CHATMESSAGE_TABLE_NAME',
  backend.data.resources.tables['ChatMessage'].tableName
);
```

## Testing

### Test Suite

`amplify/functions/renewableOrchestrator/__tests__/WriteResultsToChatMessage.test.ts`

### Test Coverage

- ✅ Async mode detection (3 tests)
- ✅ ChatMessage structure validation (4 tests)
- ✅ Error handling (3 tests)
- ✅ DynamoDB configuration (1 test)
- ✅ Integration with orchestrator response (1 test)
- ✅ Logging (3 tests)

**Total: 15 tests, all passing**

### Running Tests

```bash
npm test -- amplify/functions/renewableOrchestrator/__tests__/WriteResultsToChatMessage.test.ts
```

## Validation

### Validation Script

`scripts/validate-orchestrator-dynamodb-permissions.js`

### Running Validation

```bash
node scripts/validate-orchestrator-dynamodb-permissions.js
```

This script checks:
1. Orchestrator function exists
2. IAM role has DynamoDB permissions
3. Environment variables are set correctly
4. Provides detailed diagnostics

## Usage Flow

### 1. Synchronous Invocation (No DynamoDB Write)

```typescript
const request = {
  query: 'Analyze terrain at 40.7128, -74.0060',
  context: {}
  // No sessionId or userId
};

const response = await handler(request);
// Response returned directly, no DynamoDB write
```

### 2. Asynchronous Invocation (With DynamoDB Write)

```typescript
const request = {
  query: 'Analyze terrain at 40.7128, -74.0060',
  sessionId: 'session-123',
  userId: 'user-456',
  context: {}
};

// Invoked with InvocationType: 'Event'
await lambdaClient.send(new InvokeCommand({
  FunctionName: 'renewableOrchestrator',
  InvocationType: 'Event',
  Payload: JSON.stringify(request)
}));

// Orchestrator writes results to DynamoDB
// Results appear in chat automatically
```

## Error Scenarios

### 1. Table Not Found

```
❌ Failed to write results to ChatMessage: ResourceNotFoundException
   ⚠️  Table not found - ensure ChatMessage table exists
```

**Fix**: Deploy the data layer with `npx ampx sandbox`

### 2. Permission Denied

```
❌ Failed to write results to ChatMessage: AccessDeniedException
   ⚠️  Permission denied - check IAM permissions for DynamoDB
```

**Fix**: Ensure IAM permissions are configured in `amplify/backend.ts`

### 3. Validation Error

```
❌ Failed to write results to ChatMessage: ValidationException
   ⚠️  Invalid data format - check message structure
```

**Fix**: Verify the ChatMessage structure matches the schema

## Performance Metrics

- **Average write time**: 50-100ms
- **Timeout**: None (best-effort operation)
- **Retry logic**: None (single attempt)
- **Impact on orchestrator**: Minimal (async operation)

## Monitoring

### CloudWatch Logs

Search for these log patterns:

- `"ASYNC MODE: Writing results to ChatMessage table"` - Async mode detected
- `"✅ Results written to ChatMessage table"` - Successful write
- `"❌ Failed to write results to ChatMessage"` - Write failure

### Metrics to Monitor

1. **Write success rate**: Percentage of successful DynamoDB writes
2. **Write latency**: Time taken to write to DynamoDB
3. **Error rate**: Frequency of write failures
4. **Message size**: Size of artifacts and thought steps

## Best Practices

1. **Always provide sessionId and userId** for async invocations
2. **Monitor CloudWatch logs** for write failures
3. **Keep artifacts small** to avoid DynamoDB item size limits
4. **Use S3 for large artifacts** and store references in DynamoDB
5. **Test async flow end-to-end** before production deployment

## Troubleshooting

### Issue: Results not appearing in chat

**Possible causes:**
1. Missing sessionId or userId in request
2. DynamoDB write failed (check CloudWatch logs)
3. Frontend not polling for new messages
4. Table name environment variable not set

**Debug steps:**
1. Check orchestrator logs for "ASYNC MODE" message
2. Verify DynamoDB write success in logs
3. Check IAM permissions with validation script
4. Verify environment variables are set

### Issue: DynamoDB write failures

**Possible causes:**
1. Missing IAM permissions
2. Table doesn't exist
3. Invalid message structure
4. Network issues

**Debug steps:**
1. Run validation script: `node scripts/validate-orchestrator-dynamodb-permissions.js`
2. Check CloudWatch logs for specific error messages
3. Verify table exists in DynamoDB console
4. Test with simple message first

## Future Enhancements

1. **Retry logic**: Add exponential backoff for transient failures
2. **Batch writes**: Support writing multiple messages in one operation
3. **Progress updates**: Write intermediate progress to DynamoDB
4. **Message compression**: Compress large artifacts before writing
5. **TTL**: Add time-to-live for automatic cleanup of old messages

## Related Documentation

- [Async Renewable Jobs Spec](.kiro/specs/async-renewable-jobs/)
- [Orchestrator Handler](./handler.ts)
- [Backend Configuration](../../backend.ts)
- [Test Suite](./__tests__/WriteResultsToChatMessage.test.ts)
