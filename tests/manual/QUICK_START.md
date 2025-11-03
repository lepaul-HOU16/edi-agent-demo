# Project Dashboard Manual Testing - Quick Start

## 5-Minute Setup

```bash
# 1. Create test data (7 projects)
node tests/manual/test-project-dashboard-manual.js setup

# 2. Start application (if not running)
npx ampx sandbox  # Terminal 1
npm run dev       # Terminal 2

# 3. Open browser
# http://localhost:3000
# Sign in with test credentials
```

## 10-Minute Test

### Test 1: Dashboard Display (2 min)
```
Query: show my project dashboard
```
✅ Check: All 7 projects display

### Test 2: Sorting (2 min)
- Click "Sort by Completion"
- Verify order: 100%, 100%, 75%, 50%, 25%, 25%, 0%

### Test 3: Action Buttons (3 min)
- Find "texas-panhandle-wind-farm"
- Click "View" button
- Verify project details display

### Test 4: Duplicates (2 min)
- Look for warning badges on:
  - texas-panhandle-wind-farm
  - texas-panhandle-duplicate
- Check duplicate groups section at bottom

### Test 5: Active Marker (1 min)
```
Query: continue with project oklahoma-plains-site
Query: show my project dashboard
```
✅ Check: "oklahoma-plains-site" has green "Active" badge

## Cleanup

```bash
node tests/manual/test-project-dashboard-manual.js cleanup
```

## Full Test Guide

For comprehensive testing, see:
- **Detailed Guide:** `PROJECT_DASHBOARD_MANUAL_TEST_GUIDE.md`
- **Checklist:** `PROJECT_DASHBOARD_TEST_CHECKLIST.md`

## Test Data

| Project | Completion | Status |
|---------|------------|--------|
| texas-panhandle-wind-farm | 100% | Complete |
| oklahoma-plains-site | 75% | Simulation Complete |
| kansas-wind-corridor | 50% | Layout Complete |
| nebraska-highlands | 25% | Terrain Complete |
| iowa-farmland-project | 0% | Not Started |
| texas-panhandle-duplicate | 25% | Terrain Complete |
| south-dakota-prairie | 100% | Complete |

## Success Criteria

✅ Dashboard displays all 7 projects  
✅ Sorting works  
✅ Action buttons work  
✅ 2 duplicates detected  
✅ Active marker shows  
✅ No console errors  

## Troubleshooting

**Dashboard doesn't render?**
- Check browser console (F12)
- Verify projects exist: `node tests/manual/test-project-dashboard-manual.js list`

**Projects don't appear?**
- Re-run setup: `node tests/manual/test-project-dashboard-manual.js setup`

**Need help?**
- Run: `node tests/manual/test-project-dashboard-manual.js help`
- See: `PROJECT_DASHBOARD_MANUAL_TEST_GUIDE.md`

---

**Estimated Time:** 15 minutes (setup + test + cleanup)  
**Status:** Ready to test!
