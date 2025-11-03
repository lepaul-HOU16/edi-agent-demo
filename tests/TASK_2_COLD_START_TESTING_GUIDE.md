# Task 2: Test Cold Start Performance - Implementation Guide

## Status: IN PROGRESS ⏳

## Issue Found and Fixed

### Problem
The Strands Agent Lambda was failing with:
```
Unable to import module 'lambda_handler': No module named 'lazy_imports'
```

### Root Cause
The `Dockerfile` was not copying the `lazy_imports.py` and `cloudwatch_metrics.py` files to the Lambda container.

### Fix Applied
Updated `amplify/functions/renewableAgents/Dockerfile` to include:
```dockerfile
COPY lazy_imports.py .
COPY cloudwatch_metrics.py .
```

## Deployment Required

**CRITICAL**: The Lambda must be redeployed for the fix to take effect.

### Deployment Steps

1. **Stop current sandbox** (if running):
   ```bash
   # Press Ctrl+C in the terminal running sandbox
   ```

2. **Restart sandbox to deploy fix**:
   ```bash
   npx ampx sandbox
   ```

3. **Wait for deployment** (10-15 minutes):
   - Watch for "Deployed" message
   - Docker image will be rebuilt with the fix
   - Lambda will be updated in AWS

4. **Verify deployment**:
   ```bash
   node tests/verify-strands-agent-deployment.js
   ```

## Testing Cold Start Performance

Once deployment is complete, run the cold start performance test:

### Test Command
```bash
node tests/test-strands-cold-start.js
```

### Expected Results

#### Excellent Performance (< 5 minutes)
```
✅ EXCELLENT: Cold start completed in XXXs (< 5 minutes)
   Target: < 300s (5 minutes)
   Status: PASSED ✓
```

#### Acceptable Performance (5-10 minutes)
```
⚠️  ACCEPTABLE: Cold start completed in XXXs (< 10 minutes)
   Target: < 300s (5 minutes)
   Acceptable: < 600s (10 minutes)
   Status: PASSED (with warning) ⚠️
```

#### Slow Performance (> 10 minutes)
```
❌ SLOW: Cold start took XXXs (> 10 minutes)
   Target: < 300s (5 minutes)
   Acceptable: < 600s (10 minutes)
   Status: FAILED ✗
```

### Performance Metrics Collected

The test will measure and log:

1. **Total Duration**: Time from invocation to response
2. **Initialization Time**: Time to load dependencies and initialize agent
3. **Execution Time**: Time to process the query
4. **Memory Usage**: Peak memory consumption
5. **Cold Start Detection**: Whether this was a cold or warm start

### Test Output Example

```
🧪 Strands Agent Cold Start Performance Test
======================================================================

✅ Found Strands Agent Lambda:
   Function: amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm
   Runtime: Docker
   Memory: 3008MB
   Timeout: 900s (15.0 minutes)
   Package: Image
   Last Modified: 2025-10-24T12:45:00.000+0000

🎯 Test Configuration:
   Agent: terrain
   Location: 35.067482, -101.395466
   Radius: 2km

⏱️  Start time: 2025-10-24T12:45:30.000Z
🚀 Invoking Lambda (this may take several minutes)...

✅ Lambda invocation completed
⏱️  Total Duration: 245.50s (4.09 minutes)

📊 Response Analysis:
======================================================================
   Status Code: 200
   Function Error: None

✅ Success Response:
   Success: true
   Agent: terrain
   Message: Terrain analysis complete...
   Artifacts: 1

⚡ Performance Metrics (from Lambda):
   Cold Start: YES ❄️
   Init Time: 180.25s
   Execution Time: 65.25s
   Memory Used: 2450 MB

📈 Detailed Timing Breakdown:
======================================================================
   Total Duration: 245.50s
   ├─ Initialization: 180.25s (73.4%)
   │  ├─ Docker image pull
   │  ├─ Python runtime startup
   │  ├─ Dependency loading (PyWake, GeoPandas, etc.)
   │  └─ Bedrock connection
   └─ Execution: 65.25s (26.6%)
      ├─ Agent reasoning
      ├─ Tool execution
      └─ Response generation

📦 Artifacts Generated:
   1. Type: terrain_analysis
      URL: s3://bucket/path/terrain.html

======================================================================
🎯 Cold Start Performance Assessment:
======================================================================
✅ EXCELLENT: Cold start completed in 245.50s
   Target: < 300s (5 minutes)
   Status: PASSED ✓

📋 Next Steps:
   ✅ Cold start performance meets requirements
   ✅ Proceed to warm start testing (test-strands-warm-start.js)
   ✅ Add performance monitoring and CloudWatch metrics
```

## CloudWatch Logs Analysis

After running the test, check CloudWatch logs for detailed timing:

```bash
# Get Lambda function name
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text)

# Get latest log stream
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
LOG_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text)

# View logs
aws logs get-log-events \
  --log-group-name "$LOG_GROUP" \
  --log-stream-name "$LOG_STREAM" \
  --limit 100
```

