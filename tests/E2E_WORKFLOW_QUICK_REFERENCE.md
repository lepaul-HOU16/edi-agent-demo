# E2E Workflow Test - Quick Reference

## Run the Test

```bash
# Quick run
./tests/run-e2e-workflow-test.sh

# Or directly
node tests/e2e-renewable-workflow-complete.js
```

## What Gets Tested

### ✅ Terrain Analysis (Step 1)
- Perimeter feature with dashed circle
- Terrain features (buildings, roads, water)
- Action buttons: "Optimize Layout" (primary), "View Dashboard"

### ✅ Layout Optimization (Step 2)
- Terrain features merged into layout
- Turbine markers with properties
- Action buttons: "Run Wake Simulation" (primary), "View Dashboard", "Refine Layout"

### ✅ Wake Simulation (Step 3)
- Wake heat map URL (S3)
- Wake analysis charts
- Action buttons: "Generate Report" (primary), "Financial Analysis", "View Dashboard"

### ✅ Report Generation (Step 4)
- Report artifact
- Action buttons: "View Dashboard", "Export Report"

### ✅ Financial Analysis (Step 5)
- Financial query generates report (NOT terrain)
- Correct intent detection

### ✅ Dashboard (Step 6)
- Accessible at any workflow step

## Expected Output

```
✅ Passed:   52
❌ Failed:   0
Success Rate: 100.0%
```

## If Tests Fail

### Missing Perimeter
```bash
# Check terrain handler
aws lambda get-function --function-name <terrain-lambda>
# Redeploy if needed
npx ampx sandbox
```

### Missing Terrain in Layout
```bash
# Check layout handler
aws lambda get-function --function-name <layout-lambda>
# Verify context flow
```

### Missing Wake Heat Map
```bash
# Check simulation handler and S3
aws s3 ls s3://<bucket>/projects/
# Check S3 permissions
```

### Missing Action Buttons
```bash
# Check orchestrator
aws lambda get-function --function-name <orchestrator-lambda>
# Verify formatArtifacts calls generateActionButtons
```

## Manual Browser Test

After automated tests pass:

1. **Terrain**: Enter "Analyze terrain at 35.067482, -101.395466"
   - See perimeter circle
   - See terrain features
   - See action buttons

2. **Layout**: Click "Optimize Turbine Layout"
   - See terrain + turbines
   - Click turbine for popup
   - See action buttons

3. **Wake**: Click "Run Wake Simulation"
   - See heat map iframe
   - Hover for values
   - See action buttons

4. **Report**: Click "Generate Report"
   - See report
   - See action buttons

5. **Financial**: Enter "perform financial analysis"
   - See report (NOT terrain)
   - See action buttons

6. **Dashboard**: Click "View Dashboard" at any step
   - See dashboard
   - Works from any step

## Success Criteria

- ✅ All automated tests pass
- ✅ Manual browser tests work
- ✅ No console errors
- ✅ No CloudWatch errors
- ✅ User can complete workflow

## Quick Troubleshooting

```bash
# Check Lambda deployment
aws lambda list-functions | grep Renewable

# Check environment variables
aws lambda get-function-configuration \
  --function-name <orchestrator> \
  --query "Environment.Variables"

# Check CloudWatch logs
aws logs tail /aws/lambda/<function-name> --follow

# Redeploy everything
npx ampx sandbox
```

## Files

- **Test Script**: `tests/e2e-renewable-workflow-complete.js`
- **Runner**: `tests/run-e2e-workflow-test.sh`
- **Guide**: `tests/E2E_WORKFLOW_TEST_GUIDE.md`
- **Results**: `tests/e2e-workflow-test-results.json` (generated)

## Related Specs

- Requirements: `.kiro/specs/fix-renewable-workflow-ui-issues/requirements.md`
- Design: `.kiro/specs/fix-renewable-workflow-ui-issues/design.md`
- Tasks: `.kiro/specs/fix-renewable-workflow-ui-issues/tasks.md`
