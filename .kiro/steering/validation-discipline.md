# Validation Discipline - MANDATORY EXECUTION PROTOCOL

## CRITICAL PRINCIPLE: NEVER ASSUME SUCCESS

**Current Success Rate: ~1%**
**Target Success Rate: >95%**

This document establishes MANDATORY validation protocols that MUST be followed for EVERY code change, no matter how small.

## Core Problem Statement

The AI agent has demonstrated a pattern of:
1. **Over-eagerness**: Declaring tasks complete without validation
2. **Assumption-based development**: Assuming code works without testing
3. **Incomplete testing**: Running superficial tests that miss real issues
4. **Tunnel vision**: Focusing on local fixes while breaking global functionality
5. **Regression blindness**: Repeatedly breaking previously working features

## MANDATORY VALIDATION PROTOCOL

### Phase 1: BEFORE Writing Any Code

#### 1.1 Context Gathering (REQUIRED)
```
□ Read ALL related spec files (requirements.md, design.md, tasks.md)
□ Read ALL related documentation in docs/ directory
□ Identify ALL files that will be affected by the change
□ Identify ALL features that could be impacted
□ Review regression-protection.md for protected patterns
□ Check git history for previous fixes to same area
```

#### 1.2 Impact Analysis (REQUIRED)
```
□ List ALL components that depend on code being changed
□ List ALL features that use the code being changed
□ Identify potential cascade failures
□ Document expected behavior BEFORE making changes
□ Create rollback plan
```

#### 1.3 Test Plan Creation (REQUIRED)
```
□ Define specific test cases for the fix
□ Define regression test cases for related features
□ Define integration test cases for dependent systems
□ Define end-to-end test cases for user workflows
□ Document expected results for each test
```

### Phase 2: DURING Implementation

#### 2.1 Incremental Development (REQUIRED)
```
□ Make ONE change at a time
□ Test after EACH change
□ Verify no regressions after EACH change
□ Document what changed and why
□ Never combine multiple fixes in one commit
```

#### 2.2 Code Quality Checks (REQUIRED)
```
□ Run TypeScript compiler (npx tsc --noEmit)
□ Run linter (npm run lint)
□ Check for console errors
□ Verify imports are correct
□ Check for type errors
□ Verify no dead code introduced
```

### Phase 3: AFTER Implementation (MOST CRITICAL)

#### 3.1 Unit Testing (REQUIRED)
```
□ Test the specific function/component changed
□ Test with valid inputs
□ Test with invalid inputs
□ Test edge cases
□ Test error conditions
□ Verify error messages are correct
```

#### 3.2 Integration Testing (REQUIRED)
```
□ Test interaction with dependent components
□ Test data flow through the system
□ Test API calls and responses
□ Test state management
□ Test event handling
```

#### 3.3 Regression Testing (REQUIRED)
```
□ Test ALL previously working features
□ Test ALL preloaded prompts (if applicable)
□ Test ALL user workflows
□ Verify feature counts (e.g., 151 features, not 60)
□ Verify no UI elements broken
□ Verify no data loss
```

#### 3.4 End-to-End Testing (REQUIRED)
```
□ Test complete user workflow from start to finish
□ Test in actual browser (not just theory)
□ Test loading states
□ Test error states
□ Test success states
□ Test UI responsiveness
□ Test data persistence
```

#### 3.5 Deployment Validation (REQUIRED)
```
□ Verify changes deploy successfully
□ Check CloudWatch logs for errors
□ Test in deployed environment
□ Verify no deployment-specific issues
□ Check resource utilization
```

## SPECIFIC VALIDATION REQUIREMENTS

### For Terrain Map Issues
```
BEFORE declaring complete, MUST verify:
□ Map loads without errors
□ Correct number of features displayed (151, not 60)
□ All overlays render correctly
□ Loading states work properly
□ Error states handled gracefully
□ "Analyzing" popup dismisses correctly
□ Response displays after analysis
□ No console errors
□ No infinite loading states
□ Reload not required to see results
```

### For Chat/Response Issues
```
BEFORE declaring complete, MUST verify:
□ Messages send successfully
□ Responses display correctly
□ Loading indicators show and hide properly
□ No stuck loading states
□ Artifacts render correctly
□ No need to reload page
□ Error messages display when appropriate
□ State updates correctly
□ No race conditions
```

