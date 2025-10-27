# Project Dashboard Manual Test Guide

## Overview

This guide provides comprehensive manual testing scenarios for the Project Dashboard feature. The dashboard displays all renewable energy projects with interactive sorting, action buttons, duplicate detection, and active project markers.

## Prerequisites

### 1. Test Data Setup

Run the test data setup script to create 7 test projects with varying completion levels:

```bash
node tests/manual/test-project-dashboard-manual.js setup
```

This creates:
- **texas-panhandle-wind-farm** (100% complete)
- **oklahoma-plains-site** (75% complete)
- **kansas-wind-corridor** (50% complete)
- **nebraska-highlands** (25% complete)
- **iowa-farmland-project** (0% complete)
- **texas-panhandle-duplicate** (25% complete, same location as first)
- **south-dakota-prairie** (100% complete)

### 2. Application Running

Ensure the application is running:

```bash
# Terminal 1: Sandbox
npx ampx sandbox

# Terminal 2: Frontend
npm run dev
```

### 3. Browser Setup

- Open browser to `http://localhost:3000`
- Sign in with test credentials
- Open Developer Tools (F12)
- Keep Console tab visible to monitor for errors

---

## Test Scenarios

### Scenario 1: Dashboard Display

**Objective:** Verify dashboard renders correctly with all projects

**Steps:**

1. Navigate to chat interface
2. Send query: `show my project dashboard`
3. Wait for response (should be < 2 seconds)

**Expected Results:**

✅ **Dashboard Artifact Renders**
- ProjectDashboardArtifact component displays
- No "Visualization Unavailable" error
- No blank screen

✅ **All Projects Displayed**
- 7 project cards visible
- Each card shows:
  - Project name
  - Location (formatted coordinates)
  - Completion percentage with progress bar
  - Last updated timestamp (relative format)
  - Status label
  - Action buttons

✅ **Visual Layout**
- Cards arranged in grid layout
- Responsive design (adjusts to screen size)
- Clear visual hierarchy
- Consistent spacing

**Validation Checklist:**
- [ ] Dashboard renders without errors
- [ ] All 7 projects visible
- [ ] Project cards formatted correctly
- [ ] No console errors
- [ ] Response time < 2 seconds

**Screenshot:** Capture full dashboard view

---

### Scenario 2: Sorting Functionality

**Objective:** Verify all sorting options work correctly

#### 2.1 Sort by Name

**Steps:**
1. Click "Sort by Name" button
2. Observe project order

**Expected Order (Alphabetical):**
1. iowa-farmland-project
2. kansas-wind-corridor
3. nebraska-highlands
4. oklahoma-plains-site
5. south-dakota-prairie
6. texas-panhandle-duplicate
7. texas-panhandle-wind-farm

**Validation:**
- [ ] Projects sorted alphabetically
- [ ] Sort button shows active state
- [ ] Order persists until changed

#### 2.2 Sort by Date

**Steps:**
1. Click "Sort by Date" button
2. Observe project order

**Expected Order (Newest First):**
1. iowa-farmland-project (5 min ago)
2. nebraska-highlands (10 min ago)
3. kansas-wind-corridor (30 min ago)
4. oklahoma-plains-site (2 hours ago)
5. texas-panhandle-wind-farm (1 day ago)
6. texas-panhandle-duplicate (4 days ago)
7. south-dakota-prairie (8 days ago)

**Validation:**
- [ ] Projects sorted by last updated (newest first)
- [ ] Timestamps displayed correctly
- [ ] Relative time format used (e.g., "5 minutes ago")

#### 2.3 Sort by Location

**Steps:**
1. Click "Sort by Location" button
2. Observe project order

**Expected Order (By Latitude):**
1. texas-panhandle-wind-farm (35.07°)
2. texas-panhandle-duplicate (35.07°)
3. oklahoma-plains-site (36.12°)
4. kansas-wind-corridor (37.79°)
5. nebraska-highlands (41.23°)
6. iowa-farmland-project (42.35°)
7. south-dakota-prairie (43.57°)

