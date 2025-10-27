# Task 19: Deploy and Test Deletion Operations - Complete Guide

## Overview

This guide provides comprehensive instructions for deploying and testing deletion operations for the renewable project lifecycle management system.

**Task:** Deploy and test deletion operations  
**Requirements:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7  
**Status:** In Progress

---

## Requirements Summary

### Requirement 2.1: Confirmation Prompt
- System must ask for confirmation before deleting
- User must type 'yes' to confirm
- Cancellation must work correctly

### Requirement 2.2: Project Existence Validation
- System must validate project exists before deletion
- Clear error message for non-existent projects

### Requirement 2.3: S3 Deletion
- Project data must be removed from S3
- All artifacts must be deleted
- No orphaned files left behind

### Requirement 2.4: Session Context Update
- Active project must be cleared if deleted
- Session context must be updated correctly

### Requirement 2.5: Cache Invalidation
- Resolver cache must be cleared after deletion
- Deleted projects must not be found in cache

### Requirement 2.6: Bulk Deletion
- Pattern matching must work correctly
- Confirmation required for bulk operations
- Partial failures handled gracefully

### Requirement 2.7: In-Progress Protection
- Cannot delete projects currently being processed
- Clear error message when deletion blocked

---

## Prerequisites

### 1. Environment Setup
```bash
# Ensure AWS CLI is configured
aws configure list

# Ensure sandbox is running
npx ampx sandbox

# Verify deployment
aws lambda list-functions | grep renewableOrchestrator
```

### 2. Test Data Preparation
Create test projects for deletion testing:
```bash
# In chat interface, create test projects:
# - "test-deletion-1" at coordinates 35.0, -101.0
# - "test-deletion-2" at coordinates 35.1, -101.1
# - "test-bulk-1" at coordinates 35.2, -101.2
# - "test-bulk-2" at coordinates 35.3, -101.3
# - "test-bulk-3" at coordinates 35.4, -101.4
```

---

## Deployment Steps

### Step 1: Verify Code is Deployed

```bash
# Run deployment verification script
chmod +x tests/deploy-and-test-deletion.sh
./tests/deploy-and-test-deletion.sh
```

This script will:
- ✅ Check Lambda deployment
- ✅ Run unit tests
- ✅ Run integration tests
- ✅ Test deployed Lambda
- ✅ Check CloudWatch logs

### Step 2: Run Automated E2E Tests

```bash
# Set environment variable for orchestrator function
export ORCHESTRATOR_FUNCTION_NAME=$(aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" \
  --output text | head -n 1)

# Run E2E tests
npx ts-node tests/e2e-test-deletion-flow.ts
```

Expected output:
```
═══════════════════════════════════════════════════════════════════════════════
E2E DELETION OPERATIONS TEST SUITE - TASK 19
═══════════════════════════════════════════════════════════════════════════════

🎯 Testing function: amplify-digitalassistant-renewableOrchestrator-...

📋 Test 1: Confirmation prompt (Requirement 2.1)
────────────────────────────────────────────────────────────────────────────────
✅ PASS: Confirmation prompt displayed

📋 Test 2: Non-existent project validation (Requirement 2.2)
────────────────────────────────────────────────────────────────────────────────
✅ PASS: Non-existent project handled correctly

[... more tests ...]

═══════════════════════════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════════════════════════

Total Tests: 5
Passed: 5 ✅
Failed: 0 ❌
Success Rate: 100.0%
```

### Step 3: Run Manual UI Tests

Follow the comprehensive manual testing guide:

```bash
# Open the manual test guide
cat tests/e2e-deletion-manual-test.md
```

Complete all 10 test scenarios in the manual guide.

---

## Testing Checklist

### Automated Tests
- [ ] Unit tests pass (test-delete-project.test.ts)
- [ ] Integration tests pass (test-delete-project-integration.test.ts)
- [ ] Bulk deletion tests pass (test-bulk-delete.test.ts)
- [ ] E2E Lambda tests pass (e2e-test-deletion-flow.ts)
- [ ] Deployment script completes successfully

### Manual UI Tests
- [ ] Scenario 1: Single deletion with confirmation
- [ ] Scenario 2: Non-existent project
- [ ] Scenario 3: Delete active project
- [ ] Scenario 4: In-progress project
- [ ] Scenario 5: Bulk deletion
- [ ] Scenario 6: S3 verification
- [ ] Scenario 7: Partial failures
- [ ] Scenario 8: Cache invalidation
- [ ] Scenario 9: Natural language
- [ ] Scenario 10: Error recovery

### Requirements Validation
- [ ] 2.1: Confirmation prompt works
- [ ] 2.2: Existence validation works
- [ ] 2.3: S3 deletion verified
- [ ] 2.4: Session context updated
- [ ] 2.5: Cache invalidated
- [ ] 2.6: Bulk deletion works
- [ ] 2.7: In-progress protection works

