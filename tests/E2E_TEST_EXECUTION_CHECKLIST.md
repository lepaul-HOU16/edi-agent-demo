# E2E Test Execution Checklist

Use this checklist to ensure proper test execution and validation.

## Pre-Test Checklist

### Environment Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)
- [ ] Correct AWS region set (`echo $AWS_REGION` or `aws configure get region`)

### Backend Deployment
- [ ] Sandbox running (`npx ampx sandbox`)
- [ ] Orchestrator Lambda deployed
  ```bash
  aws lambda list-functions | grep renewableOrchestrator
  ```
- [ ] Tool Lambdas deployed
  ```bash
  aws lambda list-functions | grep RenewableTool
  ```
- [ ] Environment variables set
  ```bash
  aws lambda get-function-configuration \
    --function-name <orchestrator> \
    --query "Environment.Variables"
  ```

### Code Verification
- [ ] All tasks 1-18 completed (check tasks.md)
- [ ] Perimeter generation in terrain handler
- [ ] Terrain merge in layout handler
- [ ] Wake heat map generation in simulation handler
- [ ] Action button generation in orchestrator
- [ ] Financial intent patterns in classifier

## Test Execution

### Run Automated Test
- [ ] Execute test runner
  ```bash
  ./tests/run-e2e-workflow-test.sh
  ```
- [ ] Review console output
- [ ] Check test results file
  ```bash
  cat tests/e2e-workflow-test-results.json
  ```

### Expected Results
- [ ] All 52 tests pass
- [ ] Success rate: 100%
- [ ] No error messages in output
- [ ] Results file generated

## Post-Test Validation

### Automated Test Results
- [ ] Terrain: 13/13 tests pass
  - [ ] Perimeter feature present
  - [ ] Terrain features present
  - [ ] Action buttons present
- [ ] Layout: 15/15 tests pass
  - [ ] Terrain features merged
  - [ ] Turbine features present
  - [ ] Action buttons present
- [ ] Wake: 11/11 tests pass
  - [ ] Wake heat map URL present
  - [ ] Visualizations present
  - [ ] Action buttons present
- [ ] Report: 3/3 tests pass
  - [ ] Report artifact present
  - [ ] Action buttons present
- [ ] Financial: 2/2 tests pass
  - [ ] No terrain artifact
  - [ ] Report artifact present
- [ ] Dashboard: 1/1 tests pass
  - [ ] Dashboard accessible

### Manual Browser Testing

#### 1. Terrain Analysis
- [ ] Open chat interface
- [ ] Enter: "Analyze terrain for wind farm at 35.067482, -101.395466"
- [ ] Wait for response
- [ ] Verify map loads
- [ ] Verify perimeter circle visible (dashed line)
- [ ] Verify terrain features visible (buildings, roads, water)
- [ ] Verify "Optimize Turbine Layout" button (primary/blue)
- [ ] Verify "View Project Dashboard" button
- [ ] Click perimeter → popup shows "Site Perimeter" with area
- [ ] No console errors

#### 2. Layout Optimization
- [ ] Click "Optimize Turbine Layout" button
- [ ] Wait for response
- [ ] Verify map loads
- [ ] Verify terrain features still visible
- [ ] Verify turbine markers visible (blue teardrops)
- [ ] Click turbine → popup shows specs (ID, capacity, height, diameter)
- [ ] Verify "Run Wake Simulation" button (primary/blue)
- [ ] Verify "View Project Dashboard" button
- [ ] Verify "Refine Layout" button
- [ ] No console errors

#### 3. Wake Simulation
- [ ] Click "Run Wake Simulation" button
- [ ] Wait for response
- [ ] Verify wake heat map iframe loads
- [ ] Hover over heat map → values display
- [ ] Verify heat map is interactive (zoom, pan)
- [ ] Verify "Generate Report" button (primary/blue)
- [ ] Verify "Financial Analysis" button
- [ ] Verify "View Project Dashboard" button
- [ ] No console errors

#### 4. Report Generation
- [ ] Click "Generate Report" button
- [ ] Wait for response
- [ ] Verify report artifact displays
- [ ] Verify "View Dashboard" button (primary/blue)
- [ ] Verify "Export Report" button
- [ ] No console errors

#### 5. Financial Analysis
- [ ] Enter: "perform financial analysis and ROI calculation"
- [ ] Wait for response
- [ ] Verify report/financial artifact displays (NOT terrain map)
- [ ] Verify "View Dashboard" button
- [ ] No console errors

