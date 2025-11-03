# Task 6: Manual Testing and Validation - READY FOR EXECUTION

## Status: ✅ Test Infrastructure Complete - Ready for Manual Validation

## Overview

Task 6 manual testing infrastructure has been created and is ready for execution. This task validates the terrain query routing fix through comprehensive manual testing.

## What Was Created

### 1. Automated Test Script ✅

**File:** `tests/manual/test-terrain-routing-manual.js`

**Features:**
- Automated testing of all Task 6 scenarios
- CloudWatch log verification
- Detailed pass/fail reporting
- Color-coded output for easy reading
- Comprehensive validation checks

**Usage:**
```bash
node tests/manual/test-terrain-routing-manual.js
```

**Tests Included:**
- ✅ Task 6.1: Problematic query routing
- ✅ Task 6.2: Legitimate project list queries
- ✅ Task 6.3: No regressions in renewable queries

---

### 2. Manual Testing Guide ✅

**File:** `tests/manual/TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md`

**Contents:**
- Step-by-step testing instructions
- Expected results for each test
- CloudWatch log verification steps
- Common issues and solutions
- Success criteria checklist
- Deployment checklist

**Perfect for:**
- User validation
- Manual verification
- Troubleshooting
- Documentation

---

## Test Scenarios

### Task 6.1: Test Problematic Query

**Query:** `Analyze terrain at coordinates 35.067482, -101.395466 in Texas`

**Validates:**
- ✅ Routes to terrain analysis (NOT project list)
- ✅ Generates terrain artifacts
- ✅ CloudWatch logs show rejection of project list pattern
- ✅ Action verb safety check works

**Requirements:** 1.1, 1.2, 1.3

---

### Task 6.2: Test Legitimate Project List Queries

**Queries:**
1. `list my renewable projects`
2. `show my projects`

**Validates:**
- ✅ Routes to project list handler
- ✅ Returns project list (not artifacts)
- ✅ CloudWatch logs show pattern match
- ✅ No false negatives

**Requirements:** 1.3, 3.2

---

### Task 6.3: Verify No Regressions

**Queries:**
1. `analyze terrain at 40.7128, -74.0060` (terrain)
2. `optimize layout for my wind farm` (layout)
3. `run wake simulation` (simulation)
4. `generate comprehensive report` (report)
5. `show project test-project-123` (project details)

**Validates:**
- ✅ All renewable queries work correctly
- ✅ No incorrect routing to project list
- ✅ Correct artifact generation
- ✅ No breaking changes

**Requirements:** 3.3, 3.4

---

## How to Execute Tests

### Option 1: Automated Testing (Recommended)

```bash
# Run automated test script
node tests/manual/test-terrain-routing-manual.js
```

**Advantages:**
- Tests all scenarios automatically
- Verifies CloudWatch logs
- Provides detailed pass/fail report
- Fast execution (~30-60 seconds)

**Output:**
- ✅ Green checkmarks for passing tests
- ❌ Red X marks for failing tests
- Detailed verification results
- Final summary with deployment readiness

---

### Option 2: Manual Testing

```bash
# Follow the manual testing guide
cat tests/manual/TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md
```

**Advantages:**
- User can see actual UI behavior
- Validates end-to-end user experience
- Catches UI-specific issues
- Builds confidence in fix

**Steps:**
1. Open chat interface
2. Select Renewables Agent
3. Submit each test query
4. Verify expected results
5. Check CloudWatch logs
6. Document results

---

## Prerequisites

Before running tests:

1. **Sandbox Running:**
   ```bash
   npx ampx sandbox
   ```

2. **Environment Variables Set:**
   - `RENEWABLE_ORCHESTRATOR_FUNCTION_NAME`
   - Or script will auto-detect

3. **AWS Credentials Configured:**
   - For CloudWatch log access
   - For Lambda invocation

4. **Latest Code Deployed:**
   - Pattern fixes in `projectListHandler.ts`
   - Orchestrator routing logic updated

---

## Expected Results

### All Tests Pass ✅

When all tests pass, you'll see:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                        ✅ ALL TESTS PASSED ✅                              ║
║                                                                            ║
║  The terrain query routing fix is working correctly!                      ║
║  - Terrain queries route to terrain analysis                              ║
║  - Project list queries route to project list                             ║
║  - No regressions in other renewable queries                              ║
║                                                                            ║
║  Ready for deployment! ✅                                                  ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**Next Steps:**
1. Mark Task 6 complete
2. Proceed to Task 7 (Deploy and monitor)
3. Monitor production for routing issues

---

### Some Tests Fail ❌

When tests fail, you'll see:

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║                        ❌ TESTS FAILED ❌                                  ║
║                                                                            ║
║  Some tests did not pass. Please review the results above.                ║
║                                                                            ║
║  Action Required:                                                          ║
║  1. Review failed test details                                             ║
║  2. Check CloudWatch logs for pattern matching                            ║
║  3. Verify pattern fixes in projectListHandler.ts                         ║
║  4. Re-run tests after fixes                                               ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