**Validation:**
- [ ] Projects sorted by latitude (south to north)
- [ ] Location coordinates displayed
- [ ] Format: "XX.XXXX, -XX.XXXX"

#### 2.4 Sort by Completion

**Steps:**
1. Click "Sort by Completion" button
2. Observe project order

**Expected Order (Highest First):**
1. texas-panhandle-wind-farm (100%)
2. south-dakota-prairie (100%)
3. oklahoma-plains-site (75%)
4. kansas-wind-corridor (50%)
5. nebraska-highlands (25%)
6. texas-panhandle-duplicate (25%)
7. iowa-farmland-project (0%)

**Validation:**
- [ ] Projects sorted by completion percentage
- [ ] Progress bars visible
- [ ] Percentages accurate

**Screenshot:** Capture dashboard sorted by completion

---

### Scenario 3: Action Buttons

**Objective:** Verify all action buttons work correctly for different project states

#### 3.1 View Button (Complete Project)

**Steps:**
1. Find "texas-panhandle-wind-farm" (100% complete)
2. Click "View" button

**Expected Results:**
- Query sent: `show project texas-panhandle-wind-farm`
- Project details displayed
- All analysis results shown
- Metrics and statistics visible

**Validation:**
- [ ] View button visible
- [ ] Query sent correctly
- [ ] Project details displayed
- [ ] No errors

#### 3.2 Continue Button (Partial Project)

**Steps:**
1. Find "kansas-wind-corridor" (50% complete)
2. Click "Continue" button

**Expected Results:**
- Query sent: `continue with project kansas-wind-corridor`
- System suggests next step (run simulation)
- Project set as active
- Helpful guidance provided

**Validation:**
- [ ] Continue button visible
- [ ] Query sent correctly
- [ ] Next step suggested
- [ ] Project becomes active

#### 3.3 Rename Button

**Steps:**
1. Find any project
2. Click "Rename" button
3. Enter new name: `test-renamed-project`
4. Confirm

**Expected Results:**
- Rename dialog appears
- Input field for new name
- Confirmation button
- Project renamed successfully
- Dashboard updates with new name

**Validation:**
- [ ] Rename dialog appears
- [ ] Input field works
- [ ] Rename succeeds
- [ ] Dashboard updates

#### 3.4 Delete Button

**Steps:**
1. Find "iowa-farmland-project"
2. Click "Delete" button
3. Observe confirmation dialog
4. Click "Cancel" first
5. Click "Delete" again
6. Click "Confirm"

**Expected Results:**
- Confirmation dialog appears
- Warning message displayed
- Cancel button works (no deletion)
- Confirm button deletes project
- Dashboard updates (project removed)
- Success message shown

**Validation:**
- [ ] Confirmation dialog appears
- [ ] Cancel works (no deletion)
- [ ] Confirm deletes project
- [ ] Dashboard updates
- [ ] No errors

**Screenshot:** Capture confirmation dialog

---

### Scenario 4: Duplicate Detection

**Objective:** Verify duplicate projects are identified and marked

**Steps:**
1. View dashboard
2. Find "texas-panhandle-wind-farm" and "texas-panhandle-duplicate"
3. Observe warning badges
4. Hover over badges
5. Scroll to duplicate groups section

**Expected Results:**

✅ **Warning Badges**
- Both projects have warning icon/badge
- Badge color: yellow or orange
- Badge position: top-right of card

✅ **Tooltip**
- Hover shows: "Duplicate location detected"
- Tooltip mentions other project name
- Clear and informative

✅ **Duplicate Groups Section**
- Section at bottom of dashboard
- Header: "Duplicate Locations Detected"
- Shows: "2 projects at 35.0675, -101.3955"
- Lists both project names:
  - texas-panhandle-wind-farm
  - texas-panhandle-duplicate

**Validation:**
- [ ] Warning badges visible on both projects
- [ ] Tooltip displays on hover
- [ ] Duplicate groups section present
- [ ] Correct location shown
- [ ] Both projects listed

**Technical Validation:**
- [ ] Haversine distance calculation correct
- [ ] 1km radius threshold applied
- [ ] Only projects within 1km marked as duplicates

