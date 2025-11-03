# Async Renewable Jobs - End-to-End Testing Guide

## Overview

This guide covers comprehensive testing of the async renewable jobs pattern, which enables long-running renewable energy analyses to complete without timeout errors.

## Test Coverage

### Requirements Tested

1. **Requirement 1: Async Job Model**
   - ✅ Terrain queries complete without timeout (30-60+ seconds)
   - ✅ Backend returns immediately (< 1 second)
   - ✅ Analysis continues in background
   - ✅ No AppSync 30-second timeout errors

2. **Requirement 2: Job Status Tracking**
   - ✅ Real-time progress updates
   - ✅ Current step indication
   - ✅ Estimated time remaining
   - ✅ UI updates automatically

3. **Requirement 3: Result Delivery**
   - ✅ Results appear automatically when ready
   - ✅ Artifacts render correctly
   - ✅ Results persist after page refresh
   - ✅ No reload required

4. **Requirement 4: Error Handling**
   - ✅ Clear error messages
   - ✅ Error type identification
   - ✅ Remediation suggestions
   - ✅ Retry capability

## Test Files

### 1. Unit Tests

**Location:** `tests/e2e/async-renewable-jobs.e2e.test.ts`

**Coverage:**
- Async job model (no timeout errors)
- Job status tracking (real-time progress)
- Result delivery (automatic display)
- Error handling (clear feedback)
- Complete user workflow integration

**Run:**
```bash
npm test tests/e2e/async-renewable-jobs.e2e.test.ts
```

### 2. Manual E2E Test Script

**Location:** `scripts/test-async-renewable-jobs-e2e.js`

**Coverage:**
- Test 1: Terrain query without timeout
- Test 2: Long-running analysis (60+ seconds)
- Test 3: Error handling with invalid coordinates
- Test 4: Result persistence after page refresh

**Run:**
```bash
# Set environment variables
export AWS_REGION=us-east-1
export LIGHTWEIGHT_AGENT_FUNCTION=lightweightAgent
export CHAT_MESSAGE_TABLE=ChatMessage

# Run tests
node scripts/test-async-renewable-jobs-e2e.js
```

## Test Scenarios

### Scenario 1: Terrain Analysis (30-40 seconds)

**Query:** "Analyze terrain at 40.7128, -74.0060 with 5km radius"

**Expected Flow:**
1. User submits query
2. Backend responds in < 1 second with "processing" status
3. Frontend shows progress indicator
4. Backend processes for 30-40 seconds
5. Results appear automatically with 151 features
6. No timeout error occurs

**Verification:**
- ✅ Response time < 1000ms
- ✅ Processing indicator shows
- ✅ Progress updates every 3-5 seconds
- ✅ Results contain terrain_map artifact
- ✅ Terrain map has 151 features
- ✅ No AppSync timeout error

### Scenario 2: Complete Wind Farm Analysis (60+ seconds)

**Query:** "Complete wind farm analysis at 40.7128, -74.0060"

**Expected Flow:**
1. User submits query
2. Backend responds immediately
3. Frontend shows progress through multiple steps:
   - Terrain analysis (15s)
   - Layout optimization (20s)
   - Simulation (20s)
   - Report generation (10s)
4. Results appear with all artifacts
5. Total time: 60-70 seconds
6. No timeout error

**Verification:**
- ✅ Response time < 1000ms
- ✅ Progress indicator shows all steps
- ✅ Estimated time remaining updates
- ✅ Results contain 4+ artifacts:
  - terrain_map
  - wind_rose
  - layout_map
  - simulation_chart
- ✅ No timeout error after 60+ seconds

### Scenario 3: Error Handling

**Query:** "Analyze terrain at 999.999, 999.999" (invalid coordinates)

**Expected Flow:**
1. User submits query
2. Backend responds immediately
3. Backend detects invalid coordinates
4. Error message appears in chat
5. Error includes remediation steps

**Verification:**
- ✅ Error artifact appears
- ✅ Error message is clear
- ✅ Error type is identified
- ✅ Remediation steps provided
- ✅ User can retry

### Scenario 4: Result Persistence

**Query:** "Analyze terrain at 40.7128, -74.0060"

**Expected Flow:**
1. User submits query
2. Results appear after 30 seconds
3. User refreshes page
4. Results still visible
5. No need to re-run analysis

**Verification:**
- ✅ Results persist in DynamoDB
- ✅ Results load after refresh
- ✅ Artifacts render correctly
- ✅ No data loss

## Manual Testing Checklist

### Pre-Test Setup

- [ ] Deploy latest code to sandbox/production
- [ ] Verify Lambda functions are deployed:
  - [ ] lightweightAgent
  - [ ] renewableOrchestrator
  - [ ] renewableTools (terrain, layout, simulation)
- [ ] Verify DynamoDB permissions
- [ ] Verify environment variables set

### Test Execution

#### Test 1: Basic Terrain Query
- [ ] Open application in browser
- [ ] Submit query: "Analyze terrain at 40.7128, -74.0060"
- [ ] Verify immediate response (< 1 second)
- [ ] Verify "Analyzing..." indicator appears
- [ ] Verify progress updates show
- [ ] Wait for results (30-40 seconds)
- [ ] Verify results appear automatically
- [ ] Verify terrain map shows 151 features
- [ ] Verify no page reload required
- [ ] Verify no timeout error

