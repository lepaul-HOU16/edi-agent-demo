# Renewable Energy Integration Testing Guide

## Overview

This guide provides comprehensive testing procedures for validating the renewable energy integration. It covers automated tests, manual testing workflows, and validation checklists.

## Prerequisites

Before testing, ensure:

1. ✅ Renewable backend is deployed to AgentCore
2. ✅ Environment variables are configured in `.env.local`
3. ✅ S3 bucket is created and accessible
4. ✅ SSM parameters are configured
5. ✅ Amplify backend is deployed with latest changes

## Quick Validation Checklist

```bash
# 1. Check environment variables
echo $NEXT_PUBLIC_RENEWABLE_ENABLED
echo $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT
echo $NEXT_PUBLIC_RENEWABLE_S3_BUCKET

# 2. Verify S3 bucket exists
aws s3 ls s3://$NEXT_PUBLIC_RENEWABLE_S3_BUCKET/

# 3. Verify SSM parameters
aws ssm get-parameter --name "/wind-farm-assistant/s3-bucket-name"

# 4. Test AgentCore endpoint
node scripts/test-agentcore-endpoint.js

# 5. Run integration tests
npm test -- tests/integration/renewable-integration.test.ts
```

## Automated Testing

### Unit Tests (Optional)

Run unit tests for individual components:

```bash
# Test configuration
npm test -- src/services/renewable-integration/config.test.ts

# Test response transformer
npm test -- src/services/renewable-integration/responseTransformer.test.ts

# Test renewable client
npm test -- src/services/renewable-integration/renewableClient.test.ts
```

### Integration Tests

Run full integration test suite:

```bash
# Run all integration tests
npm test -- tests/integration/renewable-integration.test.ts

# Run with coverage
npm test -- tests/integration/renewable-integration.test.ts --coverage

# Run in watch mode
npm test -- tests/integration/renewable-integration.test.ts --watch
```

### Expected Test Results

```
PASS  tests/integration/renewable-integration.test.ts
  Renewable Energy Integration - End-to-End Tests
    Configuration Tests
      ✓ should load renewable configuration (5ms)
      ✓ should validate enabled status (2ms)
      ✓ should have default region if not specified (1ms)
    RenewableClient Tests
      ✓ should initialize RenewableClient (3ms)
      ✓ should have invokeAgent method (1ms)
    RenewableProxyAgent Tests
      ✓ should initialize RenewableProxyAgent (4ms)
      ✓ should have processQuery method (1ms)
      ✓ should have setSessionId method (1ms)
    ResponseTransformer Tests
      ✓ should have transformToEDIArtifacts method (2ms)
      ✓ should transform terrain artifact (5ms)
      ✓ should transform layout artifact (3ms)
      ✓ should transform simulation artifact (4ms)
      ✓ should handle empty artifacts array (2ms)
  Renewable Energy Integration - Live Tests
    Live AgentCore Communication
      ✓ should connect to AgentCore endpoint (15000ms)
      ✓ should process terrain analysis query (25000ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## Manual Testing Workflows

### Test 1: End-to-End Terrain Analysis

**Objective**: Validate complete flow from user query to terrain map display

**Steps**:

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Chat Interface**
   - Open browser: `http://localhost:3000/chat`
   - Sign in with test credentials

