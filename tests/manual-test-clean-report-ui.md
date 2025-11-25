# Manual Test Guide: Report Generation UI Clean Test

## Overview
This guide provides step-by-step instructions for manually testing that report generation displays only Cloudscape templates without redundant status text.

## Prerequisites
- Application deployed and running
- Access to chat interface
- Browser DevTools available

## Test Environment
- **Test Date**: [Record date/time]
- **Tester**: [Your name]
- **Browser**: [Chrome/Firefox/Safari]
- **Environment**: [Development/Staging/Production]

## Test Workflow

### Phase 1: Complete Full Workflow

#### Step 1: Terrain Analysis
1. Open chat interface
2. Send query: `"analyze terrain at 35.067482, -101.395466"`
3. Wait for response
4. **Verify**:
   - [ ] No status text before Cloudscape Container
   - [ ] Terrain map displays correctly
   - [ ] WorkflowCTAButtons show "Terrain ✓"

#### Step 2: Wind Rose Analysis
1. Send query: `"show wind rose for this location"`
2. Wait for response
3. **Verify**:
   - [ ] No status text before Cloudscape Container
   - [ ] Wind rose visualization displays
   - [ ] WorkflowCTAButtons show "Terrain ✓, Wind Rose ✓"

#### Step 3: Layout Optimization
1. Send query: `"optimize turbine layout with 10 turbines"`
2. Wait for response
3. **Verify**:
   - [ ] No status text before Cloudscape Container
   - [ ] Layout map displays with turbines
   - [ ] WorkflowCTAButtons show "Terrain ✓, Wind Rose ✓, Layout ✓"

#### Step 4: Wake Simulation
1. Send query: `"run wake simulation"`
2. Wait for response
3. **Verify**:
   - [ ] No status text before Cloudscape Container
   - [ ] Wake simulation chart displays
   - [ ] WorkflowCTAButtons show all steps complete except report

### Phase 2: Test Report Generation

#### Step 5: Generate Report
1. Send query: `"generate comprehensive report"`
2. Wait for response
3. **Observe the response carefully**

## Validation Checklist

### Visual Inspection

#### ✅ Check 1: No Status Text Before Container
**Expected**: No text like "Report generated successfully" or "Project: xyz" appears before the Cloudscape Container

**Actual**: 
- [ ] PASS - No status text visible
- [ ] FAIL - Status text appears before container

**Notes**: _______________________________________

---

#### ✅ Check 2: Cloudscape Container Renders
**Expected**: Report displays in a Cloudscape Container component with proper styling

**Actual**:
- [ ] PASS - Container renders correctly
- [ ] FAIL - Container missing or broken

**Notes**: _______________________________________

---

#### ✅ Check 3: Header with Title
**Expected**: Cloudscape Header shows appropriate report title (e.g., "Wind Farm Feasibility Report")

**Actual**:
- [ ] PASS - Header displays with title
- [ ] FAIL - Header missing or incorrect

**Notes**: _______________________________________

---

#### ✅ Check 4: Report Sections Display
**Expected**: All report sections render correctly:
- Executive Summary
- Site Analysis
- Technical Specifications
- Recommendations
- Appendices

**Actual**:
- [ ] PASS - All sections display
- [ ] FAIL - Some sections missing

**Notes**: _______________________________________

---

#### ✅ Check 5: WorkflowCTAButtons Present
**Expected**: Workflow navigation buttons show all steps complete

**Actual**:
- [ ] PASS - Buttons show correct state
- [ ] FAIL - Buttons missing or incorrect

**Notes**: _______________________________________

---

#### ✅ Check 6: Project Metadata Visible
**Expected**: Project ID and metadata display in artifact footer

**Actual**:
- [ ] PASS - Metadata displays correctly
- [ ] FAIL - Metadata missing

**Notes**: _______________________________________

---

#### ✅ Check 7: No Console Errors
**Expected**: Browser DevTools console shows no errors

