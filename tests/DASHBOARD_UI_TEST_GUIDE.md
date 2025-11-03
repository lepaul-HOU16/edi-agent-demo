# Renewable Energy Dashboard UI Testing Guide

## Purpose

This guide helps you manually test the renewable energy dashboards in the UI to ensure:
- Docker Lambda (simulation) works correctly
- All dashboards render properly
- Action buttons function correctly
- Project persistence works
- Chain of thought displays correctly

---

## Pre-Test Setup

### 1. Start the Application

```bash
# Terminal 1: Start sandbox (if not already running)
npx ampx sandbox

# Terminal 2: Start Next.js dev server
npm run dev
```

### 2. Open Browser

Navigate to: `http://localhost:3000`

### 3. Sign In

Use your test credentials to access the chat interface.

---

## Test Workflow

### Phase 1: Complete Workflow (15 minutes)

This tests the entire renewable energy workflow from start to finish.

#### Step 1: Terrain Analysis

**Prompt:**
```
Analyze terrain at 35.067482, -101.395466 for project Dashboard Test
```

**Expected Results:**
- ✅ Loading state shows with "Analyzing terrain..." message
- ✅ Chain of thought steps display in Cloudscape ExpandableSection
- ✅ Response includes terrain analysis artifact
- ✅ Map renders with 151 features (check feature count in UI)
- ✅ Wind statistics displayed
- ✅ Suitability score shown
- ✅ Project name "dashboard-test" displayed
- ✅ Action buttons appear:
  - "Optimize Layout" (primary button)
  - "Generate Wind Rose" (secondary button)

**Visual Checks:**
- [ ] Map is interactive (can zoom/pan)
- [ ] Features are visible on map
- [ ] No "Visualization Unavailable" error
- [ ] Loading state dismisses properly
- [ ] No console errors (F12 → Console tab)

**Screenshot:** Take a screenshot of the terrain analysis result

---

#### Step 2: Layout Optimization

**Prompt:**
```
Optimize turbine layout
```

**Expected Results:**
- ✅ Auto-loads coordinates from terrain analysis
- ✅ Loading state shows
- ✅ Chain of thought displays
- ✅ Layout optimization artifact renders
- ✅ Turbines displayed on map
- ✅ Capacity shown (e.g., "150 MW")
- ✅ Turbine count shown (e.g., "50 turbines")
- ✅ Action buttons appear:
  - "Run Wake Simulation" (primary)
  - "Generate Wind Rose" (secondary)
  - "Generate Report" (secondary)

**Visual Checks:**
- [ ] Turbine markers visible on map
- [ ] Map shows turbine positions clearly
- [ ] Capacity and count are reasonable numbers
- [ ] No blank map
- [ ] Action buttons are clickable

**Screenshot:** Take a screenshot of the layout result

---

#### Step 3: Wind Rose Generation

**Prompt:**
```
Generate wind rose
```

**Expected Results:**
- ✅ Loading state shows
- ✅ Wind rose artifact renders
- ✅ Plotly interactive chart displays
- ✅ 16 directional bins visible
- ✅ Speed ranges color-coded
- ✅ Frequency percentages shown
- ✅ Chart is interactive (hover shows data)
- ✅ Export options available (camera icon)

**Visual Checks:**
- [ ] Chart renders completely (no blank areas)
- [ ] Colors are distinct and visible
- [ ] Hover tooltips work
- [ ] Zoom/pan controls work
- [ ] Export button works (try downloading PNG)

**Screenshot:** Take a screenshot of the wind rose

---

#### Step 4: Wake Simulation (Docker Lambda Test)

**Prompt:**
```
Run wake simulation
```

**Expected Results:**
- ✅ Loading state shows (may take 5-10 seconds)
- ✅ Chain of thought shows "Calling simulation tool"
- ✅ Wake simulation artifact renders
- ✅ Heat map visualization displays
- ✅ Performance metrics shown:
  - AEP (Annual Energy Production) in GWh
  - Capacity factor as percentage
  - Wake losses as percentage
- ✅ Action button: "Generate Report"

**Visual Checks:**
- [ ] Heat map renders (not blank)
- [ ] Colors show wake effects
- [ ] Metrics are reasonable numbers
- [ ] No timeout errors
- [ ] No "Visualization Unavailable"

**Critical Check:**
- [ ] **Docker Lambda worked** - If you see wake simulation results, the Docker Lambda is functioning correctly!

**Screenshot:** Take a screenshot of the wake simulation result

---

### Phase 2: Dashboard Testing (10 minutes)

Now test the three consolidated dashboards.

#### Dashboard 1: Wind Resource Dashboard

**Prompt:**
```
Show wind resource dashboard
```

**Expected Results:**
- ✅ Dashboard artifact renders
- ✅ Layout: 60% wind rose, 40% supporting charts
- ✅ Wind rose is interactive
- ✅ Supporting charts display:
  - Seasonal patterns
  - Wind speed distribution
  - Monthly averages
  - Variability analysis