---

## Verification Commands

### Check Lambda Deployment
```bash
# Get orchestrator function name
ORCHESTRATOR=$(aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" \
  --output text | head -n 1)

echo "Orchestrator: $ORCHESTRATOR"

# Check function configuration
aws lambda get-function-configuration \
  --function-name "$ORCHESTRATOR" \
  --query '{Name:FunctionName,Runtime:Runtime,Memory:MemorySize,Timeout:Timeout}' \
  --output table
```

### Check S3 Bucket
```bash
# List renewable projects
aws s3 ls s3://$(aws s3 ls | grep amplify | awk '{print $3}' | head -n 1)/renewable/projects/

# Check specific project
aws s3 ls s3://$(aws s3 ls | grep amplify | awk '{print $3}' | head -n 1)/renewable/projects/test-deletion-1/ --recursive
```

### Check CloudWatch Logs
```bash
# Tail recent logs
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 10m --follow

# Search for errors
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 1h | grep -i error
```

---

## Troubleshooting

### Issue: Confirmation not working

**Symptoms:**
- Deletion happens without confirmation
- No confirmation prompt displayed

**Solution:**
1. Check orchestrator intent detection
2. Verify ProjectLifecycleManager.deleteProject() is called with correct parameters
3. Check logs for confirmation flow

```bash
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 5m | grep -i "confirmation\|delete"
```

### Issue: S3 files not deleted

**Symptoms:**
- Project marked as deleted but files remain in S3
- S3 errors in logs

**Solution:**
1. Check IAM permissions for Lambda
2. Verify S3 bucket name is correct
3. Check ProjectStore.delete() implementation

```bash
# Check Lambda IAM role
aws lambda get-function --function-name "$ORCHESTRATOR" \
  --query 'Configuration.Role' --output text

# Check S3 permissions
aws iam get-role-policy --role-name [role-name] --policy-name [policy-name]
```

### Issue: Session context not updating

**Symptoms:**
- Deleted project still shows as active
- Session context errors in logs

**Solution:**
1. Check SessionContextManager implementation
2. Verify session ID is passed correctly
3. Check DynamoDB permissions

```bash
# Check recent session updates
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 5m | grep -i "session\|context"
```

### Issue: Bulk deletion not working

**Symptoms:**
- Pattern matching fails
- No projects found for bulk deletion

**Solution:**
1. Check pattern matching logic in ProjectLifecycleManager
2. Verify project listing works
3. Test pattern matching separately

```bash
# Test project listing
aws lambda invoke \
  --function-name "$ORCHESTRATOR" \
  --payload '{"chatSessionId":"test","userMessage":"list all projects","userId":"test"}' \
  /tmp/list-response.json

cat /tmp/list-response.json | jq
```

---

## Success Criteria

Task 19 is complete when:

✅ **All automated tests pass**
- Unit tests: 100% pass rate
- Integration tests: 100% pass rate
- E2E tests: 100% pass rate

✅ **All manual scenarios pass**
- 10/10 scenarios completed successfully
- No critical issues found

✅ **All requirements validated**
- Requirements 2.1-2.7 all working correctly
- No regressions in existing functionality

✅ **Production ready**
- No errors in CloudWatch logs
- S3 deletion verified
- Session management working
- Cache invalidation working

---

## Next Steps

After Task 19 is complete:

1. **Mark task as complete** in tasks.md
2. **Document any issues** found during testing
3. **Update regression tests** if needed
4. **Move to Task 20:** Deploy and test rename operations

---

## Quick Reference

### Run All Tests
```bash
# Automated tests
./tests/deploy-and-test-deletion.sh

# E2E tests
export ORCHESTRATOR_FUNCTION_NAME=$(aws lambda list-functions \
  --query "Functions[?contains(FunctionName, 'renewableOrchestrator')].FunctionName" \
  --output text | head -n 1)
npx ts-node tests/e2e-test-deletion-flow.ts

# Manual tests
# Follow: tests/e2e-deletion-manual-test.md
```

### Check Status
```bash
# Lambda status
aws lambda get-function --function-name "$ORCHESTRATOR" \
  --query 'Configuration.State' --output text

# Recent logs
aws logs tail "/aws/lambda/$ORCHESTRATOR" --since 5m

# S3 projects
aws s3 ls s3://[bucket]/renewable/projects/
```

### Clean Up Test Data
```bash
# Delete test projects via chat interface:
# "delete all projects matching test-"
# Confirm: "yes"
```

---

## Sign-Off

**Developer:** ___________________  
**Date:** ___________________  
**All Tests Passed:** ⬜ YES  ⬜ NO  
**Production Ready:** ⬜ YES  ⬜ NO  

**Task 19 Status:** ⬜ COMPLETE  ⬜ NEEDS FIXES

**Notes:**
```
[Add any additional notes or observations]
```