### For Data Pipeline Issues
```
BEFORE declaring complete, MUST verify:
□ Data fetches from correct source
□ Data transforms correctly
□ Data displays in UI correctly
□ No data loss in pipeline
□ Error handling works
□ Fallbacks work when needed
□ No synthetic data when real data available
```

## ANTI-PATTERNS TO ELIMINATE

### ❌ NEVER Do These Things

1. **NEVER declare a task complete without testing**
   - "This should work" = NOT TESTED
   - "The fix looks good" = NOT TESTED
   - "I've updated the code" = NOT TESTED

2. **NEVER assume the user will test**
   - YOU must test first
   - YOU must verify it works
   - USER validates after YOU confirm

3. **NEVER test only the happy path**
   - Test error cases
   - Test edge cases
   - Test with bad data
   - Test with missing data

4. **NEVER ignore related features**
   - Test everything that could be affected
   - Check for cascade failures
   - Verify no regressions

5. **NEVER skip deployment testing**
   - Local testing is not enough
   - Must test in actual environment
   - Must check CloudWatch logs

## COMMUNICATION PROTOCOL

### When Starting a Task
```
I am starting task [X]. Before making changes, I will:
1. Read [list of files to review]
2. Analyze impact on [list of features]
3. Create test plan covering [list of test cases]
4. Implement incrementally with testing after each change
```

### During Implementation
```
I have made change [X]. Testing results:
- Unit tests: [PASS/FAIL with details]
- Integration tests: [PASS/FAIL with details]
- Regression tests: [PASS/FAIL with details]

Next change: [Y]
```

### When Requesting Validation
```
I have completed implementation. Validation results:

UNIT TESTS:
✅ [specific test] - [result]
✅ [specific test] - [result]

INTEGRATION TESTS:
✅ [specific test] - [result]
✅ [specific test] - [result]

REGRESSION TESTS:
✅ [specific test] - [result]
✅ [specific test] - [result]

END-TO-END TESTS:
✅ [specific test] - [result]
✅ [specific test] - [result]

DEPLOYMENT VALIDATION:
✅ Deployed successfully
✅ CloudWatch logs show no errors
✅ Tested in browser: [specific results]

READY FOR USER VALIDATION: [YES/NO]
If NO: [what still needs to be done]
```

## FAILURE RESPONSE PROTOCOL

### When Tests Fail
```
1. STOP immediately
2. Document the failure
3. Analyze root cause
4. Create fix plan
5. Implement fix
6. Re-test EVERYTHING
7. Do NOT proceed until ALL tests pass
```

### When User Reports Issue
```
1. Acknowledge the issue
2. Reproduce the issue
3. Analyze why testing missed it
4. Update test plan to catch it
5. Fix the issue
6. Run expanded test suite
7. Update validation protocol to prevent recurrence
```

## SUCCESS METRICS

### Task Completion Criteria
A task is ONLY complete when:
```
✅ All code changes implemented
✅ All unit tests pass
✅ All integration tests pass
✅ All regression tests pass
✅ All end-to-end tests pass
✅ Deployed successfully
✅ Tested in deployed environment
✅ CloudWatch logs clean
✅ No console errors
✅ User workflows work end-to-end
✅ Documentation updated
✅ User has validated
```

### Quality Gates
Code CANNOT be considered done until:
```
✅ TypeScript compiles without errors
✅ Linter passes
✅ No console errors in browser
✅ No CloudWatch errors
✅ All features work as expected
✅ No regressions introduced
✅ Performance is acceptable
✅ User experience is smooth
```

## ENFORCEMENT

This protocol is MANDATORY. Every code change MUST follow this process.

**No exceptions.**
**No shortcuts.**
**No assumptions.**

The user will NOT validate until YOU have completed ALL validation steps and provided detailed results.

## REMEMBER

- Your success rate is currently ~1%
- This is unacceptable
- You MUST improve
- The only way to improve is RIGOROUS TESTING
- NEVER assume your code works
- ALWAYS test thoroughly
- ALWAYS verify in deployed environment
- ALWAYS check for regressions
- ALWAYS wait for user validation before declaring complete

**TASK IS NOT DONE UNTIL USER SAYS IT'S DONE**