### Key Log Messages to Look For

1. **Cold Start Detection**:
   ```
   🥶 COLD START - First invocation of this Lambda container
   ⏱️  Initialization time: XXX.XXs
   ```

2. **Bedrock Connection**:
   ```
   🔌 Creating new Bedrock runtime client (connection pooling)
   ✅ Bedrock client created in XX.XXs
   ```

3. **Progress Updates**:
   ```
   PROGRESS: {"type":"progress","step":"init","message":"🚀 Initializing Strands Agent system...","elapsed":0.5}
   PROGRESS: {"type":"progress","step":"bedrock","message":"🤖 Bedrock connection established (3.5s)","elapsed":3.5}
   PROGRESS: {"type":"progress","step":"tools","message":"🔧 Loading terrain agent tools...","elapsed":5.0}
   ```

4. **Performance Metrics**:
   ```
   📊 Performance metrics: {"coldStart":true,"initTime":180.25,"executionTime":245.50,"memoryUsed":2450.0}
   ```

## Performance Targets

Based on requirements from `.kiro/specs/fix-strands-agent-cold-start/requirements.md`:

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Cold Start | < 5 min (300s) | < 10 min (600s) | If > 10 min: Implement lazy loading |
| Warm Start | < 30s | < 60s | If > 60s: Optimize agent code |
| Memory Usage | < 2.5GB | < 2.8GB | If > 2.8GB: Optimize dependencies |
| Success Rate | > 95% | > 90% | If < 90%: Debug failures |

## Next Steps After Testing

### If Cold Start < 5 minutes (EXCELLENT)
1. ✅ Mark Task 2 as complete
2. ✅ Proceed to Task 3: Test warm start performance
3. ✅ Skip Task 4 (lazy loading) - not needed
4. ✅ Skip Task 5 (provisioned concurrency) - not needed
5. ✅ Proceed to Task 6: Test multi-agent orchestration

### If Cold Start 5-10 minutes (ACCEPTABLE)
1. ⚠️  Mark Task 2 as complete with warning
2. ✅ Proceed to Task 3: Test warm start performance
3. ⚠️  Consider Task 4 (lazy loading) if cold starts are frequent
4. ⚠️  Monitor cold start frequency
5. ✅ Proceed to Task 6: Test multi-agent orchestration

### If Cold Start > 10 minutes (SLOW)
1. ❌ Do NOT mark Task 2 as complete
2. ❌ Implement Task 4: Lazy loading for PyWake and heavy dependencies
3. ❌ Implement Task 10: Optimize Docker image with multi-stage build
4. ❌ Re-run Task 2 after optimizations
5. ❌ Only proceed after cold start < 10 minutes

## Documentation Requirements

After testing, document the following in `tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md`:

1. **Actual Performance**:
   - Cold start duration (seconds)
   - Initialization time breakdown
   - Memory usage
   - Success/failure status

2. **Comparison to Estimates**:
   - Estimated: 2-5 minutes
   - Actual: XXX minutes
   - Variance: +/- XX%

3. **Performance Rating**:
   - EXCELLENT / ACCEPTABLE / SLOW
   - Passed: YES / NO

4. **Recommendations**:
   - If excellent: Proceed to next tasks
   - If acceptable: Monitor and consider optimization
   - If slow: Immediate optimization required

5. **CloudWatch Logs**:
   - Link to log group
   - Key timing metrics
   - Any errors or warnings

## Troubleshooting

### Issue: Lambda still fails with import error
**Solution**: Verify Docker image was rebuilt
```bash
# Check Lambda last modified time
aws lambda get-function \
  --function-name amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm \
  --query 'Configuration.LastModified'

# Should be recent (after Dockerfile fix)
```

### Issue: Timeout after 15 minutes
**Solution**: Cold start is too slow, immediate optimization required
1. Implement lazy loading (Task 4)
2. Optimize Docker image (Task 10)
3. Consider increasing timeout temporarily

### Issue: Memory exceeded
**Solution**: Reduce memory usage
1. Check which dependencies use most memory
2. Implement lazy loading for heavy dependencies
3. Consider increasing memory allocation

### Issue: Bedrock connection fails
**Solution**: Check IAM permissions
```bash
# Verify Bedrock permissions
aws iam get-role-policy \
  --role-name amplify-digitalassistant--RenewableAgentsFunctionSe-kDHId7qMp0ek \
  --policy-name RenewableAgentsFunctionServiceRoleDefaultPolicy5ACE453F
```

## Summary

Task 2 tests the cold start performance of the Strands Agent Lambda to ensure it meets the < 5 minute target. The test measures initialization time, execution time, and memory usage, and provides recommendations for optimization if needed.

**Current Status**: Dockerfile fixed, awaiting deployment and testing.

**Next Action**: Deploy the fix and run the cold start performance test.
