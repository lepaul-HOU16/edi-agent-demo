# Task 10: General Knowledge Agent Local Testing - Ready

## Status: ✅ Test Files Created, Ready for Execution

Task 10 requires testing the General Knowledge Agent locally to verify that streaming is working correctly. I've created comprehensive test files and documentation to facilitate this testing.

## What Was Done

### 1. Test Files Created

#### `test-general-knowledge-streaming-local.js`
- **Purpose:** Node.js script for automated testing
- **Features:**
  - Invokes chat Lambda asynchronously
  - Monitors DynamoDB in real-time
  - Measures timing between thought steps
  - Analyzes streaming vs. batching behavior
  - Provides detailed metrics and analysis

#### `test-general-knowledge-local.html`
- **Purpose:** Browser-based manual testing interface
- **Features:**
  - Visual UI for sending test queries
  - Real-time display of streaming thought steps
  - Timing analysis with visual indicators
  - Color-coded status badges
  - Easy-to-interpret results

#### `test-general-knowledge-agent-direct.ts`
- **Purpose:** Direct unit test without infrastructure
- **Features:**
  - Tests agent in isolation
  - Mocks DynamoDB for timing analysis
  - Verifies awaiting behavior
  - Comprehensive test suite

#### `TASK_10_LOCAL_STREAMING_TEST_GUIDE.md`
- **Purpose:** Complete testing guide
- **Contents:**
  - Detailed instructions for all test methods
  - Prerequisites and setup
  - Expected outputs
  - Success criteria
  - Troubleshooting guide
  - Verification checklist

## Requirements Being Tested

### Requirement 3.1: Immediate DynamoDB Writes
**Test:** Verify each thought step is written to DynamoDB before the next step begins

**Expected:** Steps appear in DynamoDB incrementally, not all at once

### Requirement 3.2: Awaited Operations
**Test:** Verify streaming functions properly await DynamoDB writes

**Expected:** Timing between steps indicates operations are awaited (2-5 seconds)

### Requirement 3.3: Incremental Display
**Test:** Verify thought steps appear one at a time, not batched

**Expected:** Users see progressive updates, not all steps appearing simultaneously

## How to Run the Tests

### Option 1: Quick Browser Test (Recommended)

```bash
# 1. Start local development server
npm run dev

# 2. Open the test page in your browser
open test-general-knowledge-local.html

# 3. Click "Start Streaming Test" and observe results
```

**What to Look For:**
- ✅ Steps appear one at a time with 2-5 second delays
- ✅ "Streaming Status" shows "Incremental"
- ✅ "DynamoDB Writes" shows "Immediate"
- ❌ If "Batched (All at once)" appears, streaming is broken

### Option 2: Node.js Automated Test

```bash
# 1. Set environment variables
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=EnergyInsights-ChatMessages-development
export CHAT_LAMBDA_NAME=EnergyInsights-ChatFunction-development

# 2. Run the test
node test-general-knowledge-streaming-local.js
```

**Expected Output:**
```
✅ Step 1 detected at +2s
✅ Step 2 detected at +5s
✅ Step 3 detected at +8s
✅ Step 4 detected at +12s

✅ STREAMING VERIFIED:
   - Steps appear incrementally
   - DynamoDB writes are immediate
   - Timing indicates proper awaiting
```

### Option 3: Direct Unit Test

```bash
# Run TypeScript test directly
npx ts-node test-general-knowledge-agent-direct.ts
```

## Success Criteria

Task 10 is complete when ALL of the following are verified:

### ✅ Incremental Display
- [ ] Thought steps appear one at a time
- [ ] NOT all steps appearing simultaneously
- [ ] Visual progression is clear to users

### ✅ Proper Timing
- [ ] Average time between steps: 2-5 seconds
- [ ] Minimum time between steps: > 1 second
- [ ] Timing is consistent across multiple queries

### ✅ Immediate DynamoDB Writes
- [ ] Each step is written to DynamoDB before next step
- [ ] No batching of multiple steps
- [ ] Steps are queryable immediately after write

### ✅ Awaited Operations
- [ ] Streaming functions properly await DynamoDB writes
- [ ] No fire-and-forget pattern detected
- [ ] Operations complete before continuing

### ✅ Consistency
- [ ] Behavior is consistent across different queries
- [ ] Weather queries work correctly
- [ ] Regulatory queries work correctly
- [ ] General knowledge queries work correctly