3. **Send Terrain Analysis Query**
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   ```

4. **Validate Response**
   - [ ] Query is detected as renewable energy query
   - [ ] Routing thought step appears: "Routing to Renewable Energy Backend"
   - [ ] AgentCore thought steps appear (terrain analysis, exclusion zones, etc.)
   - [ ] Response message describes terrain analysis results
   - [ ] Terrain map artifact is displayed

5. **Validate Terrain Map Artifact**
   - [ ] Map displays in iframe
   - [ ] Suitability score badge is visible (color-coded)
   - [ ] Coordinates are displayed correctly
   - [ ] Risk assessment metrics are shown
   - [ ] Exclusion zones list is populated
   - [ ] Map is interactive (zoom, pan, layer switching)
   - [ ] Map has correct tile layers (USGS Topo, USGS Satellite, Esri)

6. **Check Browser Console**
   - [ ] No JavaScript errors
   - [ ] Renewable proxy agent logs show successful processing
   - [ ] No CORS errors

7. **Check Network Tab**
   - [ ] AgentCore API call succeeded (200 status)
   - [ ] Response time < 35 seconds
   - [ ] Response includes artifacts

**Expected Result**: Terrain map displays with suitability score, exclusion zones, and interactive features.

---

### Test 2: Layout Design Workflow

**Objective**: Validate layout design after terrain analysis

**Steps**:

1. **Continue from Test 1** (terrain analysis complete)

2. **Send Layout Design Query**
   ```
   Create a 30MW wind farm layout at those coordinates
   ```

3. **Validate Response**
   - [ ] Query is routed to renewable backend
   - [ ] Layout design thought steps appear
   - [ ] Response describes layout design
   - [ ] Layout map artifact is displayed

4. **Validate Layout Map Artifact**
   - [ ] Map displays turbine positions
   - [ ] Turbine count badge shows correct number
   - [ ] Total capacity badge shows 30 MW
   - [ ] Layout information grid is populated
   - [ ] Turbine spacing is displayed
   - [ ] Map is interactive
   - [ ] Turbine markers are visible on map

5. **Validate Layout Data**
   - [ ] Turbine positions are within site boundaries
   - [ ] Spacing meets minimum requirements
   - [ ] Layout type is specified (Grid, Random, Optimized)
   - [ ] Wind angle is displayed

**Expected Result**: Layout map displays with turbine positions, capacity, and spacing information.

---

### Test 3: Wake Simulation Workflow

**Objective**: Validate wake simulation after layout design

**Steps**:

1. **Continue from Test 2** (layout design complete)

2. **Send Simulation Query**
   ```
   Run wake simulation for the layout
   ```

3. **Validate Response**
   - [ ] Query is routed to renewable backend
   - [ ] Simulation thought steps appear
   - [ ] Response describes simulation results
   - [ ] Simulation chart artifact is displayed

4. **Validate Simulation Chart Artifact**
   - [ ] Performance metrics badges are displayed
   - [ ] Annual Energy Production (AEP) is shown
   - [ ] Capacity Factor is shown
   - [ ] Wake losses percentage is shown
   - [ ] Wake map image is displayed
   - [ ] Performance chart image is displayed
   - [ ] Optimization recommendations are listed

5. **Validate Simulation Data**
   - [ ] AEP value is reasonable (> 0)
   - [ ] Capacity factor is between 0 and 1
   - [ ] Wake losses are between 0 and 1
   - [ ] Charts are clear and readable
   - [ ] Recommendations are actionable

**Expected Result**: Simulation charts display with performance metrics and optimization recommendations.

---

### Test 4: Executive Report Generation

**Objective**: Validate report generation after simulation

**Steps**:

1. **Continue from Test 3** (simulation complete)

2. **Send Report Query**
   ```
   Generate executive report
   ```

3. **Validate Response**
   - [ ] Query is routed to renewable backend
   - [ ] Report generation thought steps appear
   - [ ] Response confirms report generation
   - [ ] Report artifact is displayed

4. **Validate Report Artifact**
   - [ ] Executive summary is displayed
   - [ ] Recommendations are numbered and listed
   - [ ] Full report HTML is displayed in iframe
   - [ ] Report includes all previous analysis results
   - [ ] Report is professionally formatted

5. **Validate Report Content**
   - [ ] Executive summary is concise and informative
   - [ ] Recommendations are specific and actionable
   - [ ] Report includes terrain analysis results
   - [ ] Report includes layout design details
   - [ ] Report includes simulation results
   - [ ] Report includes visualizations

**Expected Result**: Executive report displays with summary, recommendations, and complete analysis.

---

### Test 5: Error Handling

**Objective**: Validate error handling for various failure scenarios

#### Test 5.1: Invalid Coordinates

**Query**:
```
Analyze terrain for wind farm at invalid coordinates
```

**Expected**:
- [ ] Error message is user-friendly
- [ ] Thought steps show error status
- [ ] No artifacts are displayed
- [ ] Error suggests correct format

#### Test 5.2: AgentCore Unavailable

**Setup**: Temporarily disable AgentCore or use invalid endpoint

**Query**:
```
Analyze terrain for wind farm at 35.067482, -101.395466
```

**Expected**:
- [ ] Connection error message is displayed
- [ ] Error message: "Unable to connect to the renewable energy service"
- [ ] Thought steps show error status
- [ ] User is advised to check connection

#### Test 5.3: Authentication Failure

**Setup**: Use invalid or expired Cognito token

**Query**:
```
Analyze terrain for wind farm at 35.067482, -101.395466
```

**Expected**:
- [ ] Authentication error message is displayed
- [ ] Error message: "Authentication failed. Please sign in again"
- [ ] User is prompted to re-authenticate

---

### Test 6: Visualization Quality

**Objective**: Validate visualization quality and interactivity

#### Test 6.1: Folium Map Features

**Steps**:
1. Generate terrain or layout map
2. Interact with map

**Validate**:
- [ ] Map loads without errors
- [ ] Zoom in/out works smoothly
- [ ] Pan works smoothly
- [ ] Layer switcher is functional
- [ ] USGS Topo layer displays correctly
- [ ] USGS Satellite layer displays correctly
- [ ] Esri satellite layer displays correctly
- [ ] Markers/polygons are visible
- [ ] Tooltips/popups work on click
- [ ] Map is responsive to window resize

#### Test 6.2: Matplotlib Chart Quality

**Steps**:
1. Generate simulation results
2. Examine charts

**Validate**:
- [ ] Charts load without errors
- [ ] Images are clear and readable
- [ ] Axes labels are visible
- [ ] Legend is visible
- [ ] Colors are distinguishable
- [ ] Charts are properly sized
- [ ] Charts are responsive

---

## Performance Testing

### Response Time Validation

**Objective**: Ensure response times meet requirements (< 35 seconds)

**Test Queries**:

1. **Terrain Analysis**
   ```
   Analyze terrain for wind farm at 35.067482, -101.395466
   ```
   - Expected: 10-20 seconds
   - Acceptable: < 35 seconds

2. **Layout Design**
   ```
   Create a 30MW wind farm layout at those coordinates
   ```
   - Expected: 15-25 seconds
   - Acceptable: < 35 seconds

3. **Wake Simulation**
   ```
   Run wake simulation for the layout
   ```
   - Expected: 20-30 seconds
   - Acceptable: < 35 seconds

4. **Report Generation**
   ```
   Generate executive report
   ```
   - Expected: 5-10 seconds
   - Acceptable: < 35 seconds

**Measurement**:
- Use browser DevTools Network tab
- Record time from request to response
- Average over 3 runs

---

## Agent Routing Validation

### Test 7: Pattern Detection

**Objective**: Validate renewable query detection

**Test Queries** (should route to renewable):

1. ✅ "Analyze terrain for wind farm at 35.067482, -101.395466"
2. ✅ "Create a wind farm layout"
3. ✅ "Run turbine simulation"
4. ✅ "Optimize wind farm design"
5. ✅ "Generate renewable energy report"
6. ✅ "What is the wind resource at this location?"
7. ✅ "Design a 50MW wind farm"

**Test Queries** (should NOT route to renewable):

1. ❌ "Analyze well log data"
2. ❌ "Calculate porosity"
3. ❌ "Show me petrophysical analysis"
4. ❌ "What is the shale volume?"

**Validation**:
- [ ] Renewable queries route to renewable backend
- [ ] Non-renewable queries route to petrophysical agents
- [ ] No false positives
- [ ] No false negatives

---

## Regression Testing

### Test 8: Existing Features Still Work

**Objective**: Ensure renewable integration doesn't break existing features

**Test Existing Workflows**:

1. **Petrophysical Analysis**
   ```
   Analyze well log data for WELL-001
   ```
   - [ ] Routes to petrophysical agent
   - [ ] Log visualization displays correctly
   - [ ] No renewable-related errors

2. **Data Catalog**
   ```
   Show me available wells
   ```
   - [ ] Catalog search works
   - [ ] Map displays correctly
   - [ ] No renewable-related errors

3. **Multi-well Correlation**
   ```
   Correlate WELL-001, WELL-002, and WELL-003
   ```
   - [ ] Correlation analysis works
   - [ ] Artifacts display correctly
   - [ ] No renewable-related errors

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Renewable energy service is temporarily unavailable"

**Possible Causes**:
- AgentCore endpoint is incorrect
- AgentCore is not deployed
- Network connectivity issues

**Solutions**:
1. Verify endpoint URL: `echo $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT`
2. Test endpoint: `node scripts/test-agentcore-endpoint.js`
3. Check AgentCore logs: `node scripts/check-agentcore-logs.js`
4. Redeploy backend if needed

#### Issue: "Authentication failed"

**Possible Causes**:
- Cognito token expired
- IAM permissions missing
- Cognito user pool misconfigured

**Solutions**:
1. Sign out and sign in again
2. Check IAM permissions in `amplify/backend.ts`
3. Verify Cognito configuration

#### Issue: Maps not displaying

**Possible Causes**:
- Folium HTML is malformed
- iframe sandbox restrictions
- CORS issues

**Solutions**:
1. Check browser console for errors
2. Verify iframe sandbox attributes
3. Check network tab for blocked requests
4. Verify S3 CORS configuration

#### Issue: Charts not displaying

**Possible Causes**:
- Base64 image data is invalid
- Image size too large
- Browser memory issues

**Solutions**:
1. Check browser console for errors
2. Verify base64 data format
3. Check image size (should be < 5MB)
4. Try in different browser

---

## Test Results Documentation

### Test Execution Log Template

```markdown
## Test Execution: [Date]

