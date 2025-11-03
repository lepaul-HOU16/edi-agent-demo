# Fix Terrain and Loading State Issues - Spec Summary

## Overview

This spec addresses two critical, recurring issues that have been attempted multiple times without success:

1. **Feature Count Regression**: Terrain map shows 60 features instead of 151
2. **Loading State Bug**: "Analyzing" popup doesn't dismiss, requires page reload

## Why This Spec Exists

Previous attempts to fix these issues have failed because they:
- Fixed symptoms without identifying root causes
- Made assumptions without verification
- Lacked comprehensive logging
- Had incomplete testing
- Didn't validate in deployed environments

This spec takes a **systematic, investigation-first approach** to ensure we:
1. Identify the ACTUAL root causes through comprehensive logging
2. Fix the root causes, not symptoms
3. Test thoroughly at all levels
4. Validate in deployed environment
5. Get user confirmation before declaring complete

## Approach

### Phase 1: Investigation (Tasks 1-4)
**DO NOT SKIP THIS PHASE**

1. Build debugging infrastructure (logging utilities)
2. Instrument frontend with comprehensive logging
3. Instrument backend with comprehensive logging
4. Run instrumented code and analyze logs to identify root causes

**Output**: Documented root causes with log evidence

### Phase 2: Implementation (Tasks 5-6)
**ONLY START AFTER ROOT CAUSES IDENTIFIED**

1. Implement fixes for identified root causes
2. Write comprehensive tests
3. Verify all tests pass

**Output**: Working fixes with passing tests

### Phase 3: Validation (Task 7)
**REQUIRED BEFORE DECLARING COMPLETE**

1. Deploy to staging/sandbox
2. Test in deployed environment
3. Verify both issues resolved
4. Collect evidence
5. Get user validation

**Output**: User-confirmed working solution

## Key Principles

### 1. Investigation Before Implementation
- Never fix without understanding root cause
- Use logging to trace issues systematically
- Document findings with evidence

### 2. Comprehensive Logging
- Log at EVERY step of data flow
- Track feature counts at each stage
- Track loading state transitions
- Keep logs in place after fixes

### 3. Thorough Testing
- Test after every change
- Test at all levels (unit, integration, e2e, regression)
- Test in deployed environment
- Don't skip any test level

### 4. User Validation Required
- Developer tests first
- User validates last
- Task not complete until user confirms
- No assumptions about success

## Success Criteria

✅ Root causes identified and documented
✅ Comprehensive logging in place
✅ 151 features display consistently
✅ Loading state dismisses automatically
✅ No reload required
✅ All tests pass
✅ Verified in deployed environment
✅ No regressions
✅ **User confirms both issues resolved**

## Files

- `requirements.md` - Detailed requirements with acceptance criteria
- `design.md` - System design with logging architecture
- `tasks.md` - Implementation task list
- `README.md` - This file

## How to Execute

1. Read ALL three spec files (requirements, design, tasks)
2. Start with task 1.1 (do NOT skip to task 5)
3. Complete tasks in order
4. Test after EVERY task
5. Do NOT proceed if tests fail
6. Get user validation at task 7.7
7. Do NOT mark complete until user confirms

## Remember

**INVESTIGATION → IMPLEMENTATION → VALIDATION**

**TASK IS NOT COMPLETE UNTIL USER SAYS IT'S COMPLETE**
