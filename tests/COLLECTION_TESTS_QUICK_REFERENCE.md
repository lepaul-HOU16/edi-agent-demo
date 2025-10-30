# Collection System Tests - Quick Reference

## Run All Collection Tests (73 tests)

```bash
npm test -- tests/unit/test-collection-pagination.test.ts tests/integration/test-collection-creation-flow.test.ts tests/e2e/test-collection-complete-workflow.e2e.test.ts
```

**Expected Output:**
```
Test Suites: 3 passed, 3 total
Tests:       73 passed, 73 total
Time:        ~1s
```

## Run Individual Test Suites

### Unit Tests - Pagination (32 tests)
```bash
npm test -- tests/unit/test-collection-pagination.test.ts --verbose
```

**Tests:**
- Page calculation with various item counts
- Boundary conditions
- Page reset on filter change
- State preservation
- Canvas pagination (25 per page)
- Requirements verification

### Integration Tests - Creation Flow (24 tests)
```bash
npm test -- tests/integration/test-collection-creation-flow.test.ts --verbose
```

**Tests:**
- Collection creation from catalog
- Navigation to detail page
- Canvas creation with collection context
- Data context inheritance
- Collection list refresh
- Modal state management

### E2E Tests - Complete Workflow (17 tests)
```bash
npm test -- tests/e2e/test-collection-complete-workflow.e2e.test.ts --verbose
```

**Tests:**
- Complete user workflow (catalog → collection → canvas → AI query)
- Data context limits and approval flow
- Pagination across all views
- Responsive behavior
- Error handling

## Test Coverage Summary

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Unit Tests | 32 | Pagination logic, calculations, state management |
| Integration Tests | 24 | Creation flow, navigation, data context |
| E2E Tests | 17 | Complete workflow, approval flow, responsive |
| **Total** | **73** | **100% of requirements** |

## Requirements Coverage

✅ **3.1** - Display 10 collections per page  
✅ **3.2** - Provide pagination controls  
✅ **3.4** - Display 25 canvases per page  
✅ **3.5** - Provide pagination for canvases  
✅ **1.1** - Display modal on prompt  
✅ **1.5** - Navigate to detail page  
✅ **4.1** - Link canvas to collection  
✅ **4.2** - Limit agent data access  
✅ **5.5** - Inherit collection context  

## Quick Test Commands

### Run with coverage
```bash
npm test -- tests/unit/test-collection-pagination.test.ts --coverage
```

### Run in watch mode (for development)
```bash
npm test -- tests/unit/test-collection-pagination.test.ts --watch
```

### Run specific test
```bash
npm test -- tests/unit/test-collection-pagination.test.ts -t "should calculate correct pages"
```

## Test Files Location

```
tests/
├── unit/
│   └── test-collection-pagination.test.ts (NEW - 32 tests)
├── integration/
│   └── test-collection-creation-flow.test.ts (NEW - 24 tests)
└── e2e/
    └── test-collection-complete-workflow.e2e.test.ts (NEW - 17 tests)
```

## Continuous Integration

Add to CI pipeline:
```yaml
- name: Run Collection Tests
  run: npm test -- tests/unit/test-collection-pagination.test.ts tests/integration/test-collection-creation-flow.test.ts tests/e2e/test-collection-complete-workflow.e2e.test.ts
```

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
npm install
```

### Tests timeout
Increase timeout in jest.config.js:
```javascript
testTimeout: 10000
```

### Mock issues
Clear Jest cache:
```bash
npm test -- --clearCache
```

## Next Steps

After tests pass:
1. ✅ Review test coverage report
2. ✅ Run manual testing for visual verification
3. ✅ Test on actual devices for responsive behavior
4. ✅ Performance test with large datasets
5. ✅ Deploy to staging environment