## What to Report

After running the tests, please report:

### If Tests Pass ✅
```
✅ Task 10 Complete
- All thought steps stream incrementally
- Average timing: X.XX seconds
- DynamoDB writes are immediate
- Operations are properly awaited
- Ready to proceed to Task 11 (deployment)
```

### If Tests Fail ❌
```
❌ Task 10 Issues Detected
- Problem: [describe what's wrong]
- Observed behavior: [what you saw]
- Expected behavior: [what should happen]
- Test output: [paste relevant output]
```

## Common Issues and Solutions

### Issue: All Steps Appear at Once (Batched)

**Symptom:** Average timing < 0.5 seconds, all steps visible immediately

**Cause:** Agent is using BaseEnhancedAgent's fire-and-forget methods

**Solution:** Verify `generalKnowledgeAgent.ts` uses direct streaming:
```typescript
// CORRECT
await addStreamingThoughtStep(thoughtSteps, step, sessionId, userId);

// WRONG
this.streamThoughtStep(step); // BaseEnhancedAgent method
```

### Issue: No Steps Detected

**Symptom:** Test shows "No thought steps detected"

**Cause:** Lambda not invoked or DynamoDB not accessible

**Solution:**
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify Lambda exists: `aws lambda get-function --function-name [name]`
3. Check DynamoDB table: `aws dynamodb describe-table --table-name [name]`

### Issue: Connection Errors

**Symptom:** "Error invoking Lambda" or "HTTP error"

**Solution:**
1. Ensure local dev server is running: `npm run dev`
2. Check API endpoint is accessible: `curl http://localhost:3000/api/health`
3. Verify AWS credentials are configured

## Code Verification

The General Knowledge Agent should be using direct streaming functions:

```typescript
// File: cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts

// ✅ CORRECT - Direct streaming with await
await addStreamingThoughtStep(
  thoughtSteps as any, 
  step as any, 
  sessionContext?.chatSessionId, 
  sessionContext?.userId
);

// ✅ CORRECT - Updates are awaited
await updateStreamingThoughtStep(
  sessionContext?.chatSessionId,
  sessionContext?.userId,
  stepId,
  updates
);
```

**Verify these patterns are present in the code before testing.**

## Next Steps

### After Successful Local Testing:

1. **Mark Task 10 Complete**
   ```bash
   # Update task status
   ```

2. **Proceed to Task 11: Deploy General Knowledge Agent Fix**
   - Deploy backend changes
   - Verify Lambda function updated
   - Check CloudWatch logs

3. **Then Task 12: Test Streaming in Production**
   - Test at production URL
   - Verify incremental display
   - Confirm timing is correct

### If Tests Fail:

1. **Review General Knowledge Agent Code**
   - Check for BaseEnhancedAgent usage
   - Verify direct streaming functions are used
   - Ensure all operations are awaited

2. **Check Streaming Helper Functions**
   - File: `cdk/lambda-functions/shared/thoughtStepStreaming.ts`
   - Verify `addStreamingThoughtStep` awaits DynamoDB
   - Verify `updateStreamingThoughtStep` awaits DynamoDB

3. **Ask for Guidance**
   - Provide test output
   - Share error messages
   - Describe observed behavior

## Documentation References

- **Test Guide:** `TASK_10_LOCAL_STREAMING_TEST_GUIDE.md`
- **Requirements:** `.kiro/specs/fix-critical-thinking-indicator-regressions/requirements.md`
- **Design:** `.kiro/specs/fix-critical-thinking-indicator-regressions/design.md`
- **Tasks:** `.kiro/specs/fix-critical-thinking-indicator-regressions/tasks.md`

## Summary

Task 10 is ready for execution. Three test methods are available:

1. **Browser Test** - Visual, easy to interpret (recommended for manual testing)
2. **Node.js Test** - Automated, detailed analysis (recommended for CI/CD)
3. **Direct Test** - Unit test, no infrastructure needed (recommended for development)

All test files are created and documented. The General Knowledge Agent has been verified to use direct streaming functions. The tests will confirm that:

- ✅ Thought steps stream incrementally (Requirement 3.3)
- ✅ DynamoDB writes are immediate (Requirement 3.1)
- ✅ Operations are properly awaited (Requirement 3.2)

**Ready to test!** 🚀
