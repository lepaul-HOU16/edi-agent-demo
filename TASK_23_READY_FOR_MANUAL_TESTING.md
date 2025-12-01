# Task 23: Ready for Manual Testing

## Status: ✅ Test Suite Created - Ready for Execution

All test tools and documentation have been created. The comprehensive regression tests are ready to be executed manually in the production environment.

---

## What Was Created

### 1. Interactive Test UI
**File:** `test-comprehensive-regression.html`

A browser-based test interface that provides:
- Visual test execution for all four agents
- Real-time test status updates
- Automated API testing
- Test result summary
- Detailed logging

**How to Use:**
```bash
open test-comprehensive-regression.html
```

Then click "Run All Tests" to execute automated checks.

### 2. Automated Test Script
**File:** `test-all-agents-regression.js`

A Node.js script that tests all agents programmatically:
- Tests streaming functionality
- Verifies cleanup operations
- Checks project context flow
- Provides colored console output

**How to Use:**
```bash
node test-all-agents-regression.js
```

**Note:** This script requires network access to the production API. It may not work from all environments.

### 3. Comprehensive Test Guide
**File:** `COMPREHENSIVE_REGRESSION_TEST_GUIDE.md`

A detailed manual testing guide that includes:
- Step-by-step instructions for each agent
- Specific test queries to use
- Checkboxes for verification
- Expected behaviors
- Pass/fail criteria
- CloudWatch and DynamoDB verification steps

### 4. Test Results Template
**File:** `TASK_23_REGRESSION_TEST_RESULTS.md`

A structured document for recording test results:
- Checkboxes for each test
- Result fields (✅/❌/⏳)
- Notes sections
- Summary statistics
- Sign-off section

---

## What Needs to Be Done

### Manual Testing Required

The following tests **MUST** be performed manually in the production environment:

#### 1. Visual Verification Tests
These cannot be automated and require human observation:

- **Single Thinking Indicator**
  - Verify only ONE indicator appears at a time
  - Check that no duplicates exist in the DOM
  - Confirm indicator is properly styled

- **Incremental Streaming**
  - Watch thought steps appear one at a time
  - Verify steps don't all appear at once (batching)
  - Confirm timing is approximately 3-5 seconds between steps

- **UI Cleanup**
  - Verify indicator disappears when response completes
  - Check that UI is clean after completion
  - Confirm no visual artifacts remain

- **Page Reload Behavior**
  - Reload page after response completes
  - Verify no stale indicators appear
  - Confirm messages load correctly

#### 2. Functional Tests
These can be partially automated but require verification:

- **Streaming Works**
  - Send queries to each agent
  - Verify thought steps are received
  - Check response quality

- **Cleanup Works**
  - Verify streaming messages are deleted
  - Check DynamoDB for stale messages
  - Review CloudWatch logs

- **Project Context (Renewables Only)**
  - Load a renewable project
  - Click workflow buttons
  - Verify context flows correctly
  - Test error handling for missing context

---

## Testing Workflow

### Step 1: Open Production Environment
```
URL: https://d2hkqpgqguj4do.cloudfront.net
```

### Step 2: Open Browser Console
- Press F12 or Cmd+Option+I (Mac)
- Go to Console tab
- Keep open to see debug logs

### Step 3: Test Each Agent

#### General Knowledge Agent
1. Send query: "What is the capital of France and what are its main attractions?"
2. Watch for incremental streaming
3. Count thinking indicators (should be 1)
4. Verify cleanup after completion
5. Reload page and check for stale indicators

#### Petrophysics Agent
1. Send query: "Analyze well data for formation evaluation and calculate porosity"
2. Verify streaming works
3. Check single indicator
4. Verify cleanup
5. Test page reload

#### Maintenance Agent
1. Send query: "Check equipment status and recommend maintenance schedule for wind turbines"
2. Verify streaming
3. Check indicator
4. Verify cleanup
5. Test reload

#### Renewables Agent
1. Load a renewable project artifact
2. Verify project context is extracted
3. Click workflow button
4. Verify streaming with project context
5. Check single indicator
6. Verify cleanup
7. Test reload
8. Test error handling (clear project and try workflow button)

### Step 4: Cross-Agent Tests

#### Multiple Agents in Same Session
1. Test General Knowledge
2. Switch to Petrophysics
3. Switch to Maintenance
4. Switch to Renewables
5. Verify no interference or accumulated indicators

#### Rapid Sequential Queries
1. Send query 1, wait for completion
2. Immediately send query 2
3. Immediately send query 3
4. Verify cleanup works for each

#### Page Reload During Streaming
1. Send query
2. Reload page mid-stream
3. Verify no broken state
4. Verify can send new queries

### Step 5: Backend Verification

#### CloudWatch Logs
```bash
# Use the search script
./search-cloudwatch-project-context.sh

# Or manually check AWS Console:
# 1. Go to CloudWatch Logs
# 2. Search log group: /aws/lambda/chat-handler
# 3. Filter for: "cleanup" OR "streaming messages"
```

