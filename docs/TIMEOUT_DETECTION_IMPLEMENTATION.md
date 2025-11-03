# Timeout Detection and Handling Implementation

## Overview

Implemented comprehensive timeout detection and handling for the RenewableProxyAgent to ensure that long-running orchestrator invocations are properly detected, logged, and handled with user-friendly error messages.

## Implementation Details

### 1. Timeout Thresholds

Two timeout thresholds were implemented:

- **Warning Threshold**: 30 seconds
  - Logs a warning when orchestrator takes longer than expected
  - Helps identify slow operations before they timeout
  - Does not interrupt the operation

- **Timeout Threshold**: 60 seconds
  - Terminates the orchestrator invocation
  - Returns a timeout error with remediation steps
  - Clears loading state on frontend

### 2. Timeout Detection Mechanism

The timeout detection uses `Promise.race()` to race between:
1. The actual Lambda invocation
2. A timeout promise that rejects after 60 seconds

```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => {
    const duration = Date.now() - invocationStartTime;
    reject(new Error(`Orchestrator timeout after ${Math.floor(duration / 1000)} seconds`));
  }, TIMEOUT_THRESHOLD_MS);
});

const lambdaResponse = await Promise.race([
  this.lambdaClient.send(command),
  timeoutPromise
]);
```

### 3. Warning Timer

A separate warning timer logs a warning at 30 seconds:

```typescript
const warningTimer = setTimeout(() => {
  const duration = Date.now() - invocationStartTime;
  console.warn('⚠️ RenewableProxyAgent: Orchestrator taking longer than expected', {
    requestId,
    attempt,
    duration: `${Math.floor(duration / 1000)}s`,
    threshold: '30s',
    message: 'Orchestrator is still processing, this may take a while...',
    timestamp: new Date().toISOString(),
  });
}, WARNING_THRESHOLD_MS);
```

### 4. Timeout Error Handling

When a timeout occurs:

1. **Error Creation**: A detailed timeout error is created with remediation steps
2. **Error Type**: Marked as `TimeoutError` to prevent retries
3. **Remediation Steps**: Includes specific guidance for users:
   - Try again with a smaller analysis area
   - Check Lambda timeout settings
   - Review CloudWatch logs
   - Verify cold start issues

```typescript
const timeoutErrorWithRemediation = new Error(
  `Renewable energy analysis timed out after 60 seconds.\n\n` +
  `Remediation steps:\n` +
  `1. Try again with a smaller analysis area (reduce radius)\n` +
  `2. Check Lambda timeout settings in AWS Console\n` +
  `3. Review CloudWatch logs for the orchestrator function\n` +
  `4. Verify the orchestrator and tool Lambdas are not experiencing cold starts\n\n` +
  `If the issue persists, contact support with request ID: ${requestId}`
);
```

### 5. Retry Logic Integration

Timeout errors are **not retried** because:
- Retrying a timeout is unlikely to succeed
- It would extend the total wait time significantly
- The issue is likely systemic (cold start, resource constraints)

The `isRetryableError()` method was updated to distinguish between:
- **Our timeout detection** (not retryable): `Orchestrator timeout after`
- **Lambda timeout errors** (retryable): `Task timed out`

### 6. Loading State Management

The timeout error response includes:
- `success: false`
- Complete error message with remediation
- Empty artifacts array
- Thought steps with error status
- Agent used identifier

This ensures the frontend can properly clear loading indicators and display the error.

### 7. Logging

Comprehensive logging at each stage:

**Before invocation:**
```typescript
console.log('🚀 RenewableProxyAgent: Invoking orchestrator', {
  requestId,
  attempt,
  maxRetries,
  functionName: this.orchestratorFunctionName,
  // ...
});
```

**Warning at 30s:**
```typescript
console.warn('⚠️ RenewableProxyAgent: Orchestrator taking longer than expected', {
  duration: '30s',
  threshold: '30s',
  // ...
});
```

**Timeout at 60s:**
```typescript
console.error('❌ RenewableProxyAgent: Orchestrator timeout', {
  duration: '60s',
  threshold: '60s',
  // ...
});
```

## Test Coverage

Created comprehensive unit tests in `RenewableProxyAgent.timeout.test.ts`:

### Test Suites

1. **Warning at 30 seconds**
   - ✅ Logs warning if orchestrator takes > 30 seconds
   - ✅ Includes duration in warning message

2. **Timeout at 60 seconds**
   - ✅ Returns timeout error if orchestrator takes > 60 seconds
   - ✅ Logs timeout error with details

3. **Timeout error message with remediation**
   - ✅ Includes remediation steps in timeout error
   - ✅ Includes timeout-specific error type

4. **Loading state cleared on timeout**
   - ✅ Returns complete response structure on timeout
   - ✅ Marks thought steps as complete or error on timeout

5. **Timeout with retry logic**
   - ✅ Does not retry on timeout errors
   - ✅ Handles timeout during retry attempt
   - ✅ Aggregates timeout with previous retry attempts in error

6. **Timeout threshold configuration**
   - ✅ Uses 60 second timeout threshold
   - ✅ Uses 30 second warning threshold

**Total: 13 tests, all passing ✅**

## Requirements Satisfied

### Requirement 1.5: Diagnose Orchestrator Invocation Flow
- ✅ Timeout detection identifies when orchestrator is hanging
- ✅ Detailed logging helps diagnose timeout causes

### Requirement 4.4: Fix Loading State Completion
- ✅ Timeout error clears loading state
- ✅ Complete response structure returned

### Requirement 7.2: Add Fallback Error Handling
- ✅ Timeout-specific error messages
- ✅ Remediation steps provided
- ✅ Loading state cleared on timeout

## Usage

The timeout detection is automatic and requires no configuration. When an orchestrator invocation takes:

- **< 30 seconds**: Normal operation, no warnings
- **30-60 seconds**: Warning logged, operation continues
- **> 60 seconds**: Operation terminated, timeout error returned

## Benefits

1. **User Experience**: Users get clear feedback when operations are slow or timeout
2. **Debugging**: Detailed logs help identify performance issues
3. **Reliability**: Prevents indefinite hangs and resource exhaustion
4. **Guidance**: Remediation steps help users resolve issues

## Future Enhancements

Potential improvements:
1. Make timeout thresholds configurable via environment variables
2. Add metrics/monitoring for timeout frequency
3. Implement progressive timeout (longer for first request, shorter for subsequent)
4. Add automatic retry with exponential backoff for specific timeout scenarios

## Related Files

- `amplify/functions/agents/renewableProxyAgent.ts` - Main implementation
- `amplify/functions/agents/__tests__/RenewableProxyAgent.timeout.test.ts` - Unit tests
- `.kiro/specs/fix-renewable-orchestrator-flow/tasks.md` - Task specification
- `.kiro/specs/fix-renewable-orchestrator-flow/requirements.md` - Requirements
- `.kiro/specs/fix-renewable-orchestrator-flow/design.md` - Design document
