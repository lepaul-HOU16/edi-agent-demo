# Manual Test Guide: Wake Simulation UI Clean Test

## Overview

This guide provides step-by-step instructions for manually testing that wake simulation responses display only Cloudscape Container without redundant status text.

## Prerequisites

Before testing wake simulation, you must complete the full renewable energy workflow:

1. ✅ Terrain Analysis
2. ✅ Wind Rose Analysis  
3. ✅ Layout Optimization
4. ⚡ Wake Simulation (this test)

## Test Environment

- **Browser**: Chrome, Firefox, or Safari (latest version)
- **Application**: Chat interface with renewable energy features
- **DevTools**: Open browser DevTools (F12) for inspection

## Test Steps

### Step 1: Complete Prerequisites

Start a new renewable energy project and complete the first three steps:

```
1. Open chat interface
2. Type: "analyze terrain at 35.067482, -101.395466"
3. Wait for terrain analysis to complete
4. Click "Analyze Wind Patterns" button
5. Wait for wind rose analysis to complete
6. Click "Optimize Layout" button
7. Wait for layout optimization to complete
```

**Verify**: Each step completes successfully and shows only Cloudscape Container (no status text).

### Step 2: Request Wake Simulation

After layout optimization completes, request wake simulation:

**Option A - Click Button:**
```
Click the "Simulate Wake Effects" button in WorkflowCTAButtons
```

**Option B - Type Query:**
```
Type: "run wake simulation"
OR
Type: "simulate wake effects"
```

### Step 3: Verify Clean UI

Immediately after the response appears, verify:

#### ✅ What You SHOULD See:

1. **Cloudscape Container only** - No text before the container
2. **Container Header** - "Wake Simulation Results" or similar
3. **Visualization** - Wake simulation chart/visualization
4. **WorkflowCTAButtons** - With "Generate Report" button enabled
5. **Project Metadata** - Project ID in footer
6. **Clean Layout** - Professional, consistent with other artifacts

#### ❌ What You SHOULD NOT See:

1. ❌ Text like "Wake simulation complete"
2. ❌ Text like "Project: [project-id]"
3. ❌ Text like "Project Status: ✓✓✓○○"
4. ❌ Text like "Next: Generate comprehensive report"
5. ❌ Any text before the Cloudscape Container

### Step 4: Inspect Browser DevTools

Open DevTools (F12) and check:

#### Console Tab:
```
✅ No error messages
✅ No warnings about missing data
✅ No artifact rendering errors
```

#### Network Tab:
```
1. Find the API request (chat or invoke)
2. Click on the request
3. Go to "Response" tab
4. Verify:
   ✅ Response has "artifacts" array
   ✅ Response "message" is empty or very short
   ✅ Artifact type is "wind_farm_wake_simulation"
   ✅ Artifact has required data fields
```

#### Elements Tab:
```
1. Find the wake simulation artifact in DOM
2. Verify:
   ✅ No text nodes before artifact component
   ✅ Cloudscape Container is first element
   ✅ All components render correctly
```

### Step 5: Verify Data Completeness

Check that the wake simulation artifact contains all expected data:

#### Required Elements:
- [ ] Wake simulation visualization/chart
- [ ] Energy production metrics
- [ ] Wake loss percentages
- [ ] Turbine-specific data
- [ ] Comparison with no-wake scenario
- [ ] Performance metrics

#### Interactive Features:
- [ ] Can view different turbines
- [ ] Can see wake effects visualization
- [ ] Can access detailed metrics
- [ ] WorkflowCTAButtons respond correctly

### Step 6: Test Workflow Continuation

After wake simulation completes:

```
1. Click "Generate Report" button
2. Verify report generation starts
3. Verify wake simulation data included in report
```

## Expected Results

### Orchestrator Response Format

The orchestrator should return:

```json
{
  "message": "",
  "artifacts": [
    {
      "type": "wind_farm_wake_simulation",
      "messageContentType": "wind_farm_wake_simulation",
      "data": {
        "projectId": "test-project-123",
        "title": "Wake Simulation Results",
        "subtitle": "Energy production with wake effects",
        "visualization": { ... },
        "metrics": { ... }
      }
    }
  ]
}
```

**Key Points:**
- `message` is empty string
- `artifacts` array has one wake simulation artifact
- Artifact has all required data fields

### Frontend Rendering

The ChatMessage component should:

1. Receive empty message → render nothing for message
2. Receive artifact → render SimulationChartArtifact component
3. Result: Only Cloudscape Container visible

## Troubleshooting

### Issue: Status text still appears

**Symptoms:**
- Text like "Wake simulation complete" appears before Container
- Redundant project status information visible

**Possible Causes:**
1. Orchestrator not deployed with latest changes
2. Message field not empty in response
3. Frontend caching old response

**Solutions:**
```bash
# 1. Verify orchestrator deployment
aws lambda get-function --function-name <orchestrator-name> \
  --query 'Configuration.LastModified'

# 2. Check CloudWatch logs
aws logs tail /aws/lambda/<orchestrator-name> --since 5m

# 3. Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear cache in DevTools → Network tab → "Disable cache"

# 4. Check actual API response in Network tab
```

### Issue: Artifact not rendering

**Symptoms:**
- No visualization appears
- Empty space where artifact should be
- Console errors about missing component

**Possible Causes:**
1. Artifact structure incorrect
2. Missing required data fields
3. SimulationChartArtifact component not registered

**Solutions:**
```javascript
// 1. Check artifact structure in Network tab
// Should have: type, messageContentType, data

// 2. Verify component registration
// Check: src/components/EnhancedArtifactProcessor.tsx
// Should include: SimulationChartArtifact

// 3. Check console for specific errors
// Look for: "Unknown artifact type" or "Missing required field"
```

### Issue: Prerequisites not completing

**Symptoms:**
- Terrain/wind rose/layout fails
- Cannot reach wake simulation step
- Error messages in workflow

**Possible Causes:**
1. Tool Lambdas not deployed
2. Environment variables missing
3. IAM permissions issues

**Solutions:**
```bash
# 1. Verify all tool Lambdas exist
aws lambda list-functions | grep -i renewable

# 2. Check orchestrator environment variables
aws lambda get-function-configuration \
  --function-name <orchestrator-name> \
  --query 'Environment.Variables'

# 3. Review CloudWatch logs for errors
aws logs tail /aws/lambda/<orchestrator-name> --since 10m

# 4. Test each step individually
node tests/test-clean-terrain-ui.js
node tests/test-clean-windrose-ui.js
node tests/test-clean-layout-ui.js
```

## Success Criteria

The test is successful when:

- [x] No status text appears before Cloudscape Container
- [x] Cloudscape Container renders immediately
- [x] Wake simulation visualization displays correctly
- [x] WorkflowCTAButtons show correct state
- [x] "Generate Report" button is enabled
- [x] No console errors
- [x] API response has empty message
- [x] API response has proper artifact structure
- [x] All data fields present and correct
- [x] Workflow can continue to report generation

## Test Completion

After completing all checks:

1. Document results in test summary
2. Take screenshots of successful rendering
3. Save Network tab response for reference
4. Mark task as complete if all checks pass

## Related Tests

- Task 3: Test terrain analysis UI
- Task 4: Test wind rose UI
- Task 5: Test layout optimization UI
- Task 7: Test report generation UI (next)

## Notes

- Wake simulation requires completing all previous steps
- Test with different project IDs to verify consistency
- Verify workflow state updates correctly
- Check that report generation includes wake data
- Test error handling if wake simulation fails

## Contact

If issues persist after troubleshooting:
1. Check CloudWatch logs for detailed errors
2. Verify all Lambda functions deployed
3. Review orchestrator code for message generation
4. Test with automated script: `node tests/test-clean-wake-simulation-ui.js`