**Steps**:
1. Open DevTools (F12)
2. Check Console tab
3. Look for red error messages

**Actual**:
- [ ] PASS - No console errors
- [ ] FAIL - Console errors present

**Error Messages** (if any): _______________________________________

---

#### ✅ Check 8: Consistent with Other Artifacts
**Expected**: Report UI matches the clean style of terrain, wind rose, layout, and simulation artifacts

**Actual**:
- [ ] PASS - Consistent styling
- [ ] FAIL - Inconsistent styling

**Notes**: _______________________________________

---

## Browser DevTools Inspection

### Network Tab
1. Open DevTools → Network tab
2. Filter for the report generation request
3. **Check**:
   - [ ] Request completes successfully (200 status)
   - [ ] Response contains artifacts array
   - [ ] Response message is empty or minimal

### Console Tab
1. Check for any errors or warnings
2. **Record any issues**: _______________________________________

### Elements Tab
1. Inspect the report artifact component
2. **Verify**:
   - [ ] Cloudscape Container element present
   - [ ] No text nodes before Container
   - [ ] Proper component hierarchy

## Test Results Summary

### Overall Assessment
- **Total Checks**: 8
- **Passed**: _____ / 8
- **Failed**: _____ / 8
- **Pass Rate**: _____ %

### Final Verdict
- [ ] ✅ **PASS** - All checks passed, report generation UI is clean
- [ ] ❌ **FAIL** - Some checks failed, issues need to be addressed

### Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Screenshots
Attach screenshots showing:
1. Report generation response (full view)
2. Cloudscape Container with Header
3. WorkflowCTAButtons state
4. Browser DevTools console (if errors)

## Comparison with Previous Artifacts

### Consistency Check
Compare report generation UI with previous workflow steps:

| Aspect | Terrain | Wind Rose | Layout | Simulation | Report | Consistent? |
|--------|---------|-----------|--------|------------|--------|-------------|
| No status text | ✓ | ✓ | ✓ | ✓ | ? | [ ] |
| Cloudscape Container | ✓ | ✓ | ✓ | ✓ | ? | [ ] |
| Header with title | ✓ | ✓ | ✓ | ✓ | ? | [ ] |
| WorkflowCTAButtons | ✓ | ✓ | ✓ | ✓ | ? | [ ] |
| Clean UI | ✓ | ✓ | ✓ | ✓ | ? | [ ] |

## Regression Testing

### Verify Previous Steps Still Work
After testing report generation, verify previous steps haven't regressed:

1. **Terrain Analysis**
   - [ ] Still displays correctly
   - [ ] No new status text appeared

2. **Wind Rose**
   - [ ] Still displays correctly
   - [ ] No new status text appeared

3. **Layout Optimization**
   - [ ] Still displays correctly
   - [ ] No new status text appeared

4. **Wake Simulation**
   - [ ] Still displays correctly
   - [ ] No new status text appeared

## Additional Notes

### Observations
_______________________________________
_______________________________________
_______________________________________

### Recommendations
_______________________________________
_______________________________________
_______________________________________

### Follow-up Actions
- [ ] _______________________________________
- [ ] _______________________________________
- [ ] _______________________________________

## Sign-off

**Tester**: _____________________ **Date**: _____________________

**Reviewer**: _____________________ **Date**: _____________________

**Status**: [ ] Approved [ ] Needs Revision

---

## Automated Test Execution

For automated testing, run:

```bash
# Node.js test (requires AWS credentials)
node tests/test-clean-report-ui.js

# Or open HTML test in browser
open tests/test-clean-report-ui.html
```

## Reference

- **Requirements**: See `.kiro/specs/clean-renewable-artifact-ui/requirements.md`
- **Design**: See `.kiro/specs/clean-renewable-artifact-ui/design.md`
- **Task**: Task 7 in `.kiro/specs/clean-renewable-artifact-ui/tasks.md`
