# Deployment Checklist - Renewable Energy Fixes

## Pre-Deployment

- [x] Wake simulation orchestrator case added
- [x] Wake simulation frontend rendering added
- [x] Layout footer duplicate removed
- [x] Report generation enhanced
- [x] Debug logging added
- [x] All diagnostics passing
- [x] Documentation created

## Deployment Steps

### 1. Commit Changes

```bash
git status
git add amplify/functions/renewableOrchestrator/handler.ts
git add src/components/ChatMessage.tsx
git add src/components/renewable/LayoutMapArtifact.tsx
git add src/components/renewable/WindRoseArtifact.tsx
git add FIXES_APPLIED.md
git add DEPLOYMENT_CHECKLIST.md
git add tests/test-all-renewable-fixes.sh
git commit -m "fix: Add wake simulation support, remove layout duplicate, enhance report generation

- Add wake_simulation case to orchestrator formatArtifacts
- Add wake_simulation rendering in ChatMessage
- Remove duplicate turbine positions in LayoutMapArtifact
- Enhance report_generation with better logging
- Add debug logging for wind rose data flow
- Create comprehensive testing documentation"
```

### 2. Deploy to Sandbox

```bash
# Stop current sandbox if running
# Press Ctrl+C

# Start new sandbox
npx ampx sandbox

# Wait for deployment (5-10 minutes)
# Look for: "✅ Deployed"
```

### 3. Verify Deployment

```bash
# Check orchestrator function exists
aws lambda list-functions | grep -i orchestrator

# Get orchestrator function name
ORCHESTRATOR=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" --output text)

# Verify environment variables
aws lambda get-function-configuration \
  --function-name "$ORCHESTRATOR" \
  --query "Environment.Variables" \
  --output json

# Should see:
# - RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME
# - RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME
# - RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME
# - RENEWABLE_REPORT_TOOL_FUNCTION_NAME
# - RENEWABLE_S3_BUCKET
```

### 4. Test Each Feature

#### Test 1: Terrain Analysis
```
Query: "analyze terrain at 35.067482, -101.395466"

Expected:
✅ TerrainMapArtifact renders
✅ Interactive map shows
✅ Metrics display
✅ Action button: "Optimize Turbine Layout"

Check:
- Browser console for errors
- Map loads without issues
- Stats are accurate
```

#### Test 2: Layout Optimization
```
Query: "optimize layout for test-project"

Expected:
✅ LayoutMapArtifact renders
✅ Turbine positions show ONCE (not twice) ← FIXED
✅ Map shows turbines
✅ Action button: "Run Wake Simulation"

Check:
- No duplicate stats in footer
- Map renders correctly
- Turbine count matches
```

#### Test 3: Wake Simulation ← NEW FIX
```
Query: "run wake simulation for test-project"

Expected:
✅ SimulationChartArtifact renders ← FIXED
✅ Performance metrics display
✅ Visualizations load
✅ Action button: "Generate Report"

Check:
- Console log: "🌊 Orchestrator wake_simulation mapping"
- Console log: "🎉 Rendering SimulationChartArtifact for wake simulation"
- No errors in Lambda logs
```

#### Test 4: Wind Rose
```
Query: "show me a wind rose for 35.067482, -101.395466"

Expected:
✅ WindRoseArtifact renders
✅ Interactive Plotly chart (NOT PNG)
✅ Dark background
✅ Hover tooltips work

Check:
- Console log: "🌹 Orchestrator wind_rose_analysis mapping"
- Console log: "hasPlotlyWindRose: true"
- Plotly chart renders (not fallback PNG)
```

#### Test 5: Report Generation
```
Query: "generate report for test-project"

Expected:
✅ ReportArtifact renders (NOT layout) ← ENHANCED
✅ Executive summary shows
✅ Recommendations display
✅ Action button: "Start New Project"

Check:
- Console log: "📄 Orchestrator report_generation mapping"
- Report content displays
- Not showing layout instead
```

### 5. Verify Action Buttons

For each test above:
```
✅ Action buttons appear below artifact
✅ Buttons are contextual to workflow step
✅ Clicking button sends correct query
✅ Button icons display correctly
```

### 6. Check Lambda Logs

```bash
# Tail orchestrator logs
aws logs tail /aws/lambda/$ORCHESTRATOR --follow

# Look for:
✅ "🌊 Orchestrator wake_simulation mapping"
✅ "🌹 Orchestrator wind_rose_analysis mapping"
✅ "📄 Orchestrator report_generation mapping"
✅ "✅ Artifact validated and added"
❌ No error messages
```

### 7. Performance Check

```
✅ Queries respond within 10 seconds
✅ Artifacts load within 5 seconds
✅ Maps render smoothly
✅ No memory issues
✅ No timeout errors
```

## Post-Deployment Validation

### Success Criteria

- [ ] All 5 test queries work end-to-end
- [ ] Wake simulation renders correctly (was broken)
- [ ] Layout shows stats once (not twice)
- [ ] Wind rose shows Plotly chart (not PNG)
- [ ] Report generation works (not showing layout)
- [ ] Action buttons appear on all artifacts
- [ ] No console errors
- [ ] No Lambda errors
- [ ] Performance is acceptable

### If Issues Found

1. **Check browser console** for JavaScript errors
2. **Check Lambda logs** for backend errors
3. **Verify environment variables** are set
4. **Check artifact data** in Network tab
5. **Review debug logs** for data flow
6. **Test with different coordinates** if location-specific
7. **Clear browser cache** if stale data

### Rollback Plan

If critical issues:

```bash
# Revert changes
git revert HEAD

# Redeploy
npx ampx sandbox

# Verify old version works
# Test basic queries
```

## Documentation

Created:
- ✅ `FIXES_APPLIED.md` - Detailed fix documentation
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file
- ✅ `CURRENT_ISSUES_SUMMARY.md` - Issue analysis
- ✅ `WINDROSE_VALIDATION_GUIDE.md` - Wind rose testing
- ✅ `tests/test-all-renewable-fixes.sh` - Test script

## Next Steps After Validation

1. **If all tests pass:**
   - Mark deployment as successful
   - Update project status
   - Plan next features (dashboards, etc.)

2. **If issues found:**
   - Document specific failures
   - Check logs for root cause
   - Apply targeted fixes
   - Redeploy and retest

3. **Future enhancements:**
   - Add dashboard integration
   - Optimize performance
   - Add more visualizations
   - Enhance error handling

## Support

If you encounter issues:

1. Run test script: `bash tests/test-all-renewable-fixes.sh`
2. Check `FIXES_APPLIED.md` for details
3. Review `CURRENT_ISSUES_SUMMARY.md` for context
4. Share specific error messages and logs

---

**Status: READY FOR DEPLOYMENT** ✅

Deploy with: `npx ampx sandbox`
Test with: `bash tests/test-all-renewable-fixes.sh`
