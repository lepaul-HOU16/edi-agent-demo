# Renewable Energy Dashboard Testing - Complete Guide

## Overview

Now that the Docker Lambda is working, this guide helps you test the complete renewable energy workflow with focus on:
- ✅ Docker Lambda functionality (wake simulation)
- ✅ Dashboard rendering (3 consolidated dashboards)
- ✅ End-to-end workflow
- ✅ Project persistence
- ✅ User experience features

---

## Quick Start (5 Minutes)

### Option 1: Automated Backend Test

```bash
# Run the automated test suite
./tests/run-dashboard-tests.sh
```

This will:
1. Check pre-flight requirements
2. Verify Docker Lambda is deployed
3. Run automated backend tests
4. Provide UI testing instructions

### Option 2: Manual Quick Test

Open the chat interface and run these 7 prompts:

```
1. Analyze terrain at 35.067482, -101.395466
2. Optimize turbine layout
3. Generate wind rose
4. Run wake simulation
5. Show wind resource dashboard
6. Show performance dashboard
7. Show wake analysis dashboard
```

**Pass Criteria:** All 7 complete with visualizations displayed.

---

## Test Files Created

### 1. **test-renewable-dashboards-e2e.js**
   - Automated backend testing
   - Tests all 5 core analyses
   - Tests all 3 dashboards
   - Validates Docker Lambda
   - Checks project persistence

**Run:**
```bash
node tests/test-renewable-dashboards-e2e.js
```

### 2. **DASHBOARD_UI_TEST_GUIDE.md**
   - Comprehensive UI testing guide
   - Step-by-step instructions
   - Visual checks for each feature
   - Screenshot checklist
   - Troubleshooting section

**Use:** Follow the guide for manual UI testing

### 3. **run-dashboard-tests.sh**
   - Automated test runner
   - Pre-flight checks
   - Backend test execution
   - UI testing instructions

**Run:**
```bash
./tests/run-dashboard-tests.sh
```

---

## What Gets Tested

### Core Analyses (5 Features)
1. ✅ **Terrain Analysis**
   - 151 features (not 60)
   - Interactive map
   - Wind statistics
   - Suitability score
   - Project name generation

2. ✅ **Layout Optimization**
   - Turbine placement
   - Capacity calculations
   - Map visualization
   - Auto-loads coordinates

3. ✅ **Wind Rose**
   - Plotly interactive chart
   - 16 directional bins
   - Speed ranges
   - Export functionality

4. ✅ **Wake Simulation (Docker Lambda)**
   - Heat map visualization
   - AEP calculation
   - Capacity factor
   - Wake losses
   - **Tests Docker Lambda!**

5. ✅ **Report Generation**
   - Comprehensive HTML report
   - All visualizations
   - Executive summary
   - Downloadable

### Dashboards (3 Consolidated Views)

6. ✅ **Wind Resource Dashboard**
   - 60% wind rose, 40% charts
   - Seasonal patterns
   - Speed distribution
   - Monthly averages
   - Variability analysis

7. ✅ **Performance Analysis Dashboard**
   - 2x2 grid layout
   - Monthly energy production
   - Capacity factor distribution
   - Turbine performance heatmap
   - Availability and losses

8. ✅ **Wake Analysis Dashboard**
   - 50% map, 50% charts
   - Wake heat map
   - Wake deficit profile
   - Turbine interaction matrix
   - Wake loss by direction

### User Experience Features

9. ✅ **Project Persistence**
   - Auto-generated project names
   - S3 storage
   - Session context
   - Project listing
   - Data survives refresh

10. ✅ **Action Buttons**
    - Contextual next-step buttons
    - Pre-filled queries
    - Workflow guidance

11. ✅ **Chain of Thought**
    - Cloudscape ExpandableSection
    - Step-by-step display
    - Timing information
    - Status indicators

12. ✅ **Error Handling**
    - User-friendly messages
    - Helpful suggestions
    - Graceful degradation

---

## Docker Lambda Validation

The wake simulation specifically tests the Docker Lambda:

### What to Check:
- [ ] Wake simulation completes (doesn't timeout)
- [ ] Heat map visualization displays
- [ ] Performance metrics calculated (AEP, capacity factor)
- [ ] No Docker-related errors in logs
- [ ] Response time < 15 seconds

### If Docker Lambda Fails:

**Check CloudWatch Logs:**
```bash
# Get simulation Lambda name
LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)

# Tail logs
aws logs tail /aws/lambda/$LAMBDA --follow
```

**Check Configuration:**
```bash
aws lambda get-function-configuration --function-name $LAMBDA
```

**Expected:**
- PackageType: "Image"
- MemorySize: 2048 MB or higher
- Timeout: 300 seconds
- ImageUri: Points to ECR image

---

## Test Execution Flow

### Phase 1: Pre-Flight (2 minutes)
```bash
./tests/run-dashboard-tests.sh
```

Checks:
- ✅ AWS credentials
- ✅ Lambda functions deployed
- ✅ Docker Lambda configured
- ✅ S3 bucket accessible
- ✅ Environment variables set

### Phase 2: Backend Tests (5 minutes)
```bash
node tests/test-renewable-dashboards-e2e.js
```

Tests:
- ✅ Terrain analysis
- ✅ Layout optimization
- ✅ Wind rose generation
- ✅ Wake simulation (Docker)
- ✅ All 3 dashboards
- ✅ Report generation

### Phase 3: UI Tests (15 minutes)

Follow: `tests/DASHBOARD_UI_TEST_GUIDE.md`

Tests:
- ✅ Visual rendering
- ✅ Interactivity
- ✅ Action buttons
- ✅ Project persistence
- ✅ Error handling
- ✅ Performance

---

## Success Criteria

### Must Pass (Critical)
- [ ] All 5 core analyses work
- [ ] Docker Lambda (simulation) works
- [ ] All 3 dashboards render
- [ ] Project data persists
- [ ] No "Visualization Unavailable" errors
- [ ] No infinite loading states
- [ ] No page reloads required

### Should Pass (Important)
- [ ] Action buttons work
- [ ] Chain of thought displays
- [ ] Error messages are helpful
- [ ] Performance within benchmarks
- [ ] Export functionality works

### Nice to Have
- [ ] All charts interactive
- [ ] Smooth animations
- [ ] Fast response times

---

## Performance Benchmarks

| Operation | Target | Max Acceptable | Notes |
|-----------|--------|----------------|-------|
| Terrain Analysis | < 5s | 10s | Includes OSM data fetch |
| Layout Optimization | < 5s | 10s | Includes optimization algorithm |
| Wind Rose | < 3s | 8s | Plotly chart generation |
| Wake Simulation | < 8s | 15s | **Docker Lambda** |
| Dashboard | < 3s | 8s | Data aggregation |
| Report | < 10s | 20s | Comprehensive generation |
| Project List | < 2s | 5s | S3 listing |
| Project Load | < 1s | 3s | S3 retrieval |

---

## Common Issues & Solutions

### Issue 1: Docker Lambda Timeout

**Symptoms:**
- Wake simulation times out
- Error: "Task timed out after 300 seconds"

**Solution:**
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name $LAMBDA \
  --timeout 600
```

### Issue 2: Docker Lambda Memory

**Symptoms:**
- Out of memory errors
- Simulation fails partway through

**Solution:**
```bash
# Increase memory
aws lambda update-function-configuration \
  --function-name $LAMBDA \
  --memory-size 3008
```

### Issue 3: Dashboard Not Rendering

**Symptoms:**
- Blank dashboard area
- "Visualization Unavailable"

**Solution:**
1. Check browser console for errors
2. Verify S3 URLs are accessible
3. Check Plotly library loaded
4. Verify artifact data structure

### Issue 4: Project Persistence Fails

**Symptoms:**
- Data doesn't save
- Can't load previous projects

**Solution:**
1. Check S3 bucket permissions
2. Verify project store Lambda logs
3. Check DynamoDB table exists
4. Verify session ID consistency

---

## Troubleshooting Commands

### Check Lambda Status
```bash
# List all renewable Lambdas
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Renewable')].FunctionName"

# Get simulation Lambda config
LAMBDA=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text)
aws lambda get-function-configuration --function-name $LAMBDA
```

### Check CloudWatch Logs
```bash
# Tail orchestrator logs
aws logs tail /aws/lambda/<orchestrator-name> --follow