**Action Required:**
1. Review failed test details
2. Check CloudWatch logs
3. Verify pattern fixes deployed
4. Fix issues
5. Re-run tests

---

## CloudWatch Log Verification

### What to Look For

**Successful Rejection (Task 6.1):**
```
[ProjectListHandler] Testing query: Analyze terrain at coordinates 35.067482, -101.395466 in Texas
[ProjectListHandler] ❌ Rejected: Query contains action verb
```

**Successful Match (Task 6.2):**
```
[ProjectListHandler] Testing query: list my renewable projects
[ProjectListHandler] ✅ Matched pattern 1: \blist\b.*\bmy\b.*\bprojects?\b
```

**No Match (Task 6.3 - Terrain):**
```
[ProjectListHandler] Testing query: analyze terrain at 40.7128, -74.0060
[ProjectListHandler] ❌ Rejected: Query contains action verb
```

### How to Access Logs

1. **AWS Console:**
   - CloudWatch → Log Groups
   - `/aws/lambda/amplify-digitalassistant-renewableOrchestrator`
   - Filter: `[ProjectListHandler]`

2. **CLI:**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/amplify-digitalassistant-renewableOrchestrator \
     --filter-pattern "[ProjectListHandler]" \
     --start-time $(date -u -d '5 minutes ago' +%s)000
   ```

---

## Troubleshooting

### Issue: Tests Can't Find Lambda Function

**Error:** `Function not found`

**Solution:**
```bash
# List Lambda functions
aws lambda list-functions | grep renewableOrchestrator

# Set environment variable
export RENEWABLE_ORCHESTRATOR_FUNCTION_NAME="<function-name>"

# Re-run tests
node tests/manual/test-terrain-routing-manual.js
```

---

### Issue: CloudWatch Logs Not Showing

**Error:** `Could not fetch CloudWatch logs`

**Solution:**
1. Verify AWS credentials configured
2. Check IAM permissions for CloudWatch Logs
3. Verify log group name
4. Check time range (last 15 minutes)

---

### Issue: Query Still Routes to Project List

**Symptom:** Terrain query shows project list

**Solution:**
1. Verify sandbox running latest code
2. Restart sandbox: `npx ampx sandbox`
3. Check pattern fixes deployed
4. Review CloudWatch logs for pattern matching

---

## Success Criteria

Task 6 is complete when:

- [x] Automated test script created
- [x] Manual testing guide created
- [ ] All automated tests pass
- [ ] Manual validation confirms fix works
- [ ] CloudWatch logs show correct routing
- [ ] No regressions detected
- [ ] User validates fix
- [ ] Ready for Task 7 (deployment)

---

## Next Steps

### Immediate Actions:

1. **Run Automated Tests:**
   ```bash
   node tests/manual/test-terrain-routing-manual.js
   ```

2. **Review Results:**
   - Check pass/fail status
   - Review CloudWatch logs
   - Verify routing decisions

3. **Manual Validation:**
   - Follow manual testing guide
   - Test in actual UI
   - Verify user experience

4. **Document Results:**
   - Update task status
   - Note any issues found
   - Prepare for deployment

### After Tests Pass:

1. **Mark Task 6 Complete:**
   - Update tasks.md
   - Document validation results

2. **Proceed to Task 7:**
   - Deploy to sandbox
   - Monitor CloudWatch logs
   - Validate with real queries

3. **Production Deployment:**
   - Deploy to production
   - Monitor for issues
   - Validate fix in production

---

## Files Created

```
tests/manual/
├── test-terrain-routing-manual.js          # Automated test script
├── TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md    # Manual testing guide
└── TASK_6_MANUAL_TESTING_READY.md          # This file
```

---

## Validation Checklist

Before marking Task 6 complete:

- [ ] Automated test script runs successfully
- [ ] All automated tests pass
- [ ] Manual testing guide followed
- [ ] User validates fix works
- [ ] CloudWatch logs show correct routing
- [ ] No false positives detected
- [ ] No false negatives detected
- [ ] No regressions in other queries
- [ ] Ready for deployment

---

## Summary

✅ **Task 6 test infrastructure is complete and ready for execution.**

**What's Ready:**
- Automated test script with comprehensive validation
- Manual testing guide with step-by-step instructions
- CloudWatch log verification procedures
- Troubleshooting documentation
- Success criteria checklist

**What's Next:**
1. Run automated tests
2. Perform manual validation
3. Review CloudWatch logs
4. Document results
5. Mark Task 6 complete
6. Proceed to Task 7 (deployment)

**Estimated Time:**
- Automated tests: 1-2 minutes
- Manual validation: 5-10 minutes
- Total: ~15 minutes

---

## Ready to Execute! 🚀

Run the automated tests now:

```bash
node tests/manual/test-terrain-routing-manual.js
```

Or follow the manual testing guide:

```bash
cat tests/manual/TERRAIN_ROUTING_MANUAL_TEST_GUIDE.md
```

**The fix is ready for validation!** ✅
