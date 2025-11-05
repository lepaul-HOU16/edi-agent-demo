# Design Document

## Overview

The EDIcraft Agent Lambda function currently has a 600-second (10-minute) timeout, which is insufficient for multi-trajectory visualization workflows. When users request multiple trajectories, the visualization completes successfully in Minecraft, but the Lambda function times out before returning a response to the user. This design addresses the timeout configuration and implements better progress tracking and error handling.

## Architecture

### Current State

```
User Request (Multiple Trajectories)
    ↓
EDIcraft Agent Lambda (600s timeout)
    ↓
Python MCP Agent
    ↓
Trajectory Tools (OSDU data fetch + coordinate conversion)
    ↓
RCON Executor (Minecraft commands)
    ↓
Minecraft Server (Visualization completes)
    ↓
Lambda times out before response ❌
```

### Target State

```
User Request (Multiple Trajectories)
    ↓
EDIcraft Agent Lambda (900s timeout, 1024MB memory)
    ↓
Python MCP Agent (with progress tracking)
    ↓
Trajectory Tools (OSDU data fetch + coordinate conversion)
    ↓
RCON Executor (Minecraft commands with batching)
    ↓
Minecraft Server (Visualization completes)
    ↓
Lambda returns success response ✅
```

## Components and Interfaces

### 1. Lambda Configuration Update

**File:** `amplify/functions/edicraftAgent/resource.ts`

**Changes:**
- Increase `timeoutSeconds` from 600 to 900 (15 minutes)
- Maintain `memoryMB` at 1024 (adequate for current workload)
- Add timeout logging in handler initialization

**Rationale:**
- Multi-trajectory workflows can take 10-12 minutes for complex requests
- 900 seconds provides 50% buffer for network latency and processing
- 1024MB memory is sufficient based on current usage patterns

### 2. Progress Tracking Enhancement

**File:** `edicraft-agent/agent.py`

**Changes:**
- Add progress logging for each trajectory processed
- Track elapsed time and estimate remaining time
- Log completion percentage for multi-trajectory requests

**Interface:**
```python
def track_trajectory_progress(current: int, total: int, elapsed_seconds: float):
    """
    Log progress for multi-trajectory visualization
    
    Args:
        current: Number of trajectories completed
        total: Total number of trajectories requested
        elapsed_seconds: Time elapsed since start
    """
    percentage = (current / total) * 100
    avg_time_per_trajectory = elapsed_seconds / current if current > 0 else 0
    estimated_remaining = avg_time_per_trajectory * (total - current)
    
    print(f"Progress: {current}/{total} ({percentage:.1f}%) - "
          f"Elapsed: {elapsed_seconds:.1f}s - "
          f"Estimated remaining: {estimated_remaining:.1f}s")
```

### 3. Timeout-Aware Response Handling

**File:** `amplify/functions/edicraftAgent/handler.ts`

**Changes:**
- Monitor elapsed time during execution
- Return early success response if approaching timeout
- Distinguish between actual failures and timeout-after-completion

**Interface:**
```typescript
interface TimeoutAwareResponse {
  success: boolean;
  message: string;
  partialCompletion?: boolean;
  completedCount?: number;
  totalRequested?: number;
  visualizationComplete?: boolean;
}
```

### 4. RCON Command Batching

**File:** `edicraft-agent/tools/rcon_executor.py`

**Changes:**
- Batch multiple setblock commands where possible
- Reduce network round-trips for trajectory visualization
- Implement command queuing for efficiency

**Current Approach:**
```python
# Individual commands (slow)
for block in trajectory_blocks:
    rcon.command(f"setblock {block.x} {block.y} {block.z} {block.type}")
```

**Optimized Approach:**
```python
# Batched commands (faster)
batch_size = 100
for i in range(0, len(trajectory_blocks), batch_size):
    batch = trajectory_blocks[i:i+batch_size]
    commands = [f"setblock {b.x} {b.y} {b.z} {b.type}" for b in batch]
    # Send batch with minimal delay
    for cmd in commands:
        rcon.command(cmd)
```

## Data Models

### Trajectory Visualization Request

```typescript
interface TrajectoryVisualizationRequest {
  wellIds: string[];           // List of well IDs to visualize
  maxTimeout?: number;         // Optional client-specified timeout
  progressCallback?: boolean;  // Whether to send progress updates
}
```

### Trajectory Visualization Response

```typescript
interface TrajectoryVisualizationResponse {
  success: boolean;
  message: string;
  trajectories: {
    wellId: string;
    status: 'completed' | 'failed' | 'timeout';
    blockCount?: number;
    executionTime?: number;
    error?: string;
  }[];
  totalExecutionTime: number;
  timedOut: boolean;
}
```

