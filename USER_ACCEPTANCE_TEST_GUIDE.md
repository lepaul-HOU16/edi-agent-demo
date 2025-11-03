# User Acceptance Test Guide - Renewable Workflow

## Test Date: October 27, 2025

## Prerequisites

✅ Backend validated (all 4 steps working)
✅ Sandbox running (`npx ampx sandbox`)
✅ Frontend running (`npm run dev`)

---

## TEST SCENARIO: Complete Renewable Energy Site Assessment

### Test Objective
Validate the complete renewable energy workflow from terrain analysis through report generation in the actual UI.

---

## STEP 1: Start New Project

**Action:** Open chat interface at `http://localhost:3000/chat`

**Expected:**
- Chat interface loads
- Input field is ready
- No errors in console

---

## STEP 2: Terrain Analysis

**Action:** Type and send:
```
Analyze terrain for wind farm at 35.0675, -101.3954
```

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- 🔄 Chain-of-thought steps visible (7 steps)
- ✅ Response completes in ~15-20 seconds
- 📊 Terrain analysis artifact displays:
  - Map with 173 terrain features
  - Perimeter circle visible
  - Roads, buildings, water bodies marked
  - Exclusion zones highlighted
- 🎯 Action buttons appear:
  - "Optimize Layout" (primary)
  - "View Dashboard" (secondary)
- 📝 Project name generated (e.g., "for-wind-farm-33")
- ✅ No console errors

**What to Check:**
- [ ] Map renders correctly
- [ ] Features are visible and interactive
- [ ] Action buttons are clickable
- [ ] Project name is displayed
- [ ] No "Visualization Unavailable" message

---

## STEP 3: Layout Optimization

**Action:** Click "Optimize Layout" button (or type: "optimize layout for [project-name]")

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- 🔄 Chain-of-thought steps visible
- ✅ Response completes in ~18-20 seconds
- 📊 Layout map artifact displays:
  - 9 turbine markers on map
  - Turbine properties visible on hover
  - Terrain features still visible
  - Layout metrics displayed:
    - Total Capacity: 30.6 MW
    - Optimization Score: 82%
    - Layout Efficiency: 87%
- 🎯 Action buttons appear:
  - "Simulate Wake Effects" (primary)
  - "View Dashboard" (secondary)
- ✅ No console errors

**What to Check:**
- [ ] 9 turbines are visible on map
- [ ] Turbine markers are distinct from terrain features
- [ ] Hover shows turbine details
- [ ] Metrics are displayed
- [ ] Action buttons work

---

## STEP 4: Wake Simulation

**Action:** Click "Simulate Wake Effects" button (or type: "simulate wake effects for [project-name]")

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- 🔄 Chain-of-thought steps visible
- ✅ Response completes in ~19-20 seconds
- 📊 Wake analysis artifact displays:
  - Wake heat map visualization
  - Individual turbine performance table
  - Performance metrics:
    - Annual Production: 89.4 GWh
    - Wake Losses: 12.3%
    - Array Efficiency: 87.7%
    - Capacity Factor: 33.4%
  - Recommendations section
- 🎯 Action buttons appear:
  - "Generate Wind Rose" (primary)
  - "View Dashboard" (secondary)
- ✅ No console errors

**What to Check:**
- [ ] Heat map renders correctly
- [ ] Turbine performance table is readable
- [ ] Metrics are accurate
- [ ] Recommendations are displayed
- [ ] Action buttons work

---

## STEP 5: Wind Rose Analysis

**Action:** Click "Generate Wind Rose" button (or type: "generate wind rose for [project-name]")

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- 🔄 Chain-of-thought steps visible
- ✅ Response completes in ~16-18 seconds
- 📊 Wind rose artifact displays:
  - Plotly wind rose chart (interactive)
  - 16 directional bins
  - 6 speed bins with colors
  - Wind statistics:
    - Average Speed: 8.2 m/s
    - Prevailing Direction: 225° (SW)
    - Wind Class: Class 4
  - Seasonal analysis
  - Data source note (synthetic/NREL)
- 🎯 Action buttons appear:
  - "Generate Report" (primary)
  - "View Dashboard" (secondary)
- ✅ No console errors

**What to Check:**
- [ ] Wind rose chart is interactive (hover, zoom)
- [ ] All 16 directions are visible
- [ ] Color coding is clear
- [ ] Statistics are displayed
- [ ] Data source is indicated
- [ ] Action buttons work

