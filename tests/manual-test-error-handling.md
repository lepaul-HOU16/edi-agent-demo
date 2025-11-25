# Manual Test Guide: Error Handling for Clean Renewable Artifact UI

**Task**: 9. Test error handling  
**Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5  
**Date**: 2025-01-XX  
**Tester**: _____________

## Overview

This manual test verifies that when artifact generation fails, the system provides appropriate fallback messages and user feedback. The goal is to ensure users are never left with blank screens or confusing error states.

## Prerequisites

- [ ] Application deployed and accessible
- [ ] User authenticated and logged in
- [ ] Chat interface accessible
- [ ] Browser developer console open (F12)

## Test Scenarios

### Scenario 1: Invalid Coordinates (Terrain Analysis)

**Objective**: Verify fallback message when terrain analysis fails due to invalid coordinates.

**Steps**:
1. Open chat interface
2. Enter query: `analyze terrain at 999, 999`
3. Press Enter and wait for response

**Expected Results**:
- [ ] Response appears within reasonable time (< 30 seconds)
- [ ] Message text is displayed (not blank)
- [ ] Message contains fallback text like:
  - "Unable to generate visualization" OR
  - "Analysis complete" OR
  - "Error" or "Failed"
- [ ] NO Cloudscape artifact is displayed
- [ ] NO "Visualization Unavailable" placeholder
- [ ] Message is user-friendly (no stack traces or technical jargon)
- [ ] No console errors related to artifact rendering

**Actual Results**:
```
Message displayed: _________________________________________________

Artifacts shown: ___________________________________________________

Console errors: ____________________________________________________
```

**Status**: ⬜ Pass  ⬜ Fail  ⬜ Blocked

---

### Scenario 2: Missing Prerequisites (Layout Optimization)

**Objective**: Verify fallback message when layout optimization is requested without terrain analysis.

**Steps**:
1. Start a new chat session (refresh page or clear session)
2. Enter query: `optimize turbine layout`
3. Press Enter and wait for response

**Expected Results**:
- [ ] Response appears with clear error message
- [ ] Message explains what's missing (terrain analysis required)
- [ ] Message provides guidance on next steps
- [ ] NO artifacts displayed
- [ ] Message is actionable (tells user what to do)
- [ ] No blank or empty response

**Actual Results**:
```
Message displayed: _________________________________________________

Guidance provided: _________________________________________________

Status: ⬜ Pass  ⬜ Fail  ⬜ Blocked
```

---

### Scenario 3: Nonexistent Project (Report Generation)

**Objective**: Verify fallback message when requesting report for nonexistent project.

**Steps**:
1. Enter query: `generate report for project-that-does-not-exist-12345`
2. Press Enter and wait for response

**Expected Results**:
- [ ] Response appears with error message
- [ ] Message indicates project not found
- [ ] Message suggests alternatives (list projects, create new)
- [ ] NO artifacts displayed
- [ ] NO crash or blank screen
- [ ] User can continue using the chat

**Actual Results**:
```
Message displayed: _________________________________________________

Suggestions provided: ______________________________________________

Status: ⬜ Pass  ⬜ Fail  ⬜ Blocked
```

---

### Scenario 4: Malformed Query (Unknown Intent)

**Objective**: Verify fallback message when query cannot be understood.

**Steps**:
1. Enter query: `do something impossible with renewable energy xyz123`
2. Press Enter and wait for response

**Expected Results**:
- [ ] Response appears with helpful message
- [ ] Message explains what types of queries are supported
- [ ] Message provides examples of valid queries
- [ ] NO artifacts displayed
- [ ] NO technical error messages
- [ ] User understands what to do next

**Actual Results**:
```
Message displayed: _________________________________________________

Examples provided: _________________________________________________

Status: ⬜ Pass  ⬜ Fail  ⬜ Blocked
```

---

### Scenario 5: Timeout or Service Unavailable

**Objective**: Verify fallback message when backend service times out or is unavailable.

**Steps**:
1. (If possible) Temporarily disable one of the tool Lambdas
2. Enter query: `analyze terrain at 35.0, -101.0`
3. Press Enter and wait for response

