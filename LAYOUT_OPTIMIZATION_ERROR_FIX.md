# Layout Optimization Error Fix

## The Real Problem

The error message with massive repetition:
```
Lambda invocation failed after 3 attempts: Lambda invocation failed after 3 attempts: Lambda invocation failed after 3 attempts: ...
```

This is **NOT a payload size issue** - Docker Lambdas have a **10GB limit**, not 6MB.

## Root Cause

The issue is in the **retry logic** in the orchestrator:
1. Layout Lambda is failing for some reason (actual error unknown)
2. Retry logic catches the error and retries 3 times
3. Each retry concatenates the error message
4. Result: Massive repetitive error message that hides the real problem

## The Fix

Improved error handling in `invokeLambdaWithRetry()`:

### Before
- Error messages concatenated on each retry
- Root cause buried under repetition
- No clear logging of what's actually failing

### After
- Clear logging for each retry attempt
- Error message truncated to prevent repetition
- Final error shows only the root cause
- Detailed CloudWatch logs for debugging

### Key Changes

```typescript
// Clear per-attempt logging
console.error(`❌ Lambda invocation attempt ${attempt + 1}/${maxRetries} failed`);
console.error(`   Function: ${functionName}`);
console.error(`   Error: ${errorMessage.substring(0, 500)}`);

// Final error with root cause only
const rootCause = lastError?.message?.split(':')[0] || 'Unknown error';
throw new Error(`Layout optimization failed: ${rootCause}. Check CloudWatch logs for details.`);
```

## Next Steps

1. **Deploy the fix**: Restart Amplify sandbox
2. **Test layout optimization**: Try the same query again
3. **Check CloudWatch logs**: Look for the actual error in the layout Lambda
4. **Fix the root cause**: Once we see the real error, we can fix it

## What to Look For

The actual error is likely one of these:
- **Python dependency missing**: Layout Lambda can't import required modules
- **Memory limit exceeded**: Layout calculation uses too much RAM
- **Timeout**: Layout calculation takes too long
- **Invalid data**: Terrain data format issue
- **Code error**: Bug in the intelligent placement algorithm

## Testing

After deploying, run:
```bash
# Test layout optimization
node tests/test-payload-size-fix.js
```

The error message should now be clear and show the actual problem instead of repetitive retry messages.
