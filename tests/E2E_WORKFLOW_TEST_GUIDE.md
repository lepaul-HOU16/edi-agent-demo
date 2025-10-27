# End-to-End Renewable Workflow Test Guide

## Overview

This guide provides instructions for running and interpreting the complete end-to-end workflow test for the renewable energy features. The test validates all requirements from the fix-renewable-workflow-ui-issues spec.

## Test Coverage

The E2E test validates the complete workflow:

### 1. Terrain Analysis Step
- ✅ Perimeter feature in GeoJSON
- ✅ Perimeter is Polygon geometry
- ✅ Perimeter has radius and area properties
- ✅ Terrain features (buildings, roads, water) present
- ✅ Action buttons present
- ✅ "Optimize Turbine Layout" button (primary)
- ✅ "View Project Dashboard" button
- ✅ Title and subtitle present

### 2. Layout Optimization Step
- ✅ Terrain features merged into layout GeoJSON
- ✅ Turbine features present
- ✅ Turbines are Point geometries
- ✅ Turbines have required properties (ID, capacity, hub height, rotor diameter)
- ✅ Action buttons present
- ✅ "Run Wake Simulation" button (primary)
- ✅ "View Project Dashboard" button
- ✅ "Refine Layout" button

### 3. Wake Simulation Step
- ✅ Visualizations object present
- ✅ Wake heat map URL present and valid
- ✅ Wake analysis chart present
- ✅ Action buttons present
- ✅ "Generate Report" button (primary)
- ✅ "Financial Analysis" button
- ✅ "View Project Dashboard" button

### 4. Report Generation Step
- ✅ Report artifact generated
- ✅ Action buttons present
- ✅ "View Dashboard" button

### 5. Financial Analysis Intent Detection
- ✅ Financial query does NOT generate terrain artifact
- ✅ Financial query generates report artifact

### 6. Dashboard Accessibility
- ✅ Dashboard accessible at any workflow step

## Prerequisites

1. **AWS Credentials**: Ensure AWS credentials are configured
   ```bash
   aws configure
   # or
   export AWS_PROFILE=your-profile
   ```

2. **Deployed Backend**: All Lambda functions must be deployed
   ```bash
   npx ampx sandbox
   # Wait for "Deployed" message
   ```

3. **Node.js**: Version 18 or higher

## Running the Test

### Quick Start

```bash
# Make executable
chmod +x tests/e2e-renewable-workflow-complete.js

# Run test
node tests/e2e-renewable-workflow-complete.js
```

### With Specific AWS Region

```bash
AWS_REGION=us-east-1 node tests/e2e-renewable-workflow-complete.js
```

### With Debug Output

```bash
DEBUG=* node tests/e2e-renewable-workflow-complete.js
```

## Interpreting Results

### Success Output

```
═══════════════════════════════════════════════════════════
  End-to-End Renewable Workflow Test
═══════════════════════════════════════════════════════════

🔍 Finding orchestrator Lambda...
✅ Found: amplify-digitalassistant-renewableOrchestrator-...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  STEP 1: Terrain Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Invoking orchestrator with query: "Analyze terrain..."
✅ Terrain: Terrain artifact type: Validated
✅ Terrain: GeoJSON present: Validated
✅ Terrain: Perimeter feature present: Validated
✅ Terrain: Perimeter is Polygon: Validated
✅ Terrain: Perimeter has radius: Validated
✅ Terrain: Perimeter has area: Validated
✅ Terrain: Terrain features present: Validated
   Details: { "count": 45 }
✅ Terrain: Action buttons present: Validated
   Details: { "count": 2 }
✅ Terrain: "Optimize Layout" button present: Validated
✅ Terrain: "Optimize Layout" is primary: Validated
✅ Terrain: "View Dashboard" button present: Validated
✅ Terrain: Title present: Validated
✅ Terrain: Subtitle present: Validated

[... continues for all steps ...]

═══════════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════════

✅ Passed:   52
❌ Failed:   0
⚠️  Warnings: 0
📊 Total:    52

Success Rate: 100.0%

📄 Detailed results saved to: tests/e2e-workflow-test-results.json
```

### Failure Output

```
❌ Terrain: Perimeter feature present: Validation failed
❌ Terrain: Action buttons present: Validation failed

═══════════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════════

✅ Passed:   48
❌ Failed:   4
⚠️  Warnings: 0
📊 Total:    52

Success Rate: 92.3%

❌ FAILED TESTS:
   - Terrain: Perimeter feature present: Validation failed
   - Terrain: Action buttons present: Validation failed
   - Layout: Terrain features in layout: Validation failed
   - Wake: Wake heat map URL present: Validation failed

📄 Detailed results saved to: tests/e2e-workflow-test-results.json
```

## Test Results File

The test generates a detailed JSON results file at `tests/e2e-workflow-test-results.json`:

```json
{
  "passed": 52,
  "failed": 0,
  "warnings": 0,
  "details": [
    {
      "test": "Terrain: Terrain artifact type",
      "status": "PASS",
      "message": "Validated",
      "details": null,
      "timestamp": "2025-01-14T10:30:00.000Z"
    },
    ...
  ]
}
```

## Common Issues and Solutions

### Issue: Orchestrator Lambda Not Found

**Symptom:**
```
❌ Workflow Test: Test execution failed: Renewable orchestrator Lambda not found
```

**Solution:**
1. Verify sandbox is running: `npx ampx sandbox`
2. Check Lambda exists: `aws lambda list-functions | grep renewableOrchestrator`
3. Ensure correct AWS region: `export AWS_REGION=us-east-1`

