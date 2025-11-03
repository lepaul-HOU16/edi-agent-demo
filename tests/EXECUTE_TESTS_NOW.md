# Execute Renewable Energy Tests - Step by Step

## 🚀 Current Status

Your sandbox is **not running**. Let's get it started and run the tests!

---

## Step 1: Start the Sandbox (Required)

Open a terminal and run:

```bash
npx ampx sandbox
```

**Wait for:** "Deployed" message (this can take 5-10 minutes)

**Keep this terminal open** - the sandbox needs to stay running.

---

## Step 2: Verify Deployment (2 minutes)

In a **new terminal**, run:

```bash
node tests/check-deployment-status.js
```

**Expected output:**
```
✅ Renewable orchestrator Lambda found
✅ All tool Lambdas found
✅ Environment variables configured
✅ System ready for testing
```

If you see errors, wait a bit longer for the sandbox to fully deploy.

---

## Step 3: Choose Your Testing Approach

### Option A: Automated Quick Test (Recommended - 5 minutes)

```bash
./tests/run-renewable-e2e-tests.sh smoke
```

This will:
- ✅ Check pre-flight requirements
- ✅ Run 5 automated smoke tests
- ✅ Show pass/fail results
- ✅ Give you next steps

---

### Option B: Manual UI Test (Interactive - 10 minutes)

1. **Open your browser** to your sandbox URL (usually shown in the sandbox terminal)

2. **Navigate to the chat interface**

3. **Switch to "Renewable Energy" agent** (if available in dropdown)

4. **Copy-paste these 5 test prompts one at a time:**

```
Test 1: Analyze terrain at coordinates 35.067482, -101.395466 in Texas
```

**Expected:** Terrain map with ~151 features, elevation data, suitability analysis

```
Test 2: Optimize the turbine layout for this site with 25 turbines
```

**Expected:** Map showing 25 turbines positioned optimally, spacing metrics

```
Test 3: Generate a wind rose analysis for this location
```

**Expected:** Interactive wind rose chart showing wind directions and speeds

```
Test 4: Run a wake simulation for this wind farm layout
```

**Expected:** Wake analysis visualization, energy loss calculations

```
Test 5: Generate a comprehensive project report
```

**Expected:** Multi-panel dashboard with all analysis results

---

### Option C: Comprehensive Test Suite (Thorough - 30 minutes)

```bash
./tests/run-renewable-e2e-tests.sh all
```

This runs all test categories:
- Terrain analysis
- Layout optimization
- Wind rose
- Wake simulation
- Report generation
- Project persistence
- Action buttons
- Dashboards
- Error handling

---

## Step 4: Check Results

### For Automated Tests

The script will show:
```
✅ Test 1: Terrain Analysis - PASS
✅ Test 2: Layout Optimization - PASS
✅ Test 3: Wind Rose - PASS
✅ Test 4: Wake Simulation - PASS
✅ Test 5: Report Generation - PASS

Overall: 5/5 tests passed (100%)
```

### For Manual UI Tests

Check for:
- ✅ All visualizations render (no "Visualization Unavailable")
- ✅ Maps show features and data
- ✅ Charts are interactive (hover, zoom)
- ✅ Loading states dismiss properly
- ✅ No errors in browser console
- ✅ Action buttons appear
- ✅ Project name shows in responses

---

## Step 5: Troubleshooting

### If sandbox won't start:
```bash
# Kill any existing processes
pkill -f ampx

# Try again
npx ampx sandbox
```

### If tests fail:
```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow

# Check S3 bucket
aws s3 ls s3://[BUCKET_NAME]/renewable/

# Re-run specific test
./tests/run-renewable-e2e-tests.sh terrain
```

### If UI shows errors:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify network requests succeed
4. Check if artifacts are being generated

---

## Quick Reference Commands

```bash
# Start sandbox
npx ampx sandbox

# Check deployment status
node tests/check-deployment-status.js

# Run smoke test (5 min)
./tests/run-renewable-e2e-tests.sh smoke

# Run all tests (30 min)
./tests/run-renewable-e2e-tests.sh all

# Run specific category
./tests/run-renewable-e2e-tests.sh terrain
./tests/run-renewable-e2e-tests.sh layout
./tests/run-renewable-e2e-tests.sh windrose

# Check Lambda logs
aws logs tail /aws/lambda/[FUNCTION_NAME] --follow

# List all Lambdas
aws lambda list-functions | grep Renewable
```

---

## Success Criteria

### Must Pass ✅
- [ ] Sandbox is running
- [ ] Deployment check passes
- [ ] Terrain shows 150+ features
- [ ] Layout displays turbines
- [ ] No "Visualization Unavailable"
- [ ] No infinite loading states

### Should Pass ✅
- [ ] Wind rose is interactive
- [ ] Wake simulation completes
- [ ] Report generates successfully
- [ ] Project data persists
- [ ] Action buttons work

---

## What to Do Next

### If All Tests Pass 🎉
1. Document your results
2. Take screenshots
3. Note performance metrics
4. Move to production testing

### If Some Tests Fail ⚠️
1. Note which tests failed
2. Check CloudWatch logs
3. Review error messages
4. Check troubleshooting section
5. Re-run after fixes

### If All Tests Fail ❌
1. Verify sandbox is fully deployed
2. Check environment variables
3. Verify NREL API key is set
4. Check S3 bucket permissions
5. Review deployment logs

---

## Test Documentation

- **Quick Reference:** `tests/RENEWABLE_TEST_CHEAT_SHEET.md`
- **Comprehensive Tests:** `tests/RENEWABLE_E2E_TEST_PROMPTS.md`
- **Quick Guide:** `tests/RENEWABLE_QUICK_TEST_GUIDE.md`
- **Test Index:** `tests/RENEWABLE_TESTING_INDEX.md`

---

## Timeline

| Step | Time | Status |
|------|------|--------|
| Start sandbox | 5-10 min | ⬜ |
| Verify deployment | 2 min | ⬜ |
| Run smoke test | 5 min | ⬜ |
| Review results | 2 min | ⬜ |
| **Total** | **15-20 min** | |

---

## Ready to Start!

1. ✅ Open terminal
2. ✅ Run: `npx ampx sandbox`
3. ✅ Wait for "Deployed"
4. ✅ Run: `./tests/run-renewable-e2e-tests.sh smoke`
5. ✅ Review results

**Let's test!** 🚀