#### Test 2: Long-Running Analysis
- [ ] Submit query: "Complete wind farm analysis at 40.7128, -74.0060"
- [ ] Verify immediate response
- [ ] Verify progress indicator shows steps:
  - [ ] Terrain analysis
  - [ ] Layout optimization
  - [ ] Simulation
  - [ ] Report generation
- [ ] Verify estimated time remaining updates
- [ ] Wait for results (60+ seconds)
- [ ] Verify all artifacts appear:
  - [ ] Terrain map
  - [ ] Wind rose
  - [ ] Layout map
  - [ ] Simulation chart
- [ ] Verify no timeout error

#### Test 3: Error Handling
- [ ] Submit query with invalid coordinates
- [ ] Verify error message appears
- [ ] Verify error is clear and actionable
- [ ] Verify remediation steps provided
- [ ] Retry with valid coordinates
- [ ] Verify retry succeeds

#### Test 4: Result Persistence
- [ ] Submit query and wait for results
- [ ] Verify results appear
- [ ] Refresh browser page
- [ ] Verify results still visible
- [ ] Verify artifacts still render
- [ ] Verify no data loss

#### Test 5: Multiple Concurrent Jobs
- [ ] Open two browser tabs
- [ ] Submit different queries in each tab
- [ ] Verify both jobs process independently
- [ ] Verify results appear in correct tabs
- [ ] Verify no cross-contamination

### Post-Test Verification

- [ ] Check CloudWatch logs for errors
- [ ] Verify DynamoDB records created
- [ ] Verify no Lambda timeouts
- [ ] Verify no memory issues
- [ ] Check performance metrics

## Success Criteria

### Performance
- ✅ Initial response < 1 second
- ✅ Terrain analysis completes in 30-40 seconds
- ✅ Complete analysis completes in 60-70 seconds
- ✅ No timeout errors
- ✅ Progress updates every 3-5 seconds

### Functionality
- ✅ All artifacts render correctly
- ✅ Terrain maps show 151 features
- ✅ Wind roses display correctly
- ✅ Layout maps show turbine positions
- ✅ Simulation charts show energy production

### User Experience
- ✅ Clear progress indication
- ✅ Estimated time remaining shown
- ✅ Results appear automatically
- ✅ No page reload required
- ✅ Error messages are clear
- ✅ Results persist after refresh

### Reliability
- ✅ Zero timeout errors
- ✅ 100% job completion rate
- ✅ Graceful error handling
- ✅ Retry capability works
- ✅ No data loss

## Troubleshooting

### Issue: Timeout Errors Still Occurring

**Symptoms:**
- AppSync timeout after 30 seconds
- Error: "Request timeout"

**Diagnosis:**
1. Check if lightweightAgent is using async invocation
2. Verify `InvocationType: 'Event'` is set
3. Check CloudWatch logs for orchestrator invocation

**Fix:**
- Ensure renewableProxyAgent uses async invocation
- Verify orchestrator is invoked with Event type
- Check IAM permissions for Lambda invocation

### Issue: Results Not Appearing

**Symptoms:**
- Processing indicator shows indefinitely
- No results after 60+ seconds

**Diagnosis:**
1. Check orchestrator CloudWatch logs
2. Verify DynamoDB write permissions
3. Check if results are written to ChatMessage table

**Fix:**
- Grant orchestrator DynamoDB write permissions
- Verify table name environment variable
- Check writeResultsToChatMessage function

### Issue: Polling Not Working

**Symptoms:**
- Results in DynamoDB but not showing in UI
- No automatic updates

**Diagnosis:**
1. Check browser console for errors
2. Verify useRenewableJobPolling hook is active
3. Check if polling interval is correct

**Fix:**
- Ensure polling hook is enabled
- Verify chatSessionId is correct
- Check network requests in browser DevTools

### Issue: Progress Not Updating

**Symptoms:**
- Progress indicator stuck at 0%
- No step updates

**Diagnosis:**
1. Check if orchestrator is updating progress
2. Verify progress data in DynamoDB
3. Check frontend polling logic

**Fix:**
- Ensure orchestrator writes progress updates
- Verify progress data structure
- Check useRenewableJobStatus hook

## Continuous Testing

### Automated Tests

Run automated tests on every deployment:

```bash
# Unit tests
npm test tests/e2e/async-renewable-jobs.e2e.test.ts

# Integration tests
npm test src/hooks/__tests__/useRenewableJobPolling.integration.test.ts

# Component tests
npm test src/components/renewable/__tests__/RenewableJobProcessingIndicator.test.tsx
```

### Manual Smoke Tests

After each deployment, run quick smoke tests:

1. Submit one terrain query
2. Verify results appear
3. Check for any errors

### Performance Monitoring

Monitor key metrics:
- Initial response time (target: < 1s)
- Job completion time (target: < 90s)
- Timeout error rate (target: 0%)
- Job success rate (target: 100%)

## Conclusion

This comprehensive testing guide ensures the async renewable jobs pattern works correctly and provides a reliable, timeout-free experience for long-running renewable energy analyses.

All tests must pass before marking Task 6 as complete.
