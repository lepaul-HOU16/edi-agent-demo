# Task 2: Cold Start Performance Testing - Quick Start

## Current Status: READY FOR DEPLOYMENT ⏳

## What Was Done

✅ **Fixed Dockerfile** - Added missing Python modules (`lazy_imports.py`, `cloudwatch_metrics.py`)  
✅ **Created test scripts** - Automated testing infrastructure ready  
✅ **Created documentation** - Complete guides and templates available

## What You Need to Do

### Step 1: Deploy the Fix (10-15 minutes)

```bash
# Stop current sandbox (if running)
# Press Ctrl+C in terminal running sandbox

# Restart sandbox to deploy fix
npx ampx sandbox

# Wait for "Deployed" message
```

### Step 2: Run Cold Start Test (5-10 minutes)

```bash
# Automated (recommended)
./scripts/deploy-and-test-cold-start.sh

# OR Manual
node tests/test-strands-cold-start.js
```

### Step 3: Document Results (10 minutes)

```bash
# Copy template
cp tests/TASK_2_COLD_START_PERFORMANCE_RESULTS_TEMPLATE.md \
   tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md

# Fill in actual values from test output
# Edit: tests/TASK_2_COLD_START_PERFORMANCE_RESULTS.md
```

### Step 4: Mark Task Complete

Update `.kiro/specs/complete-renewables-integration/tasks.md`:
```markdown
- [x] 2. Test cold start performance
```

## Expected Results

### ✅ EXCELLENT (< 5 minutes)
- Cold start completes in under 5 minutes
- Proceed to Task 3 (warm start testing)
- Skip optimization tasks (4, 5)

### ⚠️ ACCEPTABLE (5-10 minutes)
- Cold start completes in 5-10 minutes
- Proceed to Task 3 (warm start testing)
- Consider optimization if cold starts are frequent

### ❌ SLOW (> 10 minutes)
- Cold start takes over 10 minutes
- Implement Task 4 (lazy loading)
- Implement Task 10 (Docker optimization)
- Re-test before proceeding

## Quick Commands

```bash
# Deploy fix
npx ampx sandbox

# Test cold start
node tests/test-strands-cold-start.js

# View CloudWatch logs
FUNCTION_NAME="amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm"
aws logs tail "/aws/lambda/$FUNCTION_NAME" --follow

# Verify deployment
node tests/verify-strands-agent-deployment.js
```

## Files to Review

- **Testing Guide**: `tests/TASK_2_COLD_START_TESTING_GUIDE.md`
- **Implementation Summary**: `tests/TASK_2_COLD_START_IMPLEMENTATION_SUMMARY.md`
- **Results Template**: `tests/TASK_2_COLD_START_PERFORMANCE_RESULTS_TEMPLATE.md`

## Need Help?

See troubleshooting section in:
- `tests/TASK_2_COLD_START_TESTING_GUIDE.md`

---

**Total Time**: ~30-40 minutes  
**Next Task**: Task 3 (Warm Start Testing)
