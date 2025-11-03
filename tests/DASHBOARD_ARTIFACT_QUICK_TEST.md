# Dashboard Artifact Quick Test Guide

## Quick Verification

### 1. Verify Implementation
```bash
node tests/verify-dashboard-artifact-rendering.js
```

**Expected**: All 10 checks pass ✅

### 2. Check TypeScript
```bash
npx tsc --noEmit --project tsconfig.json 2>&1 | grep "ChatMessage.tsx"
```

**Expected**: No errors

---

## Manual Testing (After Deployment)

### Test 1: Dashboard Rendering
**Query**: `show my project dashboard`

**Expected**:
- ✅ ProjectDashboardArtifact component renders
- ✅ Shows all projects in table
- ✅ Displays completion percentages
- ✅ Shows action buttons
- ✅ Highlights duplicates (if any)
- ✅ Shows active project badge (if any)

### Test 2: View Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "View" button on any project

**Expected**:
- ✅ Query sent: `show project {projectName}`
- ✅ Project details displayed

### Test 3: Continue Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "Continue" button on any project

**Expected**:
- ✅ Query sent: `continue with project {projectName}`
- ✅ Project set as active
- ✅ Next step suggested

### Test 4: Rename Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "Rename" button on any project

**Expected**:
- ✅ Query sent: `rename project {projectName}`
- ✅ Rename flow initiated

### Test 5: Delete Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "Delete" button on any project

**Expected**:
- ✅ Query sent: `delete project {projectName}`
- ✅ Confirmation requested

### Test 6: Refresh Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "Refresh" button

**Expected**:
- ✅ Query sent: `show my project dashboard`
- ✅ Dashboard reloaded

### Test 7: Create Action
**Steps**:
1. Send: `show my project dashboard`
2. Click "New Project" button

**Expected**:
- ✅ Query sent: `analyze terrain at a new location`
- ✅ New project workflow started

### Test 8: Backward Compatibility
**Query**: `list my projects`

**Expected**:
- ✅ Text-only response (NOT artifact)
- ✅ Simple list format

### Test 9: Dark Mode
**Steps**:
1. Toggle dark mode in UI
2. Send: `show my project dashboard`

**Expected**:
- ✅ Dashboard renders in dark mode
- ✅ Proper contrast and colors

### Test 10: Multiple Projects
**Setup**: Create 5+ projects with varying completion

**Query**: `show my project dashboard`

**Expected**:
- ✅ All projects displayed
- ✅ Sortable by name, date, location, completion
- ✅ Statistics summary correct

---

## Console Checks

### Expected Console Logs
```
🎉 EnhancedArtifactProcessor: Rendering ProjectDashboardArtifact!
[ChatMessage] Dashboard action: view on project: Solar Farm Alpha
```

### No Errors Expected
- ❌ No TypeScript errors
- ❌ No React errors
- ❌ No rendering errors
- ❌ No callback errors

---

## Troubleshooting

### Issue: Dashboard not rendering
**Check**:
1. Artifact type is `project_dashboard`
2. Artifact data structure is correct
3. Component is imported correctly

### Issue: Action buttons not working
**Check**:
1. onSendMessage callback is available
2. Action handler switch statement is correct
3. Console logs show action triggered

### Issue: Dark mode not working
**Check**:
1. darkMode prop is passed
2. theme.palette.mode is correct
3. Component supports dark mode

---

## Success Criteria

✅ All 10 manual tests pass  
✅ No console errors  
✅ Action buttons work correctly  
✅ Backward compatibility maintained  
✅ Dark mode works  
✅ Multiple projects display correctly

---

## Quick Commands

```bash
# Verify implementation
node tests/verify-dashboard-artifact-rendering.js

# Check TypeScript
npx tsc --noEmit | grep ChatMessage

# Deploy to sandbox
npx ampx sandbox

# Run all tests
npm test
```
