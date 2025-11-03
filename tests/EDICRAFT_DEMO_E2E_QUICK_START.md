# EDIcraft Demo E2E Tests - Quick Start Guide

## Quick Test Commands

### Run All E2E Tests
```bash
./tests/e2e/run-edicraft-demo-e2e-tests.sh
```

### Run Individual Test Suites
```bash
# Complete workflow tests
npm test -- tests/e2e/test-edicraft-demo-complete-workflow.e2e.test.ts

# Multi-canvas tests
npm test -- tests/e2e/test-edicraft-demo-multi-canvas.e2e.test.ts

# Response formatting tests
npm test -- tests/e2e/test-edicraft-demo-response-formatting.e2e.test.ts

# Clear button tests
npm test -- tests/e2e/test-edicraft-demo-clear-button.e2e.test.ts
```

### Run All E2E Tests (npm)
```bash
npm test -- tests/e2e/
```

## Test Summary

| Test Suite | Test Cases | Description |
|------------|------------|-------------|
| Complete Workflow | 4 | Full demo from collection to visualization |
| Multi-Canvas | 10 | Collection context retention across canvases |
| Response Formatting | 15 | Cloudscape template usage and consistency |
| Clear Button | 12 | Clear button UI and workflow |
| **Total** | **41** | **Complete E2E coverage** |

## What's Tested

### ✅ Complete Demo Workflow
- Create collection with 24 wells
- Create canvas from collection
- Visualize all wells
- Verify rigs and markers
- Clear environment
- Reset demo
- Handle failures gracefully
- Verify no duplicates

### ✅ Multi-Canvas Workflow
- Create canvas from collection
- Inherit collection context
- Verify same collection scope
- Display collection badge
- Handle fromSession parameter
- List canvases by collection
- Handle standard canvases

### ✅ Response Formatting
- Cloudscape template usage
- Visual indicators (✅, ❌, ⏳, ⚠️, 💡, 🎮)
- Consistent formatting
- Section headers
- List formatting
- Error responses with suggestions
- Progress responses with percentages
- Batch summaries with counts

### ✅ Clear Button Workflow
- Build and clear workflow
- Loading states
- Multiple clicks
- Error handling
- Command messages
- Visibility rules
- Rapid clicks
- State management

## Expected Results

All tests should pass:
```
Test Suites: 4 passed, 4 total
Tests:       41 passed, 41 total
```

## Troubleshooting

### Tests Fail
1. Check dependencies: `npm install`
2. Check Node version: `node --version` (should be 18+)
3. Run with verbose output: `npm test -- tests/e2e/ --verbose`

### Timeout Errors
Increase timeout: `npm test -- tests/e2e/ --testTimeout=20000`

### Mock Errors
Clear Jest cache: `npm test -- --clearCache`

## CI/CD Integration

Add to your pipeline:
```yaml
- name: Run E2E Tests
  run: |
    chmod +x tests/e2e/run-edicraft-demo-e2e-tests.sh
    ./tests/e2e/run-edicraft-demo-e2e-tests.sh
```

## Related Documentation

- [Complete E2E Test Documentation](./EDICRAFT_DEMO_E2E_TESTS.md)
- [Integration Tests](./EDICRAFT_DEMO_INTEGRATION_TESTS.md)
- [EDIcraft Demo Enhancements Spec](./.kiro/specs/edicraft-demo-enhancements/)

## Success Criteria

✅ All 41 test cases pass
✅ No test failures or errors
✅ All workflows complete successfully
✅ All assertions pass
✅ No console errors

## Next Steps

After E2E tests pass:
1. Run integration tests
2. Run unit tests
3. Deploy to staging
4. Run manual validation
5. Deploy to production
