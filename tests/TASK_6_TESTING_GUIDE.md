# Task 6: Chain of Thought Testing Guide

## Quick Test

### 1. Set Environment Variable

```bash
# Get your orchestrator function name
aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text

# Set environment variable
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME=<your-function-name>
```

### 2. Run Test

```bash
node tests/test-nrel-chain-of-thought.js
```

## Expected Output

```
═══════════════════════════════════════════════════════════
🧪 TESTING NREL CHAIN OF THOUGHT INTEGRATION
═══════════════════════════════════════════════════════════

📋 Test Case: Wind Rose Analysis
   Query: "Generate wind rose for coordinates 35.067482, -101.395466"
───────────────────────────────────────────────────────────
🔧 Invoking: amplify-digitalassistant-renewableOrchestrator-...

✅ Response received
   Success: true
   Thought Steps: 12

📊 Thought Steps Found:
   1. Validating deployment
      Status: complete
      Reasoning: Checking if renewable energy tools are available
      Result: All tools available
      Duration: 45ms
   
   2. Analyzing query
      Status: complete
      Reasoning: Determining which renewable energy tool to use
      Result: Detected: wind_rose
      Duration: 120ms
   
   3. Resolving project context
      Status: complete
      Reasoning: Loading project data to auto-fill parameters
      Result: New project: wind-rose-texas-panhandle
      Duration: 230ms
   
   4. Validating parameters
      Status: complete
      Reasoning: Checking parameters with project context
      Result: All parameters valid
      Duration: 35ms
   
   5. Calling wind_rose tool
      Status: complete
      Reasoning: Query matches wind_rose pattern with 95% confidence
      Result: Generated 1 artifact(s)
      Duration: 3450ms
   
   6. Fetching wind data from NREL Wind Toolkit API
      Status: complete
      Reasoning: Retrieving real meteorological data for coordinates (35.067482, -101.395466) from year 2023
      Result: Retrieved wind data from NREL Wind Toolkit (2023), 8760 data points
      Duration: 1035ms
   
   7. Processing wind data with Weibull distribution fitting
      Status: complete
      Reasoning: Analyzing wind patterns and calculating statistical parameters
      Result: Processed 8760 hours of data, mean wind speed: 8.50 m/s, Weibull parameters calculated
      Duration: 1380ms
   
   8. Sub-agent: Parameter validation
      Status: complete
      Reasoning: Validated coordinates (35.067482, -101.395466) are within NREL Wind Toolkit coverage area (Continental US)
      Result: Coordinates validated, within NREL coverage
      Duration: 50ms
   
   9. Sub-agent: Data source selection
      Status: complete
      Reasoning: Selected NREL Wind Toolkit API as primary data source. Real meteorological data preferred over synthetic data per system requirements.
      Result: NREL Wind Toolkit API selected (real data)
      Duration: 30ms
   
   10. Sub-agent: Data quality assessment
       Status: complete
       Reasoning: Assessed data quality and completeness for 8760 hours of measurements
       Result: Data quality: high, suitable for analysis
       Duration: 40ms
   
   11. Processing results
       Status: complete
       Reasoning: Formatting tool output for display
       Result: Successfully processed 1 result(s)
       Duration: 85ms
   
   12. Saving project data
       Status: complete
       Reasoning: Persisting results for project: wind-rose-texas-panhandle
       Result: Project data saved to S3
       Duration: 340ms

✅ PASSED: All expected thought steps found

📋 NREL Fetch Step Details:
   Action: Fetching wind data from NREL Wind Toolkit API
   Reasoning: Retrieving real meteorological data for coordinates (35.067482, -101.395466) from year 2023
   Status: complete
   Result: Retrieved wind data from NREL Wind Toolkit (2023), 8760 data points
   ✅ Contains data source information
   ✅ Contains data year
   ✅ Contains data point count

📋 Weibull Processing Step Details:
   Action: Processing wind data with Weibull distribution fitting
   Reasoning: Analyzing wind patterns and calculating statistical parameters
   Status: complete
   Result: Processed 8760 hours of data, mean wind speed: 8.50 m/s, Weibull parameters calculated
   ✅ Contains mean wind speed

📋 Sub-Agent Reasoning Steps:
   - Sub-agent: Parameter validation
     Reasoning: Validated coordinates (35.067482, -101.395466) are within NREL Wind Toolkit coverage area (Continental US)
     Result: Coordinates validated, within NREL coverage
   - Sub-agent: Data source selection
     Reasoning: Selected NREL Wind Toolkit API as primary data source. Real meteorological data preferred over synthetic data per system requirements.
     Result: NREL Wind Toolkit API selected (real data)
   - Sub-agent: Data quality assessment
     Reasoning: Assessed data quality and completeness for 8760 hours of measurements
     Result: Data quality: high, suitable for analysis
   ✅ Found 3 sub-agent reasoning step(s)

═══════════════════════════════════════════════════════════
📊 TEST SUMMARY
═══════════════════════════════════════════════════════════
✅ Passed: 3/3
❌ Failed: 0/3
═══════════════════════════════════════════════════════════

✅ All tests passed!
```

