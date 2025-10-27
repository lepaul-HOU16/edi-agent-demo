# Task 11: Progress Updates to UI - Quick Start Guide

## Overview

Task 11 implements a complete progress tracking system that shows users real-time updates during Strands Agent cold starts and execution.

## Quick Test

```bash
# Run comprehensive test
node tests/test-task-11-complete-flow.js

# Expected: 10/10 tests passed
```

## How It Works

### 1. Lambda Writes Progress

```python
# In renewableAgentsFunction Lambda
progress_updates = []

# Send progress at each step
send_progress('init', '🚀 Initializing...', 0.1, progress_updates)
send_progress('bedrock', '🤖 Connecting to Bedrock...', 3.5, progress_updates)
send_progress('thinking', '💭 Analyzing...', 10.0, progress_updates)

# Write to DynamoDB
write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')

# Include in response
return {
    'statusCode': 200,
    'body': json.dumps({
        'success': True,
        'progress': progress_updates,
        'requestId': request_id
    })
}
```

### 2. Frontend Polls for Progress

```typescript
// In ChatMessage component
const { progressData, isPolling } = useAgentProgress({
  requestId: 'request-123',
  enabled: true,
  pollingInterval: 1000, // Poll every 1 second
  onComplete: () => setShowProgress(false),
});
```

### 3. UI Displays Progress

```tsx
<AgentProgressIndicator
  steps={progressData?.steps || []}
  currentStep="thinking"
  isVisible={isPolling}
/>
```

## Progress Steps

| Step | When | Message |
|------|------|---------|
| `init` | Cold start begins | 🚀 Initializing Strands Agent system... |
| `warm` | Warm start begins | ⚡ Using warm agent instance |
| `bedrock` | Connecting to Bedrock | 🤖 Bedrock connection established |
| `tools` | Loading agent tools | 🔧 Loading agent tools... |
| `agent` | Initializing agent | 🧠 Initializing AI agent... |
| `thinking` | Agent analyzing | 💭 Agent analyzing your request... |
| `executing` | Running tools | ⚙️ Executing tools... |
| `ready` | Cold start complete | ✅ Agent ready! |
| `complete` | Execution complete | ✅ Complete! |
| `error` | Error occurred | ❌ Error occurred |

## Timeline Examples

### Cold Start (~2-3 minutes)
```
0.0s  → init      (Initialization begins)
3.5s  → bedrock   (Bedrock connected)
5.0s  → tools     (Tools loaded)
7.0s  → agent     (Agent initialized)
10.0s → thinking  (Analyzing request)
15.0s → executing (Running tools)
20.0s → ready     (Agent ready)
25.0s → complete  (Done)
```

### Warm Start (~30 seconds)
```
0.0s → warm      (Using warm instance)
0.1s → thinking  (Analyzing request)
2.0s → executing (Running tools)
5.0s → complete  (Done)
```

## Testing

### Unit Tests
```bash
# Test Lambda progress functions
python3 tests/test-progress-updates-unit.py

# Expected: 5/5 tests passed
```

### Integration Tests
```bash
# Test complete flow
node tests/test-task-11-complete-flow.js

# Expected: 10/10 tests passed
```

### Manual Testing

1. **Start sandbox**:
   ```bash
   npx ampx sandbox
   ```

2. **Open UI**: Navigate to chat interface

3. **Send query**: "Optimize layout at 35.067, -101.395"

4. **Observe progress**:
   - Progress indicator should appear
   - Steps should update in real-time
   - Elapsed time should increase
   - Indicator should disappear when complete

## Debugging

### Check Progress in DynamoDB
```bash
# List recent progress records
aws dynamodb scan --table-name AgentProgress --limit 5

# Get specific progress
aws dynamodb get-item \
  --table-name AgentProgress \
  --key '{"requestId": {"S": "request-123"}}'
```

### Check Lambda Logs
```bash
# View progress writes
aws logs filter-pattern /aws/lambda/renewableAgentsFunction --filter-pattern "PROGRESS"

# View polling requests
aws logs tail /aws/lambda/agentProgressFunction --follow
```

### Check Frontend
```javascript
// In browser console
// Check if hook is polling
console.log('Polling:', isPolling);
console.log('Progress data:', progressData);

// Check GraphQL query
client.queries.getAgentProgress({ requestId: 'request-123' })
  .then(result => console.log('Progress:', result));
```

## Common Issues

### Issue: Progress not showing

**Cause**: requestId not being passed to hook

**Fix**:
```typescript
// Ensure requestId is extracted from Lambda response
const requestId = response.requestId || response.metadata?.requestId;

// Pass to hook
const { progressData } = useAgentProgress({
  requestId,
  enabled: !!requestId,
});
```

### Issue: Polling not stopping

**Cause**: Status not set to 'complete' or 'error'

**Fix**:
```python
# In Lambda handler, ensure final write has correct status
write_progress_to_dynamodb(request_id, progress_updates, 'complete')
```

### Issue: Progress steps out of order

**Cause**: Elapsed time not calculated from handler start

**Fix**:
```python
# Calculate elapsed time from handler start
handler_start_time = time.time()

# Later...
elapsed = time.time() - handler_start_time
send_progress('thinking', 'Analyzing...', elapsed, progress_updates)
```

## Architecture

```
User Interface
    ↓ (sends query)
Lambda Handler
    ↓ (writes progress)
DynamoDB (AgentProgress table)
    ↑ (polls every 1s)
Frontend (useAgentProgress hook)
    ↓ (renders)
AgentProgressIndicator component
```

## Files

### Backend
- `amplify/functions/renewableAgents/lambda_handler.py` - Progress tracking
- `amplify/functions/agentProgress/handler.ts` - Polling endpoint
- `amplify/backend.ts` - DynamoDB table and permissions

### Frontend
- `src/hooks/useAgentProgress.ts` - Polling hook
- `src/components/renewable/AgentProgressIndicator.tsx` - UI component
- `src/components/ChatMessage.tsx` - Integration

### Tests
- `tests/test-progress-updates-unit.py` - Unit tests
- `tests/test-task-11-complete-flow.js` - Integration tests

## Next Steps

1. **Deploy**: `npx ampx sandbox`
2. **Test**: Send a query and watch progress
3. **Monitor**: Check CloudWatch logs
4. **Optimize**: Adjust polling interval if needed

## Related Documentation

- `tests/TASK_11_PROGRESS_UPDATES_TO_UI_COMPLETE.md` - Complete documentation
- `tests/PROGRESS_UPDATES_QUICK_REFERENCE.md` - Lambda implementation
- `tests/TASK_5_AGENT_PROGRESS_UI_COMPLETE.md` - UI components

## Status: ✅ COMPLETE

All sub-tasks implemented and tested. Ready for deployment!
