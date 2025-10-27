# Task 21 Testing Guide

**Quick guide for testing search functionality**

---

## Quick Start

### Run All Tests (Recommended)
```bash
./tests/deploy-and-test-search.sh
```

This automated script will:
1. Check sandbox status
2. Run unit tests
3. Run integration tests
4. Run verification script
5. Guide through manual E2E tests

---

## Individual Test Commands

### 1. Unit Tests
```bash
npm test -- tests/unit/test-search-projects.test.ts
```

**Expected Output:**
```
Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Time:        ~0.6s
```

**What It Tests:**
- Location filtering (4 tests)
- Date range filtering (4 tests)
- Incomplete filtering (3 tests)
- Coordinate proximity (4 tests)
- Archived status (3 tests)
- Combined filters (6 tests)
- Edge cases (5 tests)
- Performance (1 test)

---

### 2. Integration Tests
```bash
npm test -- tests/integration/test-search-projects-integration.test.ts
```

**What It Tests:**
- Real ProjectStore integration
- Real-world search scenarios
- Search result quality
- Performance with real data
- Error handling
- Data consistency

---

### 3. Verification Script
```bash
npx ts-node tests/verify-search-projects.ts
```

**What It Tests:**
- All 5 requirements (5.1-5.5)
- Combined filter scenarios
- Edge cases
- Performance benchmarks
- Comprehensive validation

**Expected Output:**
```
✅ Tests Passed: X
❌ Tests Failed: 0
📊 Total Tests: X
🎯 Success Rate: 100%
```

---

### 4. E2E Manual Tests

Follow the guide in:
```
tests/e2e-search-manual-test.md
```

**Test Scenarios:**
1. Location name filtering
2. Date range filtering
3. Incomplete project filtering
4. Coordinate proximity filtering
5. Archived status filtering
6. Combined filters

---

## Test by Requirement

### Requirement 5.1: Location Filtering

**Unit Test:**
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Location Name Filtering"
```

**Manual Test:**
```
Query: "list projects in texas"
Expected: Shows only Texas projects
```

---

### Requirement 5.2: Date Range Filtering

**Unit Test:**
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Date Range Filtering"
```

**Manual Test:**
```
Query: "list projects created today"
Expected: Shows only today's projects
```

---

### Requirement 5.3: Incomplete Filtering

**Unit Test:**
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Incomplete Project Filtering"
```

**Manual Test:**
```
Query: "list incomplete projects"
Expected: Shows only incomplete projects
```

---

### Requirement 5.4: Coordinate Proximity

**Unit Test:**
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Coordinate Proximity Filtering"
```

**Manual Test:**
```
Query: "list projects at coordinates 35.067482, -101.395466"
Expected: Shows nearby projects
```

---

### Requirement 5.5: Archived Status

**Unit Test:**
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Archived Status Filtering"
```

**Manual Test:**
```
Query: "list archived projects"
Expected: Shows only archived projects
```

---

## Troubleshooting

### Tests Fail: "Cannot find module"
**Solution:**
```bash
npm install
```

### Tests Fail: "Sandbox not running"
**Solution:**
```bash
# In another terminal:
npx ampx sandbox
```

### Tests Timeout
**Solution:**
```bash
# Increase timeout in jest.config.js
testTimeout: 30000
```

### Integration Tests Fail: "S3 error"
**Solution:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket exists
aws s3 ls s3://your-bucket-name/renewable/projects/
```

---

## Performance Testing

### Test with Large Dataset
```bash
npm test -- tests/unit/test-search-projects.test.ts -t "Performance"
```

**Expected:**
- 1000 projects: < 2ms
- No timeouts
- No memory issues

---

## Continuous Integration

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
- name: Run Search Tests
  run: |
    npm test -- tests/unit/test-search-projects.test.ts
    npm test -- tests/integration/test-search-projects-integration.test.ts
    npx ts-node tests/verify-search-projects.ts
```

---

## Test Coverage

### Check Coverage
```bash
npm test -- tests/unit/test-search-projects.test.ts --coverage
```

**Expected Coverage:**
- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

---

## Quick Validation Checklist

Before marking task complete:

- [ ] All unit tests pass (30/30)
- [ ] Integration tests pass
- [ ] Verification script passes
- [ ] Manual E2E tests completed
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Documentation complete

---

## Related Files

- **Unit Tests:** `tests/unit/test-search-projects.test.ts`
- **Integration Tests:** `tests/integration/test-search-projects-integration.test.ts`
- **Verification:** `tests/verify-search-projects.ts`
- **E2E Guide:** `tests/e2e-search-manual-test.md`
- **Quick Reference:** `tests/SEARCH_PROJECTS_QUICK_REFERENCE.md`
- **Completion Summary:** `tests/TASK_21_COMPLETE_SUMMARY.md`
- **Validation Summary:** `tests/TASK_21_VALIDATION_SUMMARY.md`

---

## Support

If tests fail or you need help:

1. Check the error message
2. Review the test file
3. Check CloudWatch logs
4. Verify sandbox is running
5. Check AWS credentials
6. Review documentation

---

**Last Updated:** January 2025  
**Status:** ✅ All tests passing

