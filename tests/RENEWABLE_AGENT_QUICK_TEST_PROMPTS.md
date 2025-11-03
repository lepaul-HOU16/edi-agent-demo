# Renewable Agent Quick Test Prompts

## Quick Start - Copy & Paste These Prompts

Use these prompts in sequence to test the renewable energy agent workflow. Just copy and paste into the chat interface.

---

## 🎯 Basic Workflow Test (5 minutes)

### Test 1: Terrain Analysis
```
Analyze terrain at 35.067482, -101.395466
```
**Look for:**
- ✅ Interactive map with terrain features
- ✅ Wind resource statistics
- ✅ Project name auto-generated
- ✅ Action buttons appear

---

### Test 2: Layout Optimization
```
Optimize turbine layout
```
**Look for:**
- ✅ Turbine positions on map
- ✅ Capacity and turbine count
- ✅ Uses coordinates from previous step
- ✅ Action buttons for next steps

---

### Test 3: Wind Rose
```
Generate wind rose
```
**Look for:**
- ✅ Interactive Plotly wind rose chart
- ✅ 16 directional bins
- ✅ Color-coded speed ranges
- ✅ Zoom/pan works

---

### Test 4: Wake Simulation
```
Run wake simulation
```
**Look for:**
- ✅ Wake heat map visualization
- ✅ Performance metrics (AEP, capacity factor)
- ✅ Wake loss analysis
- ✅ Uses layout from previous step

---

### Test 5: Report Generation
```
Generate comprehensive report
```
**Look for:**
- ✅ Complete HTML report
- ✅ All visualizations included
- ✅ Executive summary
- ✅ Downloadable

---

## 🔄 Project Persistence Test (3 minutes)

### Test 6: Named Project
```
Analyze terrain at 36.0, -102.0 for project Highland Wind
```
**Look for:**
- ✅ Project name: "highland-wind"
- ✅ Terrain analysis completes

---

### Test 7: Resume Project
```
Continue with project Highland Wind
```
**Look for:**
- ✅ Previous terrain data loaded
- ✅ Can proceed with layout

---

### Test 8: List Projects
```
List my renewable energy projects
```
**Look for:**
- ✅ Table showing all projects
- ✅ Status indicators for each analysis
- ✅ Key metrics displayed

---

## 🎨 Dashboard Test (2 minutes)

### Test 9: Wind Resource Dashboard
```
Show wind resource dashboard
```
**Look for:**
- ✅ Large wind rose (60% of space)
- ✅ Supporting charts (40%)
- ✅ Seasonal patterns
- ✅ Wind speed distribution

---

### Test 10: Performance Dashboard
```
Show performance dashboard
```
**Look for:**
- ✅ 2x2 grid layout
- ✅ Monthly energy production
- ✅ Capacity factor distribution
- ✅ Turbine performance heatmap

---

## ⚠️ Error Handling Test (2 minutes)

### Test 11: Missing Context
```
Run wake simulation
```
(In a fresh session without prior layout)

**Look for:**
- ✅ Clear error message
- ✅ Helpful suggestion
- ✅ No crash or generic error

---

### Test 12: Invalid Coordinates
```
Analyze terrain at 999, 999
```
**Look for:**
- ✅ Validation error
- ✅ Clear message about invalid coordinates
- ✅ Valid range shown

---

## 🚀 Advanced Features Test (5 minutes)

### Test 13: Explicit Parameters
```
Analyze terrain at 35.067482, -101.395466 with 10km radius
```
**Look for:**
- ✅ Larger analysis area
- ✅ Radius reflected in results

---

### Test 14: Turbine Count
```
Optimize layout with 50 turbines at 35.067482, -101.395466
```
**Look for:**
- ✅ Exactly 50 turbines placed
- ✅ Respects parameter

---

### Test 15: Wind Speed Parameter
```
Run wake simulation with 8 m/s wind speed
```
**Look for:**
- ✅ Uses specified wind speed
- ✅ Reflected in results

---

## 📊 Complete End-to-End Test (10 minutes)

Run this complete workflow in one session:

```
1. Analyze terrain at 35.067482, -101.395466 for project West Texas Wind
2. Optimize layout with 40 turbines
3. Generate wind rose
4. Run wake simulation with 7.5 m/s wind speed
5. Show wind resource dashboard
6. Show performance dashboard
7. Generate comprehensive report
8. List my renewable energy projects
```

**Success Criteria:**
- ✅ All 8 steps complete without errors
- ✅ Each artifact renders correctly
- ✅ Project data persists throughout
- ✅ Final report includes all analyses
- ✅ Project appears in listing

---

## 🎯 One-Liner Smoke Test

Fastest way to verify basic functionality:

```
Analyze terrain at 35.067482, -101.395466, then optimize layout, generate wind rose, run wake simulation, and create a report
```

**Look for:**
- ✅ All 5 analyses complete in sequence
- ✅ All artifacts display
- ✅ No errors

---

## 📝 Testing Checklist

Before you start:
- [ ] Sandbox is running
- [ ] Browser console is open (F12)
- [ ] Ready to check for errors

During testing:
- [ ] Each prompt returns a response
- [ ] Artifacts render (no "Visualization Unavailable")
- [ ] No infinite loading states
- [ ] No page reloads required
- [ ] Action buttons work when clicked

After testing:
- [ ] No errors in browser console
- [ ] No errors in CloudWatch logs
- [ ] All visualizations displayed correctly
- [ ] Project data persisted

---

## 🐛 Common Issues to Watch For

### Issue 1: Blank Visualizations
**Symptom:** "Visualization Unavailable" message
**Check:** CloudWatch logs for Lambda errors

### Issue 2: Wrong Feature Count
**Symptom:** Map shows 60 features instead of 151
**Check:** Data pipeline and filtering logic

### Issue 3: Missing Context
**Symptom:** "Cannot optimize layout" without coordinates
**Check:** Session context and project data loading

### Issue 4: Stuck Loading
**Symptom:** Spinner never stops
**Check:** Lambda timeout or error in backend

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ All prompts return responses within 10 seconds
- ✅ All visualizations render correctly
- ✅ No error messages appear
- ✅ Action buttons guide you through workflow
- ✅ Project data persists across steps
- ✅ Browser console is clean (no errors)

---

## 🔗 Related Documentation

- Full test suite: `tests/RENEWABLE_E2E_TEST_PROMPTS.md`
- Testing guide: `tests/RENEWABLE_QUICK_TEST_GUIDE.md`
- Test cheat sheet: `tests/RENEWABLE_TEST_CHEAT_SHEET.md`

---

**Last Updated:** January 2025  
**Status:** Ready to Use  
**Time Required:** 15-30 minutes for complete testing