**Screenshot:** Capture duplicate warning badges and groups section

---

### Scenario 5: Active Project Marker

**Objective:** Verify active project is marked correctly

#### 5.1 Set Active Project

**Steps:**
1. Send query: `continue with project oklahoma-plains-site`
2. Wait for response
3. Send query: `show my project dashboard`
4. Observe dashboard

**Expected Results:**
- "oklahoma-plains-site" has green "Active" badge
- Badge position: top-left of card
- Badge text: "Active" or "●"
- Only ONE project marked as active

**Validation:**
- [ ] Active badge visible
- [ ] Correct project marked
- [ ] Only one active project
- [ ] Badge color: green

#### 5.2 Change Active Project

**Steps:**
1. Send query: `continue with project kansas-wind-corridor`
2. Send query: `show my project dashboard`
3. Observe dashboard

**Expected Results:**
- "kansas-wind-corridor" now has active badge
- "oklahoma-plains-site" no longer has active badge
- Active marker moved correctly

**Validation:**
- [ ] Active marker moved
- [ ] Previous active cleared
- [ ] New active marked
- [ ] Only one active project

**Screenshot:** Capture active project marker

---

### Scenario 6: Completion Percentage Accuracy

**Objective:** Verify completion percentages are calculated correctly

**Expected Percentages:**

| Project | Terrain | Layout | Simulation | Report | Completion |
|---------|---------|--------|------------|--------|------------|
| texas-panhandle-wind-farm | ✓ | ✓ | ✓ | ✓ | 100% |
| oklahoma-plains-site | ✓ | ✓ | ✓ | ✗ | 75% |
| kansas-wind-corridor | ✓ | ✓ | ✗ | ✗ | 50% |
| nebraska-highlands | ✓ | ✗ | ✗ | ✗ | 25% |
| iowa-farmland-project | ✗ | ✗ | ✗ | ✗ | 0% |
| texas-panhandle-duplicate | ✓ | ✗ | ✗ | ✗ | 25% |
| south-dakota-prairie | ✓ | ✓ | ✓ | ✓ | 100% |

**Validation Steps:**
1. View dashboard
2. Check each project's completion percentage
3. Verify progress bar matches percentage
4. Verify color coding (if applicable)

**Validation:**
- [ ] All percentages correct
- [ ] Progress bars accurate
- [ ] Visual representation clear
- [ ] Calculation logic correct (completed steps / 4 * 100)

---

### Scenario 7: Status Labels

**Objective:** Verify status labels are accurate

**Expected Status Labels:**

| Project | Status Label |
|---------|-------------|
| texas-panhandle-wind-farm | Complete |
| oklahoma-plains-site | Simulation Complete |
| kansas-wind-corridor | Layout Complete |
| nebraska-highlands | Terrain Complete |
| iowa-farmland-project | Not Started |
| texas-panhandle-duplicate | Terrain Complete |
| south-dakota-prairie | Complete |

**Status Label Logic:**
- **Complete**: All 4 steps done (report_results exists)
- **Simulation Complete**: 3 steps done (simulation_results exists)
- **Layout Complete**: 2 steps done (layout_results exists)
- **Terrain Complete**: 1 step done (terrain_results exists)
- **Not Started**: 0 steps done

**Validation:**
- [ ] All status labels correct
- [ ] Labels match completion state
- [ ] Clear and descriptive
- [ ] Consistent formatting

---

### Scenario 8: Location Formatting

**Objective:** Verify coordinates are formatted correctly

**Expected Formats:**

| Project | Coordinates | Formatted |
|---------|------------|-----------|
| texas-panhandle-wind-farm | 35.067482, -101.395466 | 35.0675, -101.3955 |
| oklahoma-plains-site | 36.123456, -97.654321 | 36.1235, -97.6543 |
| kansas-wind-corridor | 37.789012, -99.123456 | 37.7890, -99.1235 |
| nebraska-highlands | 41.234567, -100.987654 | 41.2346, -100.9877 |
| iowa-farmland-project | 42.345678, -93.876543 | 42.3457, -93.8765 |