- ✅ All charts are Plotly interactive

**Visual Checks:**
- [ ] Layout is 60/40 split
- [ ] Wind rose is prominent
- [ ] Supporting charts are clear
- [ ] All charts interactive
- [ ] Export options work

**Screenshot:** Take a screenshot of the wind resource dashboard

---

#### Dashboard 2: Performance Analysis Dashboard

**Prompt:**
```
Show performance dashboard
```

**Expected Results:**
- ✅ Dashboard artifact renders
- ✅ Layout: 2x2 grid with summary bar
- ✅ Charts display:
  - Monthly energy production
  - Capacity factor distribution
  - Turbine performance heatmap
  - Availability and losses
- ✅ Summary bar shows key metrics
- ✅ All charts interactive

**Visual Checks:**
- [ ] 2x2 grid layout clear
- [ ] Summary bar at top
- [ ] Charts are distinct
- [ ] Heatmap shows color gradients
- [ ] Hover tooltips work

**Screenshot:** Take a screenshot of the performance dashboard

---

#### Dashboard 3: Wake Analysis Dashboard

**Prompt:**
```
Show wake analysis dashboard
```

**Expected Results:**
- ✅ Dashboard artifact renders
- ✅ Layout: 50% map, 50% charts (2x2 grid)
- ✅ Wake heat map displays (Folium)
- ✅ Charts display:
  - Wake deficit profile
  - Turbine interaction matrix
  - Wake loss by direction
- ✅ Map is interactive
- ✅ Charts are interactive

**Visual Checks:**
- [ ] 50/50 split layout
- [ ] Map shows wake effects
- [ ] Charts complement map
- [ ] All interactive
- [ ] Color schemes consistent

**Screenshot:** Take a screenshot of the wake analysis dashboard

---

### Phase 3: Project Persistence Testing (5 minutes)

Test that project data persists across sessions.

#### Test 1: Project Listing

**Prompt:**
```
List my renewable energy projects
```

**Expected Results:**
- ✅ Table of projects displays
- ✅ "Dashboard Test" project listed
- ✅ Status indicators show:
  - ✓ Terrain Analysis
  - ✓ Layout Optimization
  - ✓ Wind Rose
  - ✓ Wake Simulation
- ✅ Key metrics shown (turbines, capacity, AEP)
- ✅ Timestamps displayed

**Visual Checks:**
- [ ] Table is formatted clearly
- [ ] Status checkmarks visible
- [ ] Metrics are accurate
- [ ] Active project marked

**Screenshot:** Take a screenshot of the project list

---

#### Test 2: Project Details

**Prompt:**
```
Show project Dashboard Test
```

**Expected Results:**
- ✅ Complete project information displays
- ✅ All analysis results shown
- ✅ Metrics and statistics accurate
- ✅ Status checklist complete

**Visual Checks:**
- [ ] All data present
- [ ] No missing information
- [ ] Formatting clear

---

#### Test 3: Session Persistence

1. **Refresh the page** (F5 or Cmd+R)
2. **Navigate back to chat**
3. **Send prompt:**
   ```
   Continue with project Dashboard Test
   ```

**Expected Results:**
- ✅ Project loads from S3
- ✅ Previous data available
- ✅ Can continue workflow
- ✅ No data loss

**Visual Checks:**
- [ ] Data persists after refresh
- [ ] No need to re-run analyses
- [ ] Session context maintained

---

### Phase 4: Action Button Testing (5 minutes)

Test that action buttons work correctly.

#### Test 1: Click Action Button

1. Run terrain analysis (if not already done)
2. **Click "Optimize Layout" button**

**Expected Results:**
- ✅ Query sent automatically
- ✅ Query is: "Optimize turbine layout"
- ✅ Layout optimization runs
- ✅ No need to type query

**Visual Checks:**
- [ ] Button click sends query
- [ ] Query appears in chat
- [ ] Response received
- [ ] Workflow progresses

---

#### Test 2: Multiple Action Buttons

After layout optimization, you should see multiple buttons:
- "Run Wake Simulation"
- "Generate Wind Rose"
- "Generate Report"

**Click each button and verify:**
- [ ] Each sends correct query
- [ ] Each triggers correct analysis
- [ ] Buttons are contextual to workflow step

---

### Phase 5: Chain of Thought Testing (3 minutes)

Verify chain of thought displays correctly.

**Run any analysis and check:**

**Expected Results:**
- ✅ Cloudscape ExpandableSection used
- ✅ Each step shows:
  - Step number
  - Action description
  - Status (in progress, completed, error)
  - Duration in milliseconds
- ✅ Completed steps default collapsed
- ✅ In-progress steps expanded with spinner
- ✅ Error steps expanded with alert icon

**Visual Checks:**
- [ ] Steps are collapsible
- [ ] Status icons correct
- [ ] Timing accurate (not estimated)
- [ ] Formatting clear

