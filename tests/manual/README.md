# Manual Test Scripts

This directory contains manual test scripts and guides for features that require human validation and interaction.

## Project Dashboard Manual Tests

### Quick Start

```bash
# 1. Setup test data (creates 7 test projects)
node tests/manual/test-project-dashboard-manual.js setup

# 2. View test instructions
node tests/manual/test-project-dashboard-manual.js instructions

# 3. Follow the manual test guide
# See: PROJECT_DASHBOARD_MANUAL_TEST_GUIDE.md

# 4. Use the checklist to track progress
# See: PROJECT_DASHBOARD_TEST_CHECKLIST.md

# 5. Cleanup test data when done
node tests/manual/test-project-dashboard-manual.js cleanup
```

### Files

- **test-project-dashboard-manual.js** - Test data setup and management script
- **PROJECT_DASHBOARD_MANUAL_TEST_GUIDE.md** - Comprehensive testing guide with detailed scenarios
- **PROJECT_DASHBOARD_TEST_CHECKLIST.md** - Quick reference checklist for test execution

### Test Data

The setup script creates 7 test projects with varying completion levels:

| Project | Completion | Status | Notes |
|---------|------------|--------|-------|
| texas-panhandle-wind-farm | 100% | Complete | Full workflow |
| oklahoma-plains-site | 75% | Simulation Complete | Missing report |
| kansas-wind-corridor | 50% | Layout Complete | Missing simulation & report |
| nebraska-highlands | 25% | Terrain Complete | Only terrain done |
| iowa-farmland-project | 0% | Not Started | No analyses |
| texas-panhandle-duplicate | 25% | Terrain Complete | Same location as first |
| south-dakota-prairie | 100% | Complete | Full workflow |

### Test Scenarios

1. **Dashboard Display** - Verify all projects render correctly
2. **Sorting** - Test sort by name, date, location, completion
3. **Action Buttons** - Test view, continue, rename, delete
4. **Duplicate Detection** - Verify duplicates identified (2 at same location)
5. **Active Project Marker** - Test active project indicator
6. **Completion Percentage** - Verify accurate calculations
7. **Status Labels** - Verify correct status for each project
8. **Location Formatting** - Verify coordinate formatting
9. **Backward Compatibility** - Test text-only responses still work
10. **Performance** - Verify response times and no errors

### Commands

```bash
# Setup test data
node tests/manual/test-project-dashboard-manual.js setup

# List existing projects
node tests/manual/test-project-dashboard-manual.js list

# Show detailed instructions
node tests/manual/test-project-dashboard-manual.js instructions

# Cleanup test data
node tests/manual/test-project-dashboard-manual.js cleanup

# Show help
node tests/manual/test-project-dashboard-manual.js help
```

### Requirements

- AWS credentials configured
- DynamoDB Projects table exists
- Application running (sandbox + frontend)
- Browser with DevTools

### Success Criteria

**Must Pass:**
- ✅ All 7 projects display
- ✅ All 4 sort options work
- ✅ All action buttons work
- ✅ 2 duplicates detected
- ✅ Active marker works
- ✅ Percentages accurate
- ✅ Status labels correct
- ✅ Backward compatibility maintained

**Should Pass:**
- ✅ Response time < 2 seconds
- ✅ Zero console errors
- ✅ Smooth interactions
- ✅ Tooltips work

### Troubleshooting

**Dashboard doesn't render:**
- Check browser console for errors
- Verify ProjectDashboardArtifact component exists
- Check artifact type is "project_dashboard"

**Projects don't appear:**
- Run: `node tests/manual/test-project-dashboard-manual.js list`
- Verify projects exist in DynamoDB
- Check ProjectStore.list() returns data

**Sorting doesn't work:**
- Check ProjectDashboardArtifact component
- Verify sort functions implemented
- Check state updates correctly

**Duplicates not detected:**
- Verify Haversine distance calculation
- Check 1km radius threshold
- Verify coordinates are valid

### Related Documentation

- Requirements: `.kiro/specs/fix-project-dashboard-ui/requirements.md`
- Design: `.kiro/specs/fix-project-dashboard-ui/design.md`
- Tasks: `.kiro/specs/fix-project-dashboard-ui/tasks.md`
- Unit Tests: `tests/unit/test-dashboard-*.test.ts`
- Integration Tests: `tests/integration/test-project-dashboard-*.test.ts`

---

## Other Manual Tests

(Add other manual test scripts here as they are created)

---

**Last Updated:** January 2025  
**Status:** Ready for Testing
