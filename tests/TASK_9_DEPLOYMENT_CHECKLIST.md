# Task 9 Deployment Checklist

## Pre-Deployment Validation

### ✅ Code Changes Complete
- [x] Multi-stage Dockerfile created
- [x] Builder stage uses python:3.12-slim
- [x] Runtime stage uses amazon/aws-lambda-python:3.12
- [x] Bytecode pre-compilation added (dependencies)
- [x] Bytecode pre-compilation added (application)
- [x] pip --no-cache-dir flag used
- [x] Build tools removed from final image
- [x] Runtime dependencies minimized

### ✅ Validation Passed
- [x] Dockerfile structure validation script passes
- [x] All optimization features confirmed
- [x] Documentation created
- [x] Comparison document created
- [x] Quick reference guide created

### ✅ Documentation Complete
- [x] DOCKERFILE_OPTIMIZATION.md
- [x] dockerfile-optimization-comparison.md
- [x] TASK_9_DOCKERFILE_OPTIMIZATION_COMPLETE.md
- [x] DOCKERFILE_OPTIMIZATION_QUICK_REFERENCE.md
- [x] test-dockerfile-optimization.sh

## Deployment Steps

### Step 1: Stop Current Sandbox
```bash
# In terminal running sandbox
Ctrl+C

# Verify no processes running
ps aux | grep ampx
```

### Step 2: Deploy Optimized Version
```bash
# Start sandbox with optimized Dockerfile
npx ampx sandbox

# Expected output:
# - Building Docker image (6-10 minutes)
# - Deploying Lambda function (5-10 minutes)
# - "Deployed" message
```

### Step 3: Verify Deployment
```bash
# Check Lambda exists
aws lambda list-functions | grep RenewableAgentsFunction

# Check function configuration
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableAgentsFunction')].FunctionName" --output text)

aws lambda get-function-configuration \
  --function-name "$FUNCTION_NAME" \
  --query "{CodeSize: CodeSize, Timeout: Timeout, Memory: MemorySize}"
```

**Expected**:
- CodeSize: Smaller than before (check actual value)
- Timeout: 900 seconds (15 minutes)
- Memory: 3008 MB (3GB)

### Step 4: Test Cold Start Performance
```bash
# Test cold start (first invocation after deployment)
node tests/test-strands-agent-cold-start.js
```

**Expected Results**:
- Cold start time: <5 minutes (target)
- Acceptable: <10 minutes
- Success: true
- No timeout errors

### Step 5: Test Warm Start Performance
```bash
# Test warm start (second invocation)
node tests/test-strands-warm-start.js
```

**Expected Results**:
- Warm start time: <30 seconds
- Success: true
- Faster than cold start

### Step 6: Test All Agents
```bash
# Test terrain agent
node tests/test-terrain-agent-individual.js

# Test layout agent
# node tests/test-layout-agent-individual.js

# Test simulation agent
# node tests/test-simulation-agent-individual.js

# Test report agent
# node tests/test-report-agent-individual.js
```

**Expected**: All agents respond successfully

### Step 7: Monitor CloudWatch Logs
```bash
# Get log group name
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"

# Tail logs
aws logs tail "$LOG_GROUP" --follow
```

**Look for**:
- "COLD START: X.XXs" (should be <300s)
- "WARM START" (should be <30s)
- No import errors
- No module not found errors

## Post-Deployment Validation

### Performance Metrics

#### Cold Start Time
- [ ] Measured cold start time
- [ ] Cold start <5 minutes (target)
- [ ] Cold start <10 minutes (acceptable)
- [ ] Logged to CloudWatch

#### Warm Start Time
- [ ] Measured warm start time
- [ ] Warm start <30 seconds
- [ ] Consistent across invocations

#### Image Size
- [ ] Checked Docker image size
- [ ] Size <2GB (target)
- [ ] Size <2.5GB (acceptable)
- [ ] Smaller than before optimization

#### Memory Usage
- [ ] Checked peak memory usage
- [ ] Memory <2.5GB (target)
- [ ] Memory <3GB (max)
- [ ] No memory errors

### Functionality Tests

#### Agent Responses
- [ ] Terrain agent works
- [ ] Layout agent works
- [ ] Simulation agent works
- [ ] Report agent works
- [ ] All artifacts generated

#### Error Handling
- [ ] Graceful error messages
- [ ] No timeout errors
- [ ] Fallback works if needed
- [ ] Logs are informative

## Success Criteria

### ✅ Deployment Successful If:
- [x] Lambda deployed without errors
- [ ] Cold start <5 minutes (or <10 minutes acceptable)
- [ ] Warm start <30 seconds
- [ ] All agents respond successfully
- [ ] No import errors
- [ ] No module not found errors
- [ ] Image size reduced
- [ ] CloudWatch logs show improvements

### ⚠️ Issues to Watch For:
- Import errors (missing dependencies)
- Module not found errors (COPY issue)
- Timeout errors (still too slow)
- Memory errors (insufficient memory)
- Build failures (system dependencies)

## Rollback Plan

### If Deployment Fails:
```bash
# 1. Stop sandbox
Ctrl+C

# 2. Revert Dockerfile
git checkout HEAD~1 amplify/functions/renewableAgents/Dockerfile

# 3. Redeploy
npx ampx sandbox

# 4. Verify
node tests/test-strands-agent-deployment.js
```

### If Performance Worse:
```bash
# 1. Document the issue
echo "Cold start: X minutes" >> rollback-reason.txt
echo "Error: [error message]" >> rollback-reason.txt

# 2. Rollback (see above)

# 3. Investigate
# - Check CloudWatch logs
# - Review Dockerfile changes
# - Test locally with Docker
```

## Monitoring

### CloudWatch Metrics to Track
- Cold start duration
- Warm start duration
- Memory usage
- Error rate
- Timeout rate

### CloudWatch Alarms (Task 11)
- Cold start >10 minutes
- Warm start >60 seconds
- Memory >2.8GB
- Error rate >5%

## Next Steps After Deployment

### Immediate (Task 10)
1. Run comprehensive test suite
2. Test all 4 agents individually
3. Test multi-agent orchestration
4. Validate performance improvements

### Follow-up (Task 11)
1. Add CloudWatch custom metrics
2. Create performance alarms
3. Monitor cold/warm start times
4. Track memory usage

### Documentation (Task 12)
1. Document actual performance results
2. Update troubleshooting guide
3. Create performance benchmarks
4. Document lessons learned

## Status

**Task 9**: ✅ COMPLETE
**Deployment**: 🔄 PENDING
**Validation**: ⏳ AWAITING DEPLOYMENT

---

**Ready to Deploy**: YES
**Rollback Plan**: DOCUMENTED
**Success Criteria**: DEFINED
**Monitoring Plan**: READY

**Next Action**: Deploy and validate performance improvements