---

## STEP 6: Report Generation

**Action:** Click "Generate Report" button (or type: "generate comprehensive report for [project-name]")

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- 🔄 Chain-of-thought steps visible
- ✅ Response completes in ~20 seconds
- 📊 Comprehensive report artifact displays:
  - Executive Summary
  - Overall Recommendation: "PROCEED"
  - Key Findings:
    - Wind Resource: Class 4
    - Layout: 9 turbines, 30.6 MW
    - Wake Losses: 12.3%
    - Annual Production: 89.4 GWh
  - All previous analyses included
  - Site coordinates and date
- 🎯 Action buttons appear:
  - "View Dashboard" (primary)
  - "Export Report" (if available)
- ✅ No console errors

**What to Check:**
- [ ] Report is comprehensive and readable
- [ ] All sections are present
- [ ] Recommendation is clear
- [ ] Metrics match previous steps
- [ ] Action buttons work

---

## STEP 7: Project Dashboard

**Action:** Click "View Dashboard" button (or type: "show project dashboard for [project-name]")

**Expected Results:**
- ⏳ "Analyzing" indicator appears
- ✅ Response completes quickly (~5 seconds)
- 📊 Project dashboard artifact displays:
  - Project name and status
  - Completed analyses checklist:
    - ✅ Terrain Analysis
    - ✅ Layout Optimization
    - ✅ Wake Simulation
    - ✅ Wind Rose Analysis
    - ✅ Report Generation
  - Quick access to all artifacts
  - Project metrics summary
  - Timeline of analyses
- ✅ No console errors

**What to Check:**
- [ ] All 5 analyses marked as complete
- [ ] Can access previous artifacts
- [ ] Metrics are summarized correctly
- [ ] Timeline is accurate

---

## REGRESSION TESTS

### Test 1: Reload Page
**Action:** Refresh the browser
**Expected:** 
- Chat history persists
- All artifacts still render correctly
- No need to re-run analyses

### Test 2: Multiple Projects
**Action:** Start a new terrain analysis with different coordinates
**Expected:**
- New project created with different name
- Previous project data not affected
- Can switch between projects

### Test 3: Error Handling
**Action:** Type invalid query (e.g., "analyze terrain at invalid coordinates")
**Expected:**
- Graceful error message
- No crash
- Can continue with valid queries

---

## SUCCESS CRITERIA

### ✅ All Steps Complete
- [ ] Terrain analysis works
- [ ] Layout optimization works
- [ ] Wake simulation works
- [ ] Wind Rose analysis works
- [ ] Report generation works
- [ ] Project dashboard works

### ✅ Performance Acceptable
- [ ] Each step completes in < 30 seconds
- [ ] Total workflow < 2 minutes
- [ ] No timeouts or hangs

### ✅ UI Quality
- [ ] All visualizations render correctly
- [ ] No "Visualization Unavailable" messages
- [ ] Action buttons work smoothly
- [ ] No console errors
- [ ] Responsive and smooth

### ✅ Data Accuracy
- [ ] 9 turbines generated (not 60 or other wrong number)
- [ ] 173 terrain features (not synthetic count)
- [ ] Metrics match backend validation
- [ ] No data loss between steps

---

## TROUBLESHOOTING

### Issue: "Visualization Unavailable"
**Solution:** Check browser console for errors, verify artifact data structure

### Issue: Action buttons don't appear
**Solution:** Check that artifacts are generated correctly, verify button generation logic

### Issue: Loading never completes
**Solution:** Check CloudWatch logs for Lambda errors, verify environment variables

### Issue: Wrong number of features/turbines
**Solution:** Check data pipeline, verify no filtering issues

---

## REPORTING RESULTS

### If All Tests Pass ✅
Report: "User acceptance testing COMPLETE. All 5 workflow steps working correctly in UI. Ready for production."

### If Any Test Fails ❌
Report specific failure:
- Which step failed
- What was expected
- What actually happened
- Console errors (if any)
- Screenshots (if helpful)

---

## NEXT STEPS AFTER VALIDATION

### If Tests Pass:
1. Mark workflow as production-ready
2. Update documentation
3. Train users on workflow
4. Monitor production usage

### If Tests Fail:
1. Document specific issues
2. Debug and fix issues
3. Re-test after fixes
4. Repeat until all tests pass

---

**Ready to test!** Open your browser and follow the steps above. Report back with results.
