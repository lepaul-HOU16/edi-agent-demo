# Orchestrator Fallback Logic - Quick Reference

## Overview

The orchestrator now includes intelligent fallback logic that automatically switches to direct tool invocation when Strands Agents timeout or are throttled.

## How It Works

### 1. Timeout Detection

The orchestrator catches these error types:
- **Timeout errors**: Any error message containing "timeout", "Timeout", or "timed out"
- **Throttling errors**: `TooManyRequestsException` or "Rate exceeded"

### 2. Automatic Fallback

When a timeout/throttling error is detected:
1. Logs a warning with error details
2. Logs a fallback event for monitoring
3. Adds a thought step indicating fallback
4. Falls through to legacy handler (direct tool invocation)

### 3. Response Metadata

Responses include fallback information:
```typescript
{
  success: true,
  message: "Analysis completed using basic mode",
  artifacts: [...],
  metadata: {
    fallbackUsed: true,
    fallbackReason: "Strands Agent timeout/throttling",
    toolsUsed: ["terrain_analysis"],
    executionTime: 5000
  }
}
```

### 4. UI Warning

When `metadata.fallbackUsed` is true, the UI displays:

```
ℹ️ Advanced AI unavailable, using basic mode
   The intelligent agent system is temporarily unavailable. 
   Results generated using direct tool invocation.
```

## Code Locations

### Backend

**Timeout Detection**: `amplify/functions/renewableOrchestrator/handler.ts`
```typescript
// Lines ~90-130
if (isStrandsAgentAvailable()) {
  try {
    const agentResponse = await handleWithStrandsAgents({...});
    return agentResponse;
  } catch (agentError: any) {
    const isTimeoutError = errorMessage.includes('timeout') || ...;
    const isThrottlingError = agentError.name === 'TooManyRequestsException' || ...;
    
    if (isTimeoutError || isThrottlingError) {
      // Log fallback event and fall through to legacy handler
    }
  }
}
```

**Fallback Function**: `amplify/functions/renewableOrchestrator/handler.ts`
```typescript
// Lines ~700-800
async function fallbackToDirectTools(
  agentType: string,
  query: string,
  parameters: Record<string, any>,
  requestId: string
): Promise<OrchestratorResponse>
```

**Strands Agent Handler**: `amplify/functions/renewableOrchestrator/strandsAgentHandler.ts`
```typescript
// Lines ~77-150
export async function handleWithStrandsAgents(event: StrandsAgentEvent)
// Re-throws timeout/throttling errors to trigger fallback
```

### Frontend

**UI Warning**: `src/components/messageComponents/AiMessageComponent.tsx`
```typescript
// Lines ~115-145
{(message as any).metadata?.fallbackUsed && (
  <Box sx={{...}}>
    Advanced AI unavailable, using basic mode
  </Box>
)}
```

## Testing

### Run Fallback Test
```bash
node tests/test-orchestrator-fallback.js
```

### Expected Output
```
✅ Found orchestrator: amplify-...renewableOrchestrator...
📋 Test 1: Normal terrain analysis query
Response status: ✅ Success
Fallback used: ⚠️  Yes (if Strands Agents disabled)
Tools used: terrain_analysis
✅ Generated 1 artifact(s)
```

### Manual Testing

1. **Test with Strands Agents disabled** (current state):
   ```
   Query: "Analyze terrain at 35.067482, -101.395466"
   Expected: Direct tool invocation, no fallback warning
   ```

2. **Test with Strands Agents enabled but timing out**:
   ```typescript
   // In strandsAgentHandler.ts, set:
   export function isStrandsAgentAvailable(): boolean {
     return true; // Enable Strands Agents
   }
   
   // Then test with a query
   Query: "Analyze terrain at 35.067482, -101.395466"
   Expected: Timeout after 15 minutes, fallback to direct tools
   ```

## Monitoring

### CloudWatch Logs

Look for these log entries:

**Fallback Event**:
```json
{
  "message": "📊 FALLBACK EVENT:",
  "timestamp": "2025-01-14T...",
  "requestId": "req-...",
  "errorType": "timeout",
  "errorMessage": "Task timed out after 900.00 seconds",
  "query": "Analyze terrain at..."
}
```

**Fallback Warning**:
```
⚠️  Strands Agent timeout/throttling detected, falling back to direct tool invocation
   Error type: Timeout
   Error message: Task timed out after 900.00 seconds
```

### Metrics to Track

1. **Fallback Rate**: Percentage of requests using fallback
2. **Timeout Frequency**: How often Strands Agents timeout
3. **Fallback Success Rate**: Success rate of fallback responses
4. **User Impact**: Whether users notice degraded experience

## Troubleshooting

### Issue: Fallback not triggering

**Check**:
1. Is `isStrandsAgentAvailable()` returning true?
2. Is the error message being caught correctly?
3. Check CloudWatch logs for error details

**Solution**:
```typescript
// Add more error patterns if needed
const isTimeoutError = errorMessage.includes('timeout') || 
                      errorMessage.includes('Timeout') ||
                      errorMessage.includes('timed out') ||
                      errorMessage.includes('Task timed out'); // Add more patterns
```

### Issue: UI warning not showing

**Check**:
1. Is `metadata.fallbackUsed` set to true in response?
2. Is the message component receiving the metadata?
3. Check browser console for errors

**Solution**:
```typescript
// Verify metadata in orchestrator response
console.log('Response metadata:', response.metadata);
```

### Issue: Direct tools not working

**Check**:
1. Are environment variables set correctly?
2. Are tool Lambdas deployed?
3. Check tool Lambda logs for errors

**Solution**:
```bash
# Verify environment variables
aws lambda get-function-configuration \
  --function-name <orchestrator-name> \
  --query "Environment.Variables"

# Check for required variables:
# - RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME
# - RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME
# - RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME
# - RENEWABLE_REPORT_TOOL_FUNCTION_NAME
```

## Next Steps

1. **Enable Strands Agents**: Set `isStrandsAgentAvailable()` to return true
2. **Test Cold Start**: Verify timeout handling during cold start
3. **Optimize Performance**: Implement tasks 2-7 to reduce cold start time
4. **Monitor Metrics**: Track fallback rate and user impact
5. **Iterate**: Adjust timeout thresholds and error patterns as needed

## Related Tasks

- ✅ Task 8.1: Add timeout error handling in orchestrator
- ✅ Task 8.2: Implement fallbackToDirectTools function
- ✅ Task 8.3: Update UI to show fallback warning
- ⏳ Task 9: Optimize Dockerfile (if cold start > 5 minutes)
- ⏳ Task 10: Create comprehensive test suite
- ⏳ Task 11: Add CloudWatch monitoring and alarms

## Success Criteria

- ✅ Timeout errors are caught and logged
- ✅ Fallback to direct tools works automatically
- ✅ Response includes `fallbackUsed` flag
- ✅ UI displays user-friendly warning
- ✅ No user-facing errors during fallback
- ✅ Artifacts are generated correctly in fallback mode