# Tail simulation logs
aws logs tail /aws/lambda/<simulation-name> --follow
```

### Check S3 Bucket
```bash
# List renewable projects
aws s3 ls s3://<bucket-name>/renewable/projects/

# Check specific project
aws s3 ls s3://<bucket-name>/renewable/projects/<project-name>/
```

### Check Environment Variables
```bash
# Get orchestrator env vars
aws lambda get-function-configuration \
  --function-name <orchestrator-name> \
  --query "Environment.Variables"
```

---

## Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Local Sandbox [ ] Production

Pre-Flight Checks:           [ ] PASS [ ] FAIL
Backend Tests:               [ ] PASS [ ] FAIL

Core Analyses:
  Terrain Analysis:          [ ] PASS [ ] FAIL
  Layout Optimization:       [ ] PASS [ ] FAIL
  Wind Rose:                 [ ] PASS [ ] FAIL
  Wake Simulation (Docker):  [ ] PASS [ ] FAIL
  Report Generation:         [ ] PASS [ ] FAIL

Dashboards:
  Wind Resource:             [ ] PASS [ ] FAIL
  Performance Analysis:      [ ] PASS [ ] FAIL
  Wake Analysis:             [ ] PASS [ ] FAIL

User Experience:
  Project Persistence:       [ ] PASS [ ] FAIL
  Action Buttons:            [ ] PASS [ ] FAIL
  Chain of Thought:          [ ] PASS [ ] FAIL
  Error Handling:            [ ] PASS [ ] FAIL

Critical Checks:
  Docker Lambda Works:       [ ] PASS [ ] FAIL
  151 Features (not 60):     [ ] PASS [ ] FAIL
  No Viz Unavailable:        [ ] PASS [ ] FAIL
  No Infinite Loading:       [ ] PASS [ ] FAIL

Overall Result:              [ ] PASS [ ] FAIL

Notes:
_________________________________________________
_________________________________________________
_________________________________________________

Issues Found:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Next Steps

### If All Tests Pass ✅
1. Document test results
2. Take screenshots of dashboards
3. Verify performance metrics
4. Prepare for production deployment
5. Update documentation

### If Tests Fail ❌
1. Document exact failure
2. Check troubleshooting section
3. Review CloudWatch logs
4. Fix issues
5. Re-run tests
6. Verify fix

---

## Additional Resources

- **Quick Test Guide:** `tests/RENEWABLE_QUICK_TEST_GUIDE.md`
- **E2E Test Prompts:** `tests/RENEWABLE_E2E_TEST_PROMPTS.md`
- **UI Test Guide:** `tests/DASHBOARD_UI_TEST_GUIDE.md`
- **Test Runner:** `tests/run-dashboard-tests.sh`
- **Automated Tests:** `tests/test-renewable-dashboards-e2e.js`

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review CloudWatch logs for errors
3. Verify pre-flight checks pass
4. Check Docker Lambda configuration
5. Document exact reproduction steps
6. Include error messages and logs

---

## Summary

You now have:
- ✅ Automated backend test script
- ✅ Comprehensive UI test guide
- ✅ Test runner with pre-flight checks
- ✅ Troubleshooting documentation
- ✅ Performance benchmarks
- ✅ Test results template

**Ready to test!**

1. Run: `./tests/run-dashboard-tests.sh`
2. Follow UI test guide
3. Document results
4. Report any issues

**Remember:** Quality over speed. One failure = stop and fix.

---

**Last Updated:** January 2025  
**Status:** Ready for Testing  
**Focus:** Docker Lambda & Dashboards
