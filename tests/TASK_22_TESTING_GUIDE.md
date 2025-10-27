# Task 22: Deploy and Test Merge Operations - Testing Guide

**Requirements:** 4.2, 4.3, 4.4  
**Status:** Ready for Testing

## Quick Start

### Automated Testing

Run the complete deployment and testing script:

```bash
./tests/deploy-and-test-merge.sh
```

This script will:
1. Check prerequisites
2. Install dependencies
3. Compile TypeScript
4. Run unit tests
5. Check deployment status
6. Run E2E tests
7. Provide manual testing instructions

### Manual Testing Only

If you want to skip automated tests and go straight to manual testing:

```bash
# Open the manual testing guide
cat tests/e2e-merge-manual-test.md
```

Then follow the step-by-step instructions in your browser.

## What This Task Tests

### Requirement 4.2: Project Merging
- Merge two projects into one
- Delete source project after merge
- Preserve all data from both projects

### Requirement 4.3: Data Combination Logic
- Keep most complete data from both projects
- Merge metadata from both projects
- Handle projects with different completion levels
- Preserve all artifacts (terrain, layout, simulation, report)

### Requirement 4.4: Name Selection
- User can choose which project name to keep
- System validates keepName is one of the two project names
- Correct project is deleted based on name selection

## Test Scenarios

### 1. Basic Merge (Requirement 4.2, 4.3)
**What:** Merge two projects with complementary data  
**Expected:** Merged project has data from both, source deleted

### 2. Name Selection (Requirement 4.4)
**What:** Merge projects keeping source name  
**Expected:** Source name kept, target deleted

### 3. Different Completion Levels (Requirement 4.3)
**What:** Merge 25% complete with 75% complete project  
**Expected:** Merge succeeds, all data preserved

### 4. Error Handling
**What:** Merge non-existent projects  
**Expected:** Proper error message

### 5. Invalid Name Selection (Requirement 4.4)
**What:** Merge with invalid keepName  
**Expected:** MERGE_CONFLICT error

### 6. Metadata Merging (Requirement 4.3)
**What:** Merge projects with different metadata  
**Expected:** All metadata preserved

## Files Created for This Task

### Test Files
- `tests/e2e-test-merge-flow.ts` - Automated E2E tests
- `tests/e2e-merge-manual-test.md` - Manual testing guide
- `tests/deploy-and-test-merge.sh` - Deployment and testing script
- `tests/TASK_22_TESTING_GUIDE.md` - This file

### Existing Test Files
- `tests/unit/test-merge-projects.test.ts` - Unit tests (already exists)
- `tests/integration/test-merge-projects-integration.test.ts` - Integration tests (already exists)

## Running Individual Tests

### Unit Tests Only
```bash
npm test -- tests/unit/test-merge-projects.test.ts --run
```

### E2E Tests Only
```bash
export RENEWABLE_S3_BUCKET=your-bucket-name
npx ts-node tests/e2e-test-merge-flow.ts
```

### Integration Tests Only
```bash
npm test -- tests/integration/test-merge-projects-integration.test.ts --run
```

## Verification Checklist

Before marking task 22 as complete, verify:

- [ ] **Unit tests pass** - All merge logic tests pass
- [ ] **E2E tests pass** - All automated E2E scenarios pass
- [ ] **Manual tests pass** - All manual test scenarios verified
- [ ] **Data combination works** - Merged project has all data from both
- [ ] **Name selection works** - User can choose which name to keep
- [ ] **Deletion works** - Source project deleted after merge
- [ ] **Different completion levels** - Merge works with 25%, 50%, 75%, 100% complete
- [ ] **Error handling works** - Proper errors for invalid operations
- [ ] **Cache invalidation works** - Resolver cache cleared after merge
- [ ] **Metadata merging works** - All metadata preserved

## Expected Test Results

### Unit Tests
- ✓ 10 tests should pass
- ✓ All requirements (4.2, 4.3, 4.4) covered
- ✓ Error cases handled

### E2E Tests
- ✓ 6 automated tests should pass
- ✓ Test projects created and cleaned up
- ✓ Real S3 operations verified

### Manual Tests
- ✓ 7 manual scenarios verified
- ✓ UI behavior confirmed
- ✓ User experience validated

## Troubleshooting

### Issue: E2E tests fail with "RENEWABLE_S3_BUCKET not set"
**Solution:**
```bash
export RENEWABLE_S3_BUCKET=$(node -e "console.log(require('./amplify_outputs.json').storage.bucket_name)")
```

### Issue: Unit tests fail with module not found
**Solution:**
```bash
npm install
npx tsc --noEmit
```

### Issue: Cannot access S3 bucket
**Solution:**
```bash
aws sts get-caller-identity  # Verify AWS credentials
aws s3 ls s3://your-bucket-name  # Verify bucket access
```

### Issue: Merge fails in deployed environment
**Solution:**
1. Check CloudWatch logs for orchestrator Lambda
2. Verify ProjectLifecycleManager is deployed
3. Check IAM permissions for S3 operations

## Success Criteria

Task 22 is complete when:

1. ✅ All unit tests pass
2. ✅ All E2E tests pass
3. ✅ All manual test scenarios verified
4. ✅ Requirements 4.2, 4.3, 4.4 fully tested
5. ✅ No regressions in existing functionality
6. ✅ Documentation updated

## Next Steps

After completing task 22:

1. Mark task 22 as complete in `tasks.md`:
   ```markdown
   - [x] 22. Deploy and test merge operations
   ```

2. Update task status:
   ```bash
   # Mark as complete
   git add .kiro/specs/renewable-project-lifecycle-management/tasks.md
   git commit -m "Complete task 22: Deploy and test merge operations"
   ```

3. Proceed to task 23:
   ```markdown
   - [ ] 23. Deploy and test archive functionality
   ```

## Additional Resources

- **Requirements:** `.kiro/specs/renewable-project-lifecycle-management/requirements.md`
- **Design:** `.kiro/specs/renewable-project-lifecycle-management/design.md`
- **Implementation:** `amplify/functions/shared/projectLifecycleManager.ts`
- **Unit Tests:** `tests/unit/test-merge-projects.test.ts`
- **Integration Tests:** `tests/integration/test-merge-projects-integration.test.ts`

## Contact

If you encounter issues or have questions:

1. Check CloudWatch logs for Lambda errors
2. Review the implementation in `projectLifecycleManager.ts`
3. Verify S3 permissions and bucket access
4. Check that all dependencies are installed

## Summary

Task 22 provides comprehensive testing for project merge operations, covering:
- Data combination from multiple projects
- User-controlled name selection
- Projects at different completion levels
- Error handling and validation
- Cache management

All tests are automated where possible, with clear manual testing instructions for UI verification.