### Environment
- Environment: Development / Staging / Production
- Renewable Enabled: Yes / No
- AgentCore Endpoint: [URL]
- S3 Bucket: [bucket-name]
- Tester: [Name]

### Test Results

#### Test 1: End-to-End Terrain Analysis
- Status: ✅ Pass / ❌ Fail
- Response Time: [X] seconds
- Notes: [Any observations]

#### Test 2: Layout Design Workflow
- Status: ✅ Pass / ❌ Fail
- Response Time: [X] seconds
- Notes: [Any observations]

#### Test 3: Wake Simulation Workflow
- Status: ✅ Pass / ❌ Fail
- Response Time: [X] seconds
- Notes: [Any observations]

#### Test 4: Executive Report Generation
- Status: ✅ Pass / ❌ Fail
- Response Time: [X] seconds
- Notes: [Any observations]

#### Test 5: Error Handling
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

#### Test 6: Visualization Quality
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

#### Test 7: Agent Routing
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

#### Test 8: Regression Testing
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

### Issues Found
1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]

### Overall Assessment
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Pass Rate: [X]%
- Ready for Production: Yes / No
```

---

## Continuous Integration

### Automated Test Pipeline

```yaml
# .github/workflows/renewable-integration-tests.yml
name: Renewable Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm test -- tests/integration/renewable-integration.test.ts
        env:
          NEXT_PUBLIC_RENEWABLE_ENABLED: true
          NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT: ${{ secrets.AGENTCORE_ENDPOINT }}
          NEXT_PUBLIC_RENEWABLE_S3_BUCKET: ${{ secrets.S3_BUCKET }}
          NEXT_PUBLIC_RENEWABLE_AWS_REGION: us-west-2
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

---

## Success Criteria

The renewable energy integration is considered fully validated when:

- [ ] All automated tests pass
- [ ] All manual test workflows complete successfully
- [ ] Response times are < 35 seconds
- [ ] Visualizations display correctly
- [ ] Error handling works as expected
- [ ] Agent routing is accurate
- [ ] No regressions in existing features
- [ ] Performance meets requirements
- [ ] Security validation passes
- [ ] Documentation is complete

---

## Next Steps After Testing

1. **If all tests pass**:
   - Mark Task 12 as complete
   - Proceed to Task 13 (Documentation)
   - Prepare for production deployment

2. **If tests fail**:
   - Document failures in test log
   - Create issues for each failure
   - Fix issues and re-test
   - Update documentation as needed

3. **Performance optimization** (if needed):
   - Implement caching (Task 14.1)
   - Implement progressive rendering (Task 14.2)
   - Optimize visualization loading (Task 14.3)