**Expected Results**:
- [ ] Response appears (even if delayed)
- [ ] Message indicates service issue
- [ ] Message is user-friendly (not technical)
- [ ] NO artifacts displayed
- [ ] User is informed to try again later
- [ ] No infinite loading state

**Actual Results**:
```
Message displayed: _________________________________________________

Loading behavior: __________________________________________________

Status: ⬜ Pass  ⬜ Fail  ⬜ Blocked
```

---

### Scenario 6: Partial Failure (Artifact Generation Error)

**Objective**: Verify fallback message when tool succeeds but artifact generation fails.

**Steps**:
1. Complete a successful terrain analysis
2. Request wind rose: `show wind rose`
3. (If wind rose fails to generate) Observe response

**Expected Results**:
- [ ] Response appears with fallback message
- [ ] Message indicates analysis completed
- [ ] Message explains visualization unavailable
- [ ] NO broken artifact component
- [ ] NO "Visualization Unavailable" placeholder
- [ ] User can continue workflow

**Actual Results**:
```
Message displayed: _________________________________________________

Artifact behavior: _________________________________________________

Status: ⬜ Pass  ⬜ Fail  ⬜ Blocked
```

---

## Error Message Quality Checklist

For each error scenario above, verify the error message meets these criteria:

### User-Friendly Language
- [ ] No stack traces visible
- [ ] No technical jargon (e.g., "Lambda", "DynamoDB", "S3")
- [ ] No null/undefined values shown
- [ ] No error codes without explanation

### Actionable Guidance
- [ ] Tells user what went wrong
- [ ] Suggests what to do next
- [ ] Provides examples when appropriate
- [ ] Maintains positive tone

### Consistency
- [ ] Similar errors have similar message format
- [ ] Tone matches rest of application
- [ ] Follows Cloudscape design patterns
- [ ] Professional and clear

## Browser Console Verification

For each test scenario, check the browser console:

### Expected Console Behavior
- [ ] No unhandled promise rejections
- [ ] No React rendering errors
- [ ] No "Cannot read property of undefined" errors
- [ ] Errors are logged but don't crash the app

### Acceptable Console Messages
- ✅ Info logs about request/response
- ✅ Warning logs about missing data
- ✅ Debug logs (if in development mode)

### Unacceptable Console Messages
- ❌ Uncaught exceptions
- ❌ Component rendering failures
- ❌ Infinite loops or repeated errors
- ❌ Memory leaks

## Workflow Continuity Test

After encountering errors, verify the application remains functional:

**Steps**:
1. Trigger any error scenario above
2. After error message appears, try a valid query
3. Example: `analyze terrain at 35.0, -101.0`

**Expected Results**:
- [ ] Valid query works correctly
- [ ] Artifacts render properly
- [ ] No lingering error state
- [ ] Chat history shows both error and success
- [ ] Application fully recovered

**Status**: ⬜ Pass  ⬜ Fail  ⬜ Blocked

---

## Summary

### Test Results

| Scenario | Pass | Fail | Blocked | Notes |
|----------|------|------|---------|-------|
| 1. Invalid Coordinates | ⬜ | ⬜ | ⬜ | |
| 2. Missing Prerequisites | ⬜ | ⬜ | ⬜ | |
| 3. Nonexistent Project | ⬜ | ⬜ | ⬜ | |
| 4. Malformed Query | ⬜ | ⬜ | ⬜ | |
| 5. Timeout/Unavailable | ⬜ | ⬜ | ⬜ | |
| 6. Partial Failure | ⬜ | ⬜ | ⬜ | |
| Workflow Continuity | ⬜ | ⬜ | ⬜ | |

### Overall Assessment

**Total Tests**: 7  
**Passed**: _____  
**Failed**: _____  
**Blocked**: _____  

**Overall Status**: ⬜ All Pass  ⬜ Some Failures  ⬜ Major Issues

### Issues Found

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Recommendations

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________

### Sign-Off

**Tester**: ________________  
**Date**: __________________  
**Time Spent**: ____________  

**Ready for Production**: ⬜ Yes  ⬜ No  ⬜ With Caveats

---

## Notes

- This test focuses on error handling and user feedback
- All error messages should be user-friendly and actionable
- No technical details should be exposed to end users
- Application should remain functional after errors
- Users should always know what to do next
