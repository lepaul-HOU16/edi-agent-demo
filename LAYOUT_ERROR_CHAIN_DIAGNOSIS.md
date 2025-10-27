# Layout Error Chain Diagnosis

## Problem Summary

The E2E renewable workflow test fails at the layout optimization step with a massive cascade of "Tool invocation failed" errors (1000+ repetitions), suggesting an infinite retry loop.

## Root Cause Analysis

### What Works ✅

1. **Direct Layout Lambda Invocation**: The layout Lambda works perfectly when called directly with coordinates
   ```bash
   aws lambda invoke --function-name RenewableLayoutTool --payload {...}
   # Returns: 200 OK with valid layout data
   ```

2. **Layout via Orchestrator with Explicit Coordinates**: Works when coordinates are in the query
   ```javascript
   query: "Optimize turbine layout at 35.067482, -101.395466 with 10 turbines"
   // Returns: Success with artifacts
   ```

3. **Layout Rejection Without Coordinates**: Correctly rejects requests missing coordinates
   ```javascript
   query: "Optimize turbine layout"
   // Returns: Error message asking for coordinates
   ```

### What Fails ❌

**E2E Workflow: Terrain → Layout**
- Terrain analysis completes successfully
- Layout optimization is triggered
- Layout Lambda is called repeatedly (1000+ times)
- Each call fails with "Tool invocation failed"
- Creates infinite error chain

## Hypothesis

The issue is in the **Strands Agent integration** with the orchestrator:

1. **Terrain Analysis Completes**: Project context is saved with coordinates
2. **Layout Optimization Triggered**: Strands Agent attempts to call layout tool
3. **Tool Invocation Fails**: Layout Lambda is called but something in the response causes Strands Agent to think it failed
4. **Infinite Retry**: Strands Agent retries the tool invocation indefinitely
5. **Error Chain**: Each retry wraps the previous error, creating the cascade

## Evidence

### From E2E Test Output
```
❌ Layout optimization failed: Lambda error: {"errorType":"Error","errorMessage":"Tool invocation failed: Error: Tool invocation failed: Error: Tool invocation failed: ...
```

The error message shows:
- Nested "Tool invocation failed" errors
- Each error wraps the previous one
- Pattern suggests retry loop without exit condition

### From Orchestrator Code
```typescript
async function invokeLambdaWithRetry(
  functionName: string,
  payload: any,
  maxRetries: number = 3  // ← Should stop after 3 retries
): Promise<ToolResult> {
  // ... retry logic
}
```

The orchestrator has a max retry limit of 3, but the error chain has 1000+ repetitions, suggesting the retry is happening at a different level (likely Strands Agent).

## Likely Culprit

**Strands Agent Tool Invocation Handler**

Location: `amplify/functions/renewableOrchestrator/strandsAgentHandler.ts` or within the Strands Agent Lambda itself

The Strands Agent is likely:
1. Calling the layout tool
2. Receiving a response it doesn't recognize as success
3. Retrying indefinitely
4. Wrapping each error in a new "Tool invocation failed" message

## Next Steps to Fix

### Option 1: Fix Strands Agent Tool Response Handling
- Check how Strands Agent interprets tool responses
- Ensure layout Lambda response format matches what Strands Agent expects
- Add proper success/failure detection

### Option 2: Add Circuit Breaker to Strands Agent
- Implement max retry limit in Strands Agent tool invocation
- Add exponential backoff
- Fail fast after N attempts

### Option 3: Fallback to Direct Tool Invocation
- Detect when Strands Agent is in retry loop
- Fall back to direct orchestrator tool invocation
- This is already implemented but may not be triggering

## Immediate Workaround

For the E2E test, we can:
1. Skip Strands Agent integration for layout optimization
2. Use direct orchestrator tool invocation
3. This will allow the workflow to complete while we fix the Strands Agent issue

## Testing Plan

1. **Test Strands Agent Directly**
   ```bash
   # Call Strands Agent Lambda with layout optimization request
   # Monitor for retry loop
   ```

2. **Test Orchestrator Fallback**
   ```bash
   # Disable Strands Agent
   # Verify orchestrator falls back to direct tool invocation
   ```

3. **Test E2E with Fallback**
   ```bash
   # Run E2E test with Strands Agent disabled
   # Verify workflow completes successfully
   ```

## Related Files

- `amplify/functions/renewableOrchestrator/handler.ts` - Orchestrator with retry logic
- `amplify/functions/renewableOrchestrator/strandsAgentHandler.ts` - Strands Agent integration
- `amplify/functions/renewableTools/layout/handler.py` - Layout Lambda (works correctly)
- `tests/e2e-renewable-workflow-complete.js` - E2E test showing the failure

## Update: Strands Agent is Disabled

Further investigation reveals:
- ✅ Strands Agent is **already disabled** in the code (line 186-189 of strandsAgentHandler.ts)
- ✅ Orchestrator is using **direct tool invocation** (not Strands Agent)
- ✅ Individual Lambdas (terrain, layout) work correctly when called directly
- ❌ E2E test is failing to parse responses correctly

## Actual Root Cause

The infinite error chain is **NOT** from the Lambda functions themselves. The issue is in:

1. **E2E Test Response Parsing**: The test may not be correctly parsing the orchestrator response format
2. **Orchestrator Response Format**: There may be a mismatch between what the orchestrator returns and what the test expects

## Evidence

```bash
# Direct terrain test - WORKS
aws lambda invoke --function-name renewableOrchestrator --payload '{"query":"Analyze terrain..."}'
# Returns: success: true, artifacts: [1 artifact]

# E2E test - FAILS
node tests/e2e-renewable-workflow-complete.js
# Reports: "No artifacts returned"
```

The Lambda is returning artifacts, but the E2E test isn't finding them.

## Status

- ✅ Lambdas work correctly
- ✅ Orchestrator works correctly  
- ❌ E2E test has response parsing issue
- ⏳ Need to fix E2E test to correctly parse orchestrator response

## Date

2025-10-27
