# Project Dashboard Test Checklist

Quick reference checklist for manual testing of the Project Dashboard feature.

## Pre-Test Setup

- [ ] Run: `node tests/manual/test-project-dashboard-manual.js setup`
- [ ] Verify 7 projects created
- [ ] Start sandbox: `npx ampx sandbox`
- [ ] Start frontend: `npm run dev`
- [ ] Open browser to `http://localhost:3000`
- [ ] Sign in with test credentials
- [ ] Open DevTools (F12)

---

## Test Execution

### 1. Dashboard Display
- [ ] Send query: `show my project dashboard`
- [ ] Dashboard artifact renders
- [ ] All 7 projects visible
- [ ] Project cards formatted correctly
- [ ] No console errors
- [ ] Response time < 2 seconds
- [ ] **Screenshot captured**

### 2. Sorting
- [ ] Sort by Name (alphabetical order)
- [ ] Sort by Date (newest first)
- [ ] Sort by Location (latitude order)
- [ ] Sort by Completion (highest first)
- [ ] **Screenshot captured (sorted by completion)**

### 3. Action Buttons
- [ ] View button works (complete project)
- [ ] Continue button works (partial project)
- [ ] Rename button works (dialog appears)
- [ ] Delete button works (confirmation dialog)
- [ ] Cancel delete works (no deletion)
- [ ] Confirm delete works (project removed)
- [ ] **Screenshot captured (confirmation dialog)**

### 4. Duplicate Detection
- [ ] Warning badges visible on duplicates
- [ ] Tooltip shows on hover
- [ ] Duplicate groups section present
- [ ] Correct location shown (35.0675, -101.3955)
- [ ] Both projects listed
- [ ] **Screenshot captured (duplicate warnings)**

### 5. Active Project Marker
- [ ] Set active: `continue with project oklahoma-plains-site`
- [ ] Show dashboard: `show my project dashboard`
- [ ] Active badge visible on correct project
- [ ] Only one project marked active
- [ ] Change active: `continue with project kansas-wind-corridor`
- [ ] Show dashboard again
- [ ] Active marker moved correctly
- [ ] **Screenshot captured (active marker)**

### 6. Completion Percentages
- [ ] texas-panhandle-wind-farm: 100%
- [ ] oklahoma-plains-site: 75%
- [ ] kansas-wind-corridor: 50%
- [ ] nebraska-highlands: 25%
- [ ] iowa-farmland-project: 0%
- [ ] texas-panhandle-duplicate: 25%
- [ ] south-dakota-prairie: 100%
- [ ] Progress bars match percentages

### 7. Status Labels
- [ ] texas-panhandle-wind-farm: "Complete"
- [ ] oklahoma-plains-site: "Simulation Complete"
- [ ] kansas-wind-corridor: "Layout Complete"
- [ ] nebraska-highlands: "Terrain Complete"
- [ ] iowa-farmland-project: "Not Started"
- [ ] texas-panhandle-duplicate: "Terrain Complete"
- [ ] south-dakota-prairie: "Complete"

### 8. Location Formatting
- [ ] texas-panhandle-wind-farm: "35.0675, -101.3955"
- [ ] oklahoma-plains-site: "36.1235, -97.6543"
- [ ] kansas-wind-corridor: "37.7890, -99.1235"
- [ ] nebraska-highlands: "41.2346, -100.9877"
- [ ] iowa-farmland-project: "42.3457, -93.8765"
- [ ] Format: 4 decimal places, comma + space

### 9. Backward Compatibility
- [ ] Query: `list my projects` → TEXT response
- [ ] Query: `show project texas-panhandle-wind-farm` → TEXT response
- [ ] NOT dashboard artifact for these queries

### 10. Performance
- [ ] Backend response < 1 second
- [ ] Total render time < 2 seconds
- [ ] Zero console errors
- [ ] Zero React errors
- [ ] Artifact size < 100KB

---

## Post-Test Cleanup

- [ ] Run: `node tests/manual/test-project-dashboard-manual.js cleanup`
- [ ] Verify projects removed
- [ ] Document test results
- [ ] Save screenshots

---

## Quick Commands

```bash
# Setup test data
node tests/manual/test-project-dashboard-manual.js setup

# List projects
node tests/manual/test-project-dashboard-manual.js list

# Show instructions
node tests/manual/test-project-dashboard-manual.js instructions

# Cleanup
node tests/manual/test-project-dashboard-manual.js cleanup
```

---

## Test Queries

```
show my project dashboard
list my projects
show project texas-panhandle-wind-farm
continue with project oklahoma-plains-site
continue with project kansas-wind-corridor
```

---

## Success Criteria

### Must Pass ✅
- [ ] All 7 projects display
- [ ] All 4 sort options work
- [ ] All action buttons work
- [ ] 2 duplicates detected
- [ ] Active marker works
- [ ] Percentages accurate
- [ ] Status labels correct
- [ ] Backward compatibility maintained

### Should Pass ⚠️
- [ ] Response time < 2 seconds
- [ ] Zero console errors
- [ ] Smooth interactions
- [ ] Tooltips work

---

## Screenshots Required

1. [ ] Full dashboard view
2. [ ] Dashboard sorted by completion
3. [ ] Duplicate warning badges
4. [ ] Active project marker
5. [ ] Action buttons
6. [ ] Confirmation dialog

---

## Test Result

**Date:** ___________  
**Tester:** ___________  
**Overall:** [ ] PASS [ ] FAIL  

**Critical Issues:**
_________________________________________________

**Minor Issues:**
_________________________________________________

**Notes:**
_________________________________________________