---

### Phase 6: Error Handling Testing (5 minutes)

Test error scenarios to ensure graceful handling.

#### Test 1: Missing Coordinates

**Prompt:**
```
Optimize turbine layout
```
(In a new session without terrain analysis)

**Expected Results:**
- ✅ User-friendly error message
- ✅ Suggestion to provide coordinates
- ✅ Example query shown
- ✅ No crash or generic error

---

#### Test 2: Missing Layout

**Prompt:**
```
Run wake simulation
```
(Without layout optimization)

**Expected Results:**
- ✅ Clear error about missing layout
- ✅ Suggestion to run layout first
- ✅ Project name in error message
- ✅ Helpful guidance

---

#### Test 3: Invalid Coordinates

**Prompt:**
```
Analyze terrain at 999, 999
```

**Expected Results:**
- ✅ Validation error
- ✅ Clear message about invalid coordinates
- ✅ Valid range shown
- ✅ No backend error

---

## Test Results Checklist

### Core Functionality
- [ ] Terrain analysis works (151 features)
- [ ] Layout optimization works (turbines on map)
- [ ] Wind rose works (Plotly interactive chart)
- [ ] Wake simulation works (Docker Lambda)
- [ ] Report generation works
- [ ] All dashboards render correctly

### Docker Lambda Specific
- [ ] Wake simulation completes without timeout
- [ ] Heat map visualization displays
- [ ] Performance metrics calculated
- [ ] No Docker-related errors in logs

### Dashboards
- [ ] Wind resource dashboard renders (60/40 layout)
- [ ] Performance dashboard renders (2x2 grid)
- [ ] Wake analysis dashboard renders (50/50 split)
- [ ] All charts interactive
- [ ] Export functionality works

### Project Persistence
- [ ] Project names auto-generated
- [ ] Data saves to S3
- [ ] Data loads from S3
- [ ] Session context maintained
- [ ] Project listing works
- [ ] Data survives page refresh

### User Experience
- [ ] Action buttons appear
- [ ] Action buttons work when clicked
- [ ] Chain of thought displays correctly
- [ ] Error messages are user-friendly
- [ ] No "Visualization Unavailable" errors
- [ ] No infinite loading states
- [ ] No page reloads required

### Performance
- [ ] Terrain analysis < 10 seconds
- [ ] Layout optimization < 10 seconds
- [ ] Wind rose < 8 seconds
- [ ] Wake simulation < 15 seconds
- [ ] Dashboards < 5 seconds
- [ ] No timeouts

---

## Troubleshooting

### If Docker Lambda Fails

**Symptoms:**
- Wake simulation times out
- Error: "Container initialization failed"
- No heat map visualization

**Check:**
1. CloudWatch logs for simulation Lambda
2. Docker image is deployed
3. Lambda has sufficient memory (2048 MB)
4. Lambda timeout is sufficient (300 seconds)

**Commands:**
```bash
# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name <simulation-lambda-name>

# Check CloudWatch logs
aws logs tail /aws/lambda/<simulation-lambda-name> --follow
```

---

### If Dashboards Don't Render

**Symptoms:**
- Blank dashboard area
- "Visualization Unavailable"
- Charts don't display

**Check:**
1. Browser console for JavaScript errors
2. Network tab for failed requests
3. S3 URLs are accessible
4. Plotly library loaded

---

### If Project Persistence Fails

**Symptoms:**
- Data doesn't save
- Can't load previous projects
- Session context lost

**Check:**
1. S3 bucket permissions
2. Project store Lambda logs
3. DynamoDB table exists
4. Session ID is consistent

---

## Success Criteria

### Must Pass (Critical)
- ✅ All 5 core analyses work
- ✅ Docker Lambda (simulation) works
- ✅ All 3 dashboards render
- ✅ Project data persists
- ✅ No "Visualization Unavailable" errors

### Should Pass (Important)
- ✅ Action buttons work
- ✅ Chain of thought displays
- ✅ Error handling is graceful
- ✅ Performance within benchmarks

### Nice to Have
- ✅ Export functionality works
- ✅ All charts interactive
- ✅ Smooth user experience

---

## Reporting Issues

If you find issues, document:

1. **Exact steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots**
5. **Browser console errors**
6. **CloudWatch logs** (if backend issue)

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark Docker Lambda as working
2. ✅ Mark dashboards as validated
3. ✅ Document any performance issues
4. ✅ Prepare for production deployment

If tests fail:
1. ❌ Document failures
2. ❌ Check troubleshooting section
3. ❌ Review CloudWatch logs
4. ❌ Fix issues before proceeding

---

**Remember:** Quality over speed. One failure = stop and fix.

**Test Date:** ___________  
**Tester:** ___________  
**Overall Result:** [ ] PASS [ ] FAIL  
**Notes:** ___________________________________________