### Issue: No Artifacts Returned

**Symptom:**
```
❌ Terrain Analysis: No artifacts returned
```

**Solution:**
1. Check CloudWatch logs for orchestrator Lambda
2. Verify tool Lambdas are deployed
3. Check environment variables are set:
   ```bash
   aws lambda get-function-configuration \
     --function-name <orchestrator-name> \
     --query "Environment.Variables"
   ```

### Issue: Perimeter Feature Missing

**Symptom:**
```
❌ Terrain: Perimeter feature present: Validation failed
```

**Solution:**
1. Verify terrain handler includes perimeter generation
2. Check `amplify/functions/renewableTools/terrain/handler.py`
3. Ensure `generate_perimeter_feature()` function is called
4. Redeploy terrain Lambda

### Issue: Terrain Features Not in Layout

**Symptom:**
```
❌ Layout: Terrain features in layout: Validation failed
```

**Solution:**
1. Verify layout handler merges terrain features
2. Check `amplify/functions/renewableTools/layout/handler.py`
3. Ensure `merge_terrain_and_turbines()` function is called
4. Verify context includes terrain_results
5. Redeploy layout Lambda

### Issue: Wake Heat Map URL Missing

**Symptom:**
```
❌ Wake: Wake heat map URL present: Validation failed
```

**Solution:**
1. Verify simulation handler generates heat map
2. Check `amplify/functions/renewableTools/simulation/handler.py`
3. Ensure `generate_wake_heat_map()` function is called
4. Verify S3 bucket permissions
5. Check S3 bucket name in environment variables
6. Redeploy simulation Lambda

### Issue: Action Buttons Missing

**Symptom:**
```
❌ Terrain: Action buttons present: Validation failed
```

**Solution:**
1. Verify orchestrator calls `generateActionButtons()`
2. Check `amplify/functions/renewableOrchestrator/handler.ts`
3. Ensure `formatArtifacts()` includes actions
4. Verify `actionButtonTypes.ts` is imported
5. Redeploy orchestrator Lambda

### Issue: Financial Query Generates Terrain

**Symptom:**
```
❌ Financial: Financial query does not generate terrain: Validation failed
```

**Solution:**
1. Verify intent classifier pattern order
2. Check `amplify/functions/renewableOrchestrator/RenewableIntentClassifier.ts`
3. Ensure financial patterns come BEFORE terrain patterns
4. Verify exclusion patterns are applied
5. Redeploy orchestrator Lambda

## Manual Browser Testing

After automated tests pass, perform manual browser testing:

### 1. Terrain Analysis
1. Open chat interface
2. Enter: "Analyze terrain for wind farm at 35.067482, -101.395466"
3. Verify:
   - Map loads with terrain features
   - Perimeter shows as dashed circle
   - Buildings, roads, water visible
   - "Optimize Turbine Layout" button present (primary)
   - "View Project Dashboard" button present

### 2. Layout Optimization
1. Click "Optimize Turbine Layout" button
2. Verify:
   - Map loads with terrain features AND turbines
   - Turbines show as blue markers
   - Click turbine shows popup with specs
   - "Run Wake Simulation" button present (primary)
   - "View Project Dashboard" button present

### 3. Wake Simulation
1. Click "Run Wake Simulation" button
2. Verify:
   - Wake heat map loads in iframe
   - Heat map is interactive (hover shows values)
   - "Generate Report" button present (primary)
   - "Financial Analysis" button present
   - "View Project Dashboard" button present

### 4. Report Generation
1. Click "Generate Report" button
2. Verify:
   - Report artifact displays
   - "View Dashboard" button present

### 5. Financial Analysis
1. Enter: "perform financial analysis and ROI calculation"
2. Verify:
   - Report/financial artifact displays (NOT terrain)
   - "View Dashboard" button present

### 6. Dashboard Access
1. Click "View Project Dashboard" at any step
2. Verify:
   - Dashboard artifact displays
   - Shows project summary

## Success Criteria

The test is considered successful when:

- ✅ All automated tests pass (100% success rate)
- ✅ Manual browser tests confirm UI rendering
- ✅ No console errors in browser
- ✅ No CloudWatch errors in Lambda logs
- ✅ User can complete full workflow without issues

## Troubleshooting Checklist

Before running the test, verify:

- [ ] Sandbox is running (`npx ampx sandbox`)
- [ ] All Lambdas are deployed (check CloudWatch logs)
- [ ] Environment variables are set (check Lambda configuration)
- [ ] S3 bucket exists and has correct permissions
- [ ] AWS credentials are valid
- [ ] Correct AWS region is configured

## Next Steps

After E2E test passes:

1. **User Acceptance Testing**: Have actual users test the workflow
2. **Performance Testing**: Measure response times for each step
3. **Load Testing**: Test with multiple concurrent users
4. **Edge Case Testing**: Test with invalid inputs, missing data, etc.
5. **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge

## Related Documentation

- [Requirements](../.kiro/specs/fix-renewable-workflow-ui-issues/requirements.md)
- [Design](../.kiro/specs/fix-renewable-workflow-ui-issues/design.md)
- [Tasks](../.kiro/specs/fix-renewable-workflow-ui-issues/tasks.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

## Support

If tests fail and you cannot resolve the issue:

1. Check CloudWatch logs for all Lambdas
2. Review recent code changes
3. Verify deployment completed successfully
4. Check environment variables
5. Review this guide's troubleshooting section
6. Contact the development team with:
   - Test output
   - CloudWatch logs
   - Environment configuration
   - Steps to reproduce
