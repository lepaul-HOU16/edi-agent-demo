# Task 2: Cold Start Performance Testing - Ready for Deployment

## Summary

Task 2 implementation is **COMPLETE** except for deployment and testing. All code fixes and test infrastructure are in place.

## What Was Fixed

### Issue
The Strands Agent Lambda was failing with:
```
Unable to import module 'lambda_handler': No module named 'lazy_imports'
```

### Root Cause
The Dockerfile was missing two critical Python modules:
- `lazy_imports.py` - Provides lazy loading for heavy dependencies
- `cloudwatch_metrics.py` - Publishes performance metrics to CloudWatch

### Fix Applied
Updated `amplify/functions/renewableAgents/Dockerfile` to include:
```dockerfile
COPY lazy_imports.py .
COPY cloudwatch_metrics.py .
```

## What You Need to Do

### 1. Deploy the Fix (Required)

The Dockerfile fix must be deployed before testing can proceed.

**Command**:
```bash
npx ampx sandbox
```

**Duration**: 10-15 minutes

**What happens**:
- Docker image is rebuilt with the fix
- Lambda is updated in AWS
- All environment variables and permissions are configured

**How to verify**:
```bash
node tests/verify-strands-agent-deployment.js
```

### 2. Run Cold Start Test

Once deployment is complete, test the cold start performance.

**Automated (Recommended)**:
```bash
./scripts/deploy-and-test-cold-start.sh
```

**Manual**:
```bash
node tests/test-strands-cold-start.js
```

**Duration**: 5-10 minutes (cold start duration)

**What it measures**:
- Total cold start duration
- Initialization time breakdown
- Memory usage
- Success/failure status

### 3. Document Results

Fill out the results template with actual values from the test:

```bash
cp tests/TASK_2_COLD_START_PERFORMANCE_RESULTS_TEMPLATE.md \
   tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md
```

Then edit `tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md` with:
- Actual performance metrics
- Timing breakdown
- Memory usage
- Performance assessment
- Recommendations

### 4. Mark Task Complete

Update `.kiro/specs/complete-renewables-integration/tasks.md`:

```markdown
- [x] 2. Test cold start performance
  - Invoke Lambda directly with test payload ✅
  - Measure initialization time ✅
  - Log cold start duration in CloudWatch ✅
  - Document actual vs estimated performance ✅
  - _Requirements: Cold Start Performance (Req 2)_
```

## Performance Targets

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Cold Start | < 5 min | < 10 min | If > 10 min: Optimize |
| Memory | < 2.5 GB | < 2.8 GB | If > 2.8 GB: Optimize |
| Success Rate | 100% | > 95% | If < 95%: Debug |

## Next Steps Based on Results

### If Cold Start < 5 minutes (EXCELLENT) ✅
1. Mark Task 2 as complete
2. Proceed to Task 3: Test warm start performance
3. Skip Task 4 (lazy loading) - not needed
4. Skip Task 5 (provisioned concurrency) - not needed

### If Cold Start 5-10 minutes (ACCEPTABLE) ⚠️
1. Mark Task 2 as complete with warning
2. Proceed to Task 3: Test warm start performance
3. Consider Task 4 (lazy loading) if cold starts are frequent
4. Monitor cold start frequency

### If Cold Start > 10 minutes (SLOW) ❌
1. Do NOT mark Task 2 as complete
2. Implement Task 4: Lazy loading for PyWake
3. Implement Task 10: Optimize Docker image
4. Re-run Task 2 after optimizations

## Files Created

### Documentation
- ✅ `tests/TASK_2_COLD_START_TESTING_GUIDE.md` - Complete testing guide
- ✅ `tests/TASK_2_COLD_START_IMPLEMENTATION_SUMMARY.md` - Implementation details
- ✅ `tests/TASK_2_COLD_START_PERFORMANCE_RESULTS_TEMPLATE.md` - Results template
- ✅ `tests/TASK_2_QUICK_START.md` - Quick reference
- ✅ `TASK_2_READY_FOR_DEPLOYMENT.md` - This file

### Scripts
- ✅ `scripts/deploy-and-test-cold-start.sh` - Automated deployment and testing
- ✅ `tests/test-strands-cold-start.js` - Cold start performance test (already existed)

### Code Fixes
- ✅ `amplify/functions/renewableAgents/Dockerfile` - Fixed to include missing files

## Quick Reference

```bash
# 1. Deploy fix
npx ampx sandbox

# 2. Test cold start
./scripts/deploy-and-test-cold-start.sh

# 3. View logs
aws logs tail "/aws/lambda/amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm" --follow

# 4. Document results
cp tests/TASK_2_COLD_START_PERFORMANCE_RESULTS_TEMPLATE.md \
   tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md
```

## Estimated Time

- **Deployment**: 10-15 minutes
- **Testing**: 5-10 minutes
- **Documentation**: 10-15 minutes
- **Total**: ~30-40 minutes

## Questions?

See detailed guides:
- Testing: `tests/TASK_2_COLD_START_TESTING_GUIDE.md`
- Implementation: `tests/TASK_2_COLD_START_IMPLEMENTATION_SUMMARY.md`
- Quick Start: `tests/TASK_2_QUICK_START.md`

---

**Status**: READY FOR DEPLOYMENT ⏳  
**Blocker**: Sandbox restart required  
**Next Action**: Run `npx ampx sandbox`