#### 6. Dashboard Access
- [ ] From any previous step, click "View Project Dashboard"
- [ ] Verify dashboard artifact displays
- [ ] Verify project summary shows
- [ ] Verify dashboard accessible from any workflow step
- [ ] No console errors

### CloudWatch Logs
- [ ] Check orchestrator logs for errors
  ```bash
  aws logs tail /aws/lambda/<orchestrator> --follow
  ```
- [ ] Check terrain tool logs
- [ ] Check layout tool logs
- [ ] Check simulation tool logs
- [ ] No ERROR level messages
- [ ] No timeout messages

### Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab
- [ ] No red error messages
- [ ] No failed network requests
- [ ] No 404 errors for S3 resources

## Troubleshooting

### If Automated Tests Fail

#### Orchestrator Not Found
- [ ] Verify sandbox is running
- [ ] Check Lambda exists: `aws lambda list-functions`
- [ ] Verify AWS region is correct

#### No Artifacts Returned
- [ ] Check CloudWatch logs for Lambda errors
- [ ] Verify tool Lambdas are deployed
- [ ] Check environment variables

#### Perimeter Missing
- [ ] Check terrain handler code
- [ ] Verify `generate_perimeter_feature()` is called
- [ ] Redeploy terrain Lambda

#### Terrain Not in Layout
- [ ] Check layout handler code
- [ ] Verify `merge_terrain_and_turbines()` is called
- [ ] Verify context includes terrain_results
- [ ] Redeploy layout Lambda

#### Wake Heat Map Missing
- [ ] Check simulation handler code
- [ ] Verify `generate_wake_heat_map()` is called
- [ ] Check S3 bucket permissions
- [ ] Verify S3 bucket name in environment variables
- [ ] Redeploy simulation Lambda

#### Action Buttons Missing
- [ ] Check orchestrator handler code
- [ ] Verify `formatArtifacts()` calls `generateActionButtons()`
- [ ] Verify `actionButtonTypes.ts` is imported
- [ ] Redeploy orchestrator Lambda

#### Financial → Terrain
- [ ] Check intent classifier code
- [ ] Verify financial patterns come BEFORE terrain patterns
- [ ] Verify exclusion patterns are applied
- [ ] Redeploy orchestrator Lambda

### If Manual Tests Fail

#### Map Not Loading
- [ ] Check browser console for errors
- [ ] Verify GeoJSON is present in artifact
- [ ] Check network tab for failed requests
- [ ] Verify Leaflet library loaded

#### Perimeter Not Visible
- [ ] Check GeoJSON features array
- [ ] Verify perimeter feature has type="perimeter"
- [ ] Check CSS styling for dashed line
- [ ] Verify Leaflet rendering logic

#### Turbines Not Visible
- [ ] Check GeoJSON features array
- [ ] Verify turbine features have type="turbine"
- [ ] Check z-index (turbines should be on top)
- [ ] Verify Leaflet marker rendering

#### Heat Map Not Loading
- [ ] Check visualizations object in artifact
- [ ] Verify wake_heat_map URL is present
- [ ] Test URL directly in browser
- [ ] Check S3 bucket CORS configuration
- [ ] Verify presigned URL not expired

#### Action Buttons Not Visible
- [ ] Check artifact.actions array
- [ ] Verify WorkflowCTAButtons component renders
- [ ] Check CSS styling
- [ ] Verify button click handlers

## Sign-Off

### Automated Tests
- [ ] All 52 tests pass
- [ ] Success rate: 100%
- [ ] Results file generated
- [ ] No errors in output

**Signed**: _________________ **Date**: _________

### Manual Browser Tests
- [ ] All 6 workflow steps tested
- [ ] All UI elements visible
- [ ] All interactions work
- [ ] No console errors

**Signed**: _________________ **Date**: _________

### CloudWatch Logs
- [ ] No ERROR messages
- [ ] No timeout messages
- [ ] All Lambdas executing successfully

**Signed**: _________________ **Date**: _________

### User Acceptance
- [ ] User tested complete workflow
- [ ] User confirmed all features work
- [ ] User approved for production

**Signed**: _________________ **Date**: _________

## Final Approval

- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] All CloudWatch logs clean
- [ ] User acceptance complete
- [ ] Ready for production deployment

**Approved By**: _________________ **Date**: _________

---

## Notes

Use this space to document any issues, workarounds, or observations:

```
[Add notes here]
```

---

**Test Version**: 1.0
**Last Updated**: January 14, 2025
**Spec**: fix-renewable-workflow-ui-issues