## Manual Testing in UI

### 1. Open Chat Interface

Navigate to the chat interface in your browser.

### 2. Send Test Query

Try one of these queries:
- "Generate wind rose for coordinates 35.067482, -101.395466"
- "Analyze terrain at 35.067482, -101.395466 with 5km radius"
- "Run wake simulation for project test-project"

### 3. Expand Chain of Thought

Click on the chain of thought panel to expand it.

### 4. Verify Thought Steps

You should see:
- ✅ "Fetching wind data from NREL Wind Toolkit API" step
- ✅ "Processing wind data with Weibull distribution fitting" step
- ✅ "Sub-agent: Parameter validation" step
- ✅ "Sub-agent: Data source selection" step
- ✅ "Sub-agent: Data quality assessment" step (if available)

### 5. Check Details

Each step should show:
- ✅ Clear action description
- ✅ Reasoning for the action
- ✅ Result with specific details
- ✅ Duration in milliseconds
- ✅ Status (complete/error)

## Troubleshooting

### No Thought Steps Visible

**Problem**: Chain of thought panel is empty

**Solution**:
1. Check browser console for errors
2. Verify orchestrator is returning `thoughtSteps` array
3. Check that frontend is rendering the chain of thought component

### Missing NREL Steps

**Problem**: NREL-specific steps not showing

**Solution**:
1. Verify query is for wind data operation (terrain, simulation, wind rose)
2. Check orchestrator logs for NREL step creation
3. Ensure tool Lambda is returning wind data in response

### Sub-Agent Steps Not Showing

**Problem**: Sub-agent reasoning steps missing

**Solution**:
1. Verify tool Lambda completed successfully
2. Check that response includes wind data details
3. Ensure orchestrator is processing response correctly

## Validation Checklist

- [ ] Test runs without errors
- [ ] All 3 test cases pass
- [ ] NREL fetch step shows data source and year
- [ ] Weibull processing step shows mean wind speed
- [ ] Sub-agent parameter validation step present
- [ ] Sub-agent data source selection step present
- [ ] Sub-agent data quality assessment step present (when available)
- [ ] All steps have status, reasoning, and result
- [ ] Durations are reasonable (not 0 or negative)
- [ ] Steps are in logical order

## Next Steps

After verifying chain of thought works:

1. ✅ Task 6 complete
2. ⏭️ Task 7: Update UI to show data source transparency
3. ⏭️ Task 8: Update Plotly wind rose generator
4. ⏭️ Task 9: Test NREL integration end-to-end
5. ⏭️ Task 10: Deploy and validate

---

**Status**: Ready for testing
**Date**: 2025-01-17