**Format Rules:**
- 4 decimal places
- Comma separator
- Space after comma
- Negative sign for west longitude

**Validation:**
- [ ] All locations formatted correctly
- [ ] 4 decimal places
- [ ] Consistent format
- [ ] Readable and clear

---

### Scenario 9: Backward Compatibility

**Objective:** Verify text-only responses still work

#### 9.1 List Projects (Text)

**Steps:**
1. Send query: `list my projects`

**Expected Results:**
- TEXT response (not artifact)
- Markdown formatted list
- All projects listed
- Key information shown

**Validation:**
- [ ] Text response received
- [ ] NOT dashboard artifact
- [ ] All projects listed
- [ ] Readable format

#### 9.2 Show Project Details (Text)

**Steps:**
1. Send query: `show project texas-panhandle-wind-farm`

**Expected Results:**
- TEXT response with project details
- All analysis results shown
- Metrics and statistics
- NOT dashboard artifact

**Validation:**
- [ ] Text response received
- [ ] NOT dashboard artifact
- [ ] Complete project details
- [ ] Readable format

---

### Scenario 10: Performance Testing

**Objective:** Verify dashboard performs within acceptable limits

#### 10.1 Response Time

**Steps:**
1. Open browser DevTools Network tab
2. Send query: `show my project dashboard`
3. Measure time from request to render

**Expected:**
- Backend response: < 1 second
- Total render time: < 2 seconds
- No timeout errors

**Validation:**
- [ ] Backend responds quickly
- [ ] Dashboard renders quickly
- [ ] No performance issues

#### 10.2 Browser Console

**Steps:**
1. Open browser DevTools Console tab
2. Send query: `show my project dashboard`
3. Check for errors or warnings

**Expected:**
- Zero errors
- Zero warnings (or only minor warnings)
- No React errors
- No network errors

**Validation:**
- [ ] No console errors
- [ ] No React errors
- [ ] No network failures
- [ ] Clean console output

#### 10.3 Artifact Size

**Steps:**
1. Open browser DevTools Network tab
2. Send query: `show my project dashboard`
3. Find artifact response
4. Check size

**Expected:**
- Artifact size: < 100KB
- Reasonable payload size
- No excessive data

**Validation:**
- [ ] Artifact size reasonable
- [ ] No excessive data
- [ ] Efficient payload

---

## Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Local Sandbox [ ] Production

Scenario 1: Dashboard Display          [ ] PASS [ ] FAIL
Scenario 2: Sorting Functionality      [ ] PASS [ ] FAIL
  - Sort by Name                       [ ] PASS [ ] FAIL
  - Sort by Date                       [ ] PASS [ ] FAIL
  - Sort by Location                   [ ] PASS [ ] FAIL
  - Sort by Completion                 [ ] PASS [ ] FAIL
Scenario 3: Action Buttons             [ ] PASS [ ] FAIL
  - View Button                        [ ] PASS [ ] FAIL
  - Continue Button                    [ ] PASS [ ] FAIL
  - Rename Button                      [ ] PASS [ ] FAIL
  - Delete Button                      [ ] PASS [ ] FAIL
Scenario 4: Duplicate Detection        [ ] PASS [ ] FAIL
Scenario 5: Active Project Marker      [ ] PASS [ ] FAIL
Scenario 6: Completion Percentage      [ ] PASS [ ] FAIL
Scenario 7: Status Labels              [ ] PASS [ ] FAIL
Scenario 8: Location Formatting        [ ] PASS [ ] FAIL
Scenario 9: Backward Compatibility     [ ] PASS [ ] FAIL
Scenario 10: Performance Testing       [ ] PASS [ ] FAIL

Overall Result:                        [ ] PASS [ ] FAIL

Critical Issues Found:
_________________________________________________
_________________________________________________
_________________________________________________

Minor Issues Found:
_________________________________________________
_________________________________________________
_________________________________________________

Performance Notes:
_________________________________________________
_________________________________________________
_________________________________________________

Screenshots Captured:
[ ] Full dashboard view
[ ] Sorted by completion
[ ] Duplicate warnings
[ ] Active project marker
[ ] Action buttons
[ ] Confirmation dialog

