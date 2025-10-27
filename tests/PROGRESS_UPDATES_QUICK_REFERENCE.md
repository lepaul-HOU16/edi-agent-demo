# Progress Updates Quick Reference

## Overview

The Strands Agent Lambda handler now sends structured progress updates during initialization and execution. This provides transparency to users and helps with debugging.

## Quick Test

```bash
# Run unit tests
python3 tests/test-progress-updates-unit.py

# Expected output: 5/5 tests passed
```

## Progress Update Structure

```json
{
  "type": "progress",
  "step": "bedrock",
  "message": "🤖 Connecting to AWS Bedrock...",
  "elapsed": 0.5,
  "timestamp": 1761252121.125914
}
```

## Progress Steps

| Step | When | Message |
|------|------|---------|
| `init` | Cold start begins | 🚀 Initializing Strands Agent system... |
| `warm` | Warm start begins | ⚡ Using warm agent instance (fast response) |
| `bedrock` | Connecting to Bedrock | 🤖 Connecting to AWS Bedrock (Claude 3.7 Sonnet)... |
| `tools` | Loading agent tools | 🔧 Loading {agent_type} agent tools... |
| `agent` | Initializing agent | 🧠 Initializing {agent_type} AI agent with extended thinking... |
| `thinking` | Agent analyzing | 💭 Agent analyzing your request... |
| `executing` | Running tools | ⚙️ Executing tools and generating results... |
| `ready` | Cold start complete | ✅ Agent ready! (initialized in Xs) |
| `complete` | Execution complete | ✅ Complete! (total time: Xs) |
| `error` | Error occurred | ❌ Error occurred: {error_message} |

## Cold Start Timeline

```
0.0s  → init      (Initialization begins)
0.5s  → bedrock   (Connecting to Bedrock)
1.0s  → tools     (Loading tools)
2.0s  → agent     (Initializing agent)
3.0s  → thinking  (Analyzing request)
5.0s  → executing (Running tools)
10.0s → ready     (Agent ready)
10.5s → complete  (Done)
```

## Warm Start Timeline

```
0.0s → warm      (Using warm instance)
0.1s → thinking  (Analyzing request)
2.0s → executing (Running tools)
5.0s → complete  (Done)
```

## Accessing Progress Updates

### In Lambda Response

```python
response = lambda_handler(event, context)
body = json.loads(response['body'])
progress_updates = body['progress']

for update in progress_updates:
    print(f"[{update['elapsed']}s] {update['step']}: {update['message']}")
```

### In CloudWatch Logs

Search for: `PROGRESS:`

```
2025-10-23 15:39:17,007 - renewable_agent_lambda - INFO - PROGRESS: {"type": "progress", "step": "init", ...}
```

## Example Usage

### Test Cold Start Progress

```python
import json

event = {
    "agent": "terrain",
    "query": "Analyze terrain",
    "parameters": {
        "latitude": 35.067482,
        "longitude": -101.395466
    }
}

response = handler(event, context)
body = json.loads(response['body'])

# Check progress updates
assert 'progress' in body
assert len(body['progress']) >= 7  # Cold start has 7+ updates

# Verify cold start detected
assert body['performance']['coldStart'] == True

# Print progress timeline
for p in body['progress']:
    print(f"[{p['elapsed']:5.1f}s] {p['step']:10s} - {p['message']}")
```

### Test Warm Start Progress

```python
# First invocation (cold start)
response1 = handler(event, context)

# Second invocation (warm start)
response2 = handler(event, context)
body2 = json.loads(response2['body'])

# Check progress updates
assert len(body2['progress']) == 4  # Warm start has 4 updates

# Verify warm start detected
assert body2['performance']['coldStart'] == False
```

## Debugging Tips

### Check Progress in Logs

```bash
# View CloudWatch logs
aws logs tail /aws/lambda/RenewableAgentsFunction --follow

# Filter for progress updates
aws logs filter-pattern /aws/lambda/RenewableAgentsFunction --filter-pattern "PROGRESS"
```

### Measure Initialization Time

```python
# Get progress updates
progress = body['progress']

# Find init and ready steps
init_time = next(p['elapsed'] for p in progress if p['step'] == 'init')
ready_time = next(p['elapsed'] for p in progress if p['step'] == 'ready')

initialization_duration = ready_time - init_time
print(f"Initialization took {initialization_duration:.2f}s")
```

### Identify Bottlenecks

```python
# Calculate time between steps
for i in range(1, len(progress)):
    prev = progress[i-1]
    curr = progress[i]
    duration = curr['elapsed'] - prev['elapsed']
    print(f"{prev['step']} → {curr['step']}: {duration:.2f}s")
```

## Common Issues

### No Progress Updates in Response

**Problem**: Response doesn't include `progress` field

**Solution**: Ensure you're using the updated Lambda handler with Task 3 implementation

### Progress Updates Out of Order

**Problem**: Progress steps appear in wrong order

**Solution**: Check that `elapsed_time` is calculated from `handler_start_time`, not absolute time

### Missing Progress Steps

**Problem**: Some progress steps are missing

**Solution**: 
- Cold start should have: init, bedrock, tools, agent, thinking, executing, ready, complete
- Warm start should have: warm, thinking, executing, complete
- Check CloudWatch logs for errors

## Next Steps

1. **Task 4**: Create progress storage in DynamoDB
2. **Task 5**: Build AgentProgressIndicator UI component
3. **Frontend Integration**: Poll for progress updates and display in UI

## Related Files

- `amplify/functions/renewableAgents/lambda_handler.py` - Implementation
- `tests/test-progress-updates-unit.py` - Unit tests
- `tests/TASK_3_PROGRESS_UPDATES_COMPLETE.md` - Detailed documentation