Look for:
- ✅ "Cleanup: Deleted X streaming messages"
- ✅ "Project context received: { projectId: '...', projectName: '...' }"
- ✅ "Thought step written to DynamoDB"

#### DynamoDB
1. Open DynamoDB Console
2. Select chat messages table
3. Query for role='ai-stream'
4. Verify no messages older than 5 minutes

### Step 6: Document Results

Fill out `TASK_23_REGRESSION_TEST_RESULTS.md`:
- Check all checkboxes
- Update all Result fields
- Add notes for any issues
- Update summary statistics

---

## Success Criteria

### All Tests Must Pass

For task 23 to be complete, ALL of the following must be true:

#### General Knowledge Agent
- ✅ Streaming works (incremental, not batched)
- ✅ Only one thinking indicator
- ✅ Cleanup works
- ✅ No stale indicators after reload

#### Petrophysics Agent
- ✅ Streaming works
- ✅ Only one thinking indicator
- ✅ Cleanup works
- ✅ No stale indicators after reload

#### Maintenance Agent
- ✅ Streaming works
- ✅ Only one thinking indicator
- ✅ Cleanup works
- ✅ No stale indicators after reload

#### Renewables Agent
- ✅ Streaming works
- ✅ Only one thinking indicator
- ✅ Cleanup works
- ✅ No stale indicators after reload
- ✅ Project context flows correctly
- ✅ Error handling for missing context

#### Cross-Agent Tests
- ✅ No interference between agents
- ✅ Rapid queries work correctly
- ✅ Page reload during streaming is safe

#### Backend Verification
- ✅ Cleanup logs in CloudWatch
- ✅ No stale streaming messages in DynamoDB
- ✅ Project context logs show correct flow

---

## If Tests Fail

### Debugging Steps

1. **Check Browser Console**
   - Look for JavaScript errors
   - Check for failed API calls
   - Review debug logs

2. **Check CloudWatch Logs**
   - Search for errors
   - Verify cleanup is being called
   - Check project context flow

3. **Check DynamoDB**
   - Query for streaming messages
   - Check timestamps
   - Verify cleanup is working

4. **Review Recent Changes**
   - Check git history
   - Verify all fixes were deployed
   - Confirm frontend deployment completed

### Common Issues

#### Multiple Indicators
- **Cause:** ChainOfThoughtDisplay rendering ThinkingIndicator
- **Fix:** Verify ChainOfThoughtDisplay doesn't render indicator
- **File:** `src/components/ChainOfThoughtDisplay.tsx`

#### Batched Streaming
- **Cause:** BaseEnhancedAgent not awaiting DynamoDB writes
- **Fix:** Verify General Knowledge Agent uses direct streaming functions
- **File:** `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`

#### Stale Indicators
- **Cause:** Cleanup not running or failing
- **Fix:** Check cleanupStreamingMessages function
- **File:** `cdk/lambda-functions/shared/thoughtStepStreaming.ts`

#### Project Context Missing
- **Cause:** Context not flowing through request chain
- **Fix:** Check WorkflowCTAButtons, Lambda handler, agent router
- **Files:** Multiple - see project context flow documentation

---

## Next Steps

### After All Tests Pass

1. **Mark Task 23 Complete**
   ```
   Update tasks.md to mark task 23 as complete
   ```

2. **Proceed to Task 24**
   ```
   Task 24: Monitor production for 24 hours
   - Check CloudWatch logs for errors
   - Monitor for stale streaming messages
   - Monitor for duplicate indicators
   - Verify streaming performance
   ```

3. **Create Final Summary**
   ```
   Document all test results
   Create comprehensive summary report
   Note any issues or observations
   ```

### If Any Tests Fail

1. **Document the Failure**
   - What test failed?
   - What was the expected behavior?
   - What actually happened?
   - Can it be reproduced?

2. **Identify Root Cause**
   - Review relevant code
   - Check logs
   - Trace the flow

3. **Create Fix Plan**
   - What needs to be changed?
   - Which files are affected?
   - What's the risk level?

4. **Implement Fix**
   - Make code changes
   - Test locally
   - Deploy to production
   - Re-run regression tests

---

## Test Execution Checklist

Before starting tests:
- [ ] Production URL is accessible
- [ ] Browser console is open
- [ ] Test documents are ready
- [ ] AWS Console access available (for CloudWatch/DynamoDB)

During testing:
- [ ] Test each agent systematically
- [ ] Document results as you go
- [ ] Take screenshots of any issues
- [ ] Note timestamps for log correlation

After testing:
- [ ] All checkboxes filled
- [ ] All results documented
- [ ] Summary statistics updated
- [ ] Next steps identified

---

## Contact Information

If you encounter issues or have questions:
- Review the comprehensive test guide
- Check CloudWatch logs
- Review previous task completion documents
- Consult the design document for expected behavior

---

## Summary

✅ **Test suite is ready**  
✅ **Documentation is complete**  
✅ **Tools are available**  
⏳ **Manual testing required**

**Next Action:** Execute the manual tests in production environment using the provided tools and documentation.

**Estimated Time:** 30-45 minutes for complete testing

**Production URL:** https://d2hkqpgqguj4do.cloudfront.net
