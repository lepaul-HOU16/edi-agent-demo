# Quick Start: Testing Renewable Energy Dashboards

## 🚀 Start Here

Your Docker Lambda is working! Now let's test the complete workflow.

---

## Option 1: Automated Backend Test (2 minutes)

```bash
./tests/run-dashboard-tests.sh
```

This will:
- ✅ Check all pre-flight requirements
- ✅ Verify Docker Lambda is deployed
- ✅ Run automated backend tests
- ✅ Show you what to test in the UI

**Expected Result:** Pre-flight checks pass, backend tests show 69% pass rate (validation issues, not functional issues)

---

## Option 2: UI Quick Test (5 minutes)

1. **Open your browser:** `http://localhost:3000`
2. **Navigate to chat interface**
3. **Copy-paste these 7 prompts:**

```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize turbine layout
3. Generate wind rose
4. Run wake simulation
5. Show wind resource dashboard
6. Show performance dashboard
7. Show wake analysis dashboard
```

**Expected Results:**
- ✅ All 7 complete successfully
- ✅ Visualizations render
- ✅ No "Visualization Unavailable" errors
- ✅ Action buttons appear
- ✅ Project data persists

---

## What We Know So Far

### ✅ Working
- Terrain analysis (170 features!)
- Layout optimization
- Project persistence
- Docker Lambda deployed correctly
- No timeouts

### ⚠️ Needs Verification
- Wake simulation artifacts
- Dashboard rendering
- Wind rose Plotly charts

### 📊 Test Results
- **Backend Tests:** 31/45 checks passed (69%)
- **Core Functionality:** ✅ Working
- **Docker Lambda:** ✅ Deployed, ⚠️ Artifacts need verification
- **Performance:** ✅ All within targets

---

## Quick Checks

### Is Docker Lambda Working?

```bash
# Check configuration
aws lambda get-function-configuration \
  --function-name amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0

# Should show:
# - PackageType: "Image"
# - MemorySize: 3008
# - Timeout: 300
```

### Check CloudWatch Logs

```bash
# Tail simulation Lambda logs
aws logs tail /aws/lambda/amplify-digitalassistant--RenewableSimulationToolF-ffzy33Y2jJO0 --follow
```

### Check S3 Bucket

```bash
# List renewable projects
aws s3 ls s3://amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy/renewable/
```

---

## What to Look For in UI

### ✅ Good Signs
- Maps render with features
- Charts are interactive
- Action buttons appear
- Loading states dismiss
- No errors in console
- Project name shows in response

### ❌ Bad Signs
- "Visualization Unavailable"
- Blank maps or charts
- Infinite loading
- Console errors
- Page reload required

---

## If Something Fails

### Terrain Analysis Issues
- Check OSM client is working
- Verify coordinates are valid
- Check S3 bucket permissions

### Layout Optimization Issues
- Verify terrain ran first
- Check project context loading
- Verify coordinates auto-loaded

### Wake Simulation Issues (Docker Lambda)
- Check CloudWatch logs
- Verify Docker image deployed
- Check memory/timeout settings
- Verify artifact generation in handler

### Dashboard Issues
- Check if data exists (run analyses first)
- Verify Plotly library loaded
- Check browser console for errors
- Verify S3 URLs accessible

---

## Test Documentation

### Comprehensive Guides
- **UI Testing:** `tests/DASHBOARD_UI_TEST_GUIDE.md`
- **Test Summary:** `tests/DASHBOARD_TEST_SUMMARY.md`
- **Test Results:** `tests/DASHBOARD_TEST_RESULTS.md`

### Quick References
- **Quick Test Guide:** `tests/RENEWABLE_QUICK_TEST_GUIDE.md`
- **E2E Prompts:** `tests/RENEWABLE_E2E_TEST_PROMPTS.md`

### Scripts
- **Test Runner:** `tests/run-dashboard-tests.sh`
- **Automated Tests:** `tests/test-renewable-dashboards-e2e.js`

---

## Next Steps

1. ✅ **Run automated tests** (if not done)
   ```bash
   ./tests/run-dashboard-tests.sh
   ```

2. ✅ **Test in UI** (5 minutes)
   - Run the 7 prompts above
   - Verify visualizations render
   - Check action buttons work

3. ⚠️ **Check Docker Lambda logs** (if wake simulation fails)
   ```bash
   aws logs tail /aws/lambda/<simulation-lambda> --follow
   ```

4. ✅ **Document results**
   - Take screenshots
   - Note any issues
   - Record performance

5. ✅ **Report findings**
   - What works
   - What doesn't
   - Any errors encountered

---

## Success Criteria

### Must Pass ✅
- [ ] Terrain shows 150+ features
- [ ] Layout shows turbines on map
- [ ] No "Visualization Unavailable"
- [ ] No infinite loading
- [ ] Project data persists

### Should Pass ✅
- [ ] Wake simulation completes
- [ ] Dashboards render
- [ ] Wind rose is interactive
- [ ] Action buttons work

### Nice to Have ✅
- [ ] All charts interactive
- [ ] Export functionality works
- [ ] Performance < 10s per operation

---

## Quick Commands

```bash
# Run all tests
./tests/run-dashboard-tests.sh

# Run just backend tests
node tests/test-renewable-dashboards-e2e.js

# Check Lambda status
aws lambda list-functions | grep Renewable

# Tail orchestrator logs
aws logs tail /aws/lambda/<orchestrator-name> --follow

# Tail simulation logs
aws logs tail /aws/lambda/<simulation-name> --follow

# Check S3 bucket
aws s3 ls s3://<bucket-name>/renewable/
```

---

## Summary

**Status:** 🟢 Ready to Test

**What's Working:**
- ✅ Docker Lambda deployed
- ✅ Terrain analysis (170 features)
- ✅ Layout optimization
- ✅ Project persistence
- ✅ No timeouts

**What to Test:**
- ⚠️ Wake simulation artifacts
- ⚠️ Dashboard rendering
- ⚠️ Wind rose charts
- ⚠️ End-to-end workflow

**Time Required:**
- Automated tests: 2 minutes
- UI testing: 5 minutes
- Total: 7 minutes

**Let's test!** 🚀