Recommendations:
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Success Criteria

### Must Pass (Critical)

- ✅ Dashboard displays all 7 projects
- ✅ All 4 sorting options work correctly
- ✅ All action buttons function properly
- ✅ Duplicate detection identifies 2 duplicates
- ✅ Active project marker shows correctly
- ✅ Completion percentages are accurate
- ✅ Status labels are correct
- ✅ Backward compatibility maintained (text responses work)

### Should Pass (Important)

- ✅ Response time < 2 seconds
- ✅ Zero console errors
- ✅ Smooth UI interactions
- ✅ Tooltips display correctly
- ✅ Progress bars render properly
- ✅ Confirmation dialogs work

### Nice to Have

- ✅ Animations smooth
- ✅ Responsive design works on mobile
- ✅ Export functionality (if implemented)
- ✅ Keyboard navigation works

---

## Troubleshooting

### Dashboard Doesn't Render

**Symptoms:**
- Blank screen
- "Visualization Unavailable"
- No dashboard artifact

**Check:**
1. Browser console for errors
2. Verify ProjectDashboardArtifact component exists
3. Check artifact type is "project_dashboard"
4. Verify ChatMessage.tsx has case for 'project_dashboard'

**Fix:**
```bash
# Check component exists
ls src/components/renewable/ProjectDashboardArtifact.tsx

# Check for TypeScript errors
npx tsc --noEmit
```

### Projects Don't Appear

**Symptoms:**
- Dashboard renders but empty
- "No projects found" message

**Check:**
1. Verify projects exist in DynamoDB
2. Check ProjectStore.list() returns data
3. Verify S3 permissions
4. Check CloudWatch logs

**Fix:**
```bash
# List projects in DynamoDB
node tests/manual/test-project-dashboard-manual.js list

# Re-create test data
node tests/manual/test-project-dashboard-manual.js cleanup
node tests/manual/test-project-dashboard-manual.js setup
```

### Sorting Doesn't Work

**Symptoms:**
- Click sort button, nothing happens
- Projects don't reorder

**Check:**
1. Check ProjectDashboardArtifact component
2. Verify sort functions implemented
3. Check state updates correctly
4. Look for React errors in console

**Fix:**
- Review ProjectDashboardArtifact.tsx sort logic
- Check useState for projects array
- Verify sort functions return new array

### Duplicates Not Detected

**Symptoms:**
- No warning badges
- Duplicate groups section empty

**Check:**
1. Verify Haversine distance calculation
2. Check 1km radius threshold
3. Verify coordinates are valid
4. Check detectDuplicates() function

**Fix:**
- Review ProjectListHandler.detectDuplicates()
- Verify calculateDistance() function
- Check coordinates format

### Action Buttons Don't Work

**Symptoms:**
- Click button, nothing happens
- No query sent

**Check:**
1. Check onAction callback in ChatMessage.tsx
2. Verify handleSendMessage function
3. Check button onClick handlers
4. Look for JavaScript errors

**Fix:**
- Review ChatMessage.tsx onAction implementation
- Check ProjectDashboardArtifact button handlers
- Verify query formatting

---

## Cleanup

After testing, clean up test data:

```bash
node tests/manual/test-project-dashboard-manual.js cleanup
```

This removes all 7 test projects from the database.

---

## Additional Resources

- **Test Script:** `tests/manual/test-project-dashboard-manual.js`
- **Requirements:** `.kiro/specs/fix-project-dashboard-ui/requirements.md`
- **Design:** `.kiro/specs/fix-project-dashboard-ui/design.md`
- **Tasks:** `.kiro/specs/fix-project-dashboard-ui/tasks.md`

---

## Support

If you encounter issues during testing:

1. Check the troubleshooting section above
2. Review CloudWatch logs for backend errors
3. Check browser console for frontend errors
4. Verify test data exists in DynamoDB
5. Document exact reproduction steps
6. Include screenshots and error messages

---

**Last Updated:** January 2025  
**Status:** Ready for Manual Testing  
**Focus:** Project Dashboard UI Feature