## Error Handling

### Timeout Scenarios

1. **Complete Success (< 900s)**
   - All trajectories visualized
   - Response returned normally
   - User sees success message

2. **Timeout After Completion (> 900s)**
   - All trajectories visualized in Minecraft
   - Lambda times out before response
   - User sees timeout error despite success
   - **Fix:** Return early success response at 850s mark

3. **Partial Completion Timeout**
   - Some trajectories visualized
   - Lambda times out mid-process
   - Return partial success with completed count

4. **Early Failure**
   - Error occurs before timeout
   - Return error response immediately
   - No timeout involved

### Error Response Format

```typescript
// Timeout after successful visualization
{
  success: true,
  message: "Visualization completed successfully. Response delayed due to processing time.",
  visualizationComplete: true,
  timedOut: false
}

// Partial completion
{
  success: true,
  message: "Partial visualization completed. 7 of 10 trajectories built.",
  partialCompletion: true,
  completedCount: 7,
  totalRequested: 10,
  visualizationComplete: false
}

// Actual failure
{
  success: false,
  message: "Failed to visualize trajectories: RCON connection error",
  error: "Connection refused"
}
```

## Testing Strategy

### Unit Tests

1. **Lambda Configuration Test**
   - Verify timeout is set to 900 seconds
   - Verify memory is set to 1024 MB
   - Test configuration deployment

2. **Progress Tracking Test**
   - Verify progress logs are generated
   - Test percentage calculations
   - Validate time estimates

3. **Timeout Detection Test**
   - Mock long-running operations
   - Verify early return at 850s mark
   - Test partial completion responses

### Integration Tests

1. **Single Trajectory Test**
   - Request one trajectory
   - Verify completion within timeout
   - Validate response format

2. **Multi-Trajectory Test (5 wells)**
   - Request 5 trajectories
   - Verify all complete within timeout
   - Check progress logging

3. **Multi-Trajectory Test (10 wells)**
   - Request 10 trajectories
   - Verify completion or partial success
   - Validate timeout handling

4. **Timeout Simulation Test**
   - Artificially delay processing
   - Verify early return behavior
   - Check user-facing error message

### End-to-End Tests

1. **User Workflow Test**
   - User selects multiple trajectories in UI
   - Submit visualization request
   - Verify success response received
   - Check Minecraft visualization

2. **Timeout Recovery Test**
   - Request large number of trajectories
   - Verify graceful timeout handling
   - Confirm partial results displayed

## Deployment Plan

### Phase 1: Configuration Update
1. Update `amplify/functions/edicraftAgent/resource.ts`
2. Set `timeoutSeconds: 900`
3. Deploy via `npx ampx sandbox`
4. Verify configuration in AWS Console

### Phase 2: Progress Tracking
1. Add progress logging to `edicraft-agent/agent.py`
2. Test with single trajectory
3. Test with multiple trajectories
4. Verify logs in CloudWatch

### Phase 3: Timeout Handling
1. Implement early return logic in handler
2. Add timeout detection
3. Test with simulated delays
4. Validate user-facing messages

### Phase 4: RCON Optimization (Optional)
1. Implement command batching
2. Measure performance improvement
3. Deploy if significant gains
4. Monitor for regressions

## Performance Considerations

### Current Performance Metrics
- Single trajectory: ~60-90 seconds
- 5 trajectories: ~300-450 seconds (5-7.5 minutes)
- 10 trajectories: ~600-900 seconds (10-15 minutes)

### Expected Improvements
- Configuration change: Eliminates timeout errors
- Progress tracking: No performance impact
- Timeout handling: Minimal overhead (<1 second)
- RCON batching: Potential 10-20% speedup

### Monitoring
- CloudWatch logs for execution time
- Timeout occurrence rate
- Partial completion frequency
- User error reports

## Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**
   ```bash
   git revert HEAD
   npx ampx sandbox
   ```

2. **Configuration Rollback**
   - Revert `timeoutSeconds` to 600
   - Remove progress tracking code
   - Deploy previous version

3. **Verification**
   - Test single trajectory workflow
   - Verify no regressions
   - Monitor CloudWatch logs

## Success Criteria

- ✅ Lambda timeout increased to 900 seconds
- ✅ Multi-trajectory requests (up to 10) complete without timeout
- ✅ Progress logging implemented and visible in CloudWatch
- ✅ User receives success response for completed visualizations
- ✅ No regressions in single trajectory workflow
- ✅ Timeout configuration verified in AWS Console
