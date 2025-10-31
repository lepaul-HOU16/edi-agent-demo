# EDIcraft Demo Tests - Quick Start Guide

## Run All Tests

```bash
./tests/integration/run-edicraft-demo-integration-tests.sh
```

## Run Individual Test Suites

### Clear Environment Tool
```bash
python3 tests/integration/test-edicraft-clear-environment.test.py
```

### Time Lock Tool
```bash
python3 tests/integration/test-edicraft-time-lock.test.py
```

### Drilling Rig Builder
```bash
python3 tests/integration/test-edicraft-drilling-rig.test.py
```

### Enhanced Wellbore Build
```bash
python3 tests/integration/test-edicraft-enhanced-wellbore.test.py
```

### S3 Data Access
```bash
python3 tests/test-s3-data-access.py
```

### Collection Visualization
```bash
python3 tests/test-collection-visualization.py
```

### Demo Reset
```bash
python3 tests/test-demo-reset.py
```

### Collection Context Retention
```bash
node tests/test-collection-context-retention.js
```

### Clear Button UI
```bash
npm test -- tests/unit/test-edicraft-clear-button.test.tsx --run
```

## Test Coverage

- **Total Tests:** 89
- **Python Tests:** 62
- **TypeScript/JavaScript Tests:** 27

## Quick Validation

Run this to verify test infrastructure:

```bash
# Check Python tests can import
python3 -c "import sys; sys.path.insert(0, 'edicraft-agent'); from tools.response_templates import CloudscapeResponseBuilder; print('✅ Python imports OK')"

# Check test runner is executable
test -x tests/integration/run-edicraft-demo-integration-tests.sh && echo "✅ Test runner is executable" || echo "❌ Test runner not executable"

# Check test files exist
ls tests/integration/test-edicraft-*.test.py | wc -l | xargs -I {} echo "✅ {} integration test files found"
```

## Expected Output

When all tests pass:

```
==========================================
EDIcraft Demo Enhancement Integration Tests
==========================================

Running Python Integration Tests...

Running: Clear Environment Tool
----------------------------------------
✅ PASSED: Clear Environment Tool

Running: Time Lock Tool
----------------------------------------
✅ PASSED: Time Lock Tool

Running: Drilling Rig Builder
----------------------------------------
✅ PASSED: Drilling Rig Builder

Running: Enhanced Wellbore Build
----------------------------------------
✅ PASSED: Enhanced Wellbore Build

Running Existing Unit Tests...

Running: S3 Data Access Layer
----------------------------------------
✅ PASSED: S3 Data Access Layer

Running: Collection Visualization
----------------------------------------
✅ PASSED: Collection Visualization

Running: Demo Reset Tool
----------------------------------------
✅ PASSED: Demo Reset Tool

Running TypeScript/JavaScript Tests...

Running: Collection Context Retention Tests
----------------------------------------
✅ PASSED: Collection Context Retention

Running: UI Component Tests
----------------------------------------
✅ PASSED: UI Component Tests

==========================================
TEST SUMMARY
==========================================

Total Tests:  9
Passed:       9
Failed:       0

🎉 All tests passed!

Integration Test Coverage:
  ✅ Clear Environment Tool
  ✅ Time Lock Tool
  ✅ Drilling Rig Builder
  ✅ Enhanced Wellbore Build
  ✅ S3 Data Access Layer
  ✅ Collection Visualization
  ✅ Demo Reset Tool
  ✅ Collection Context Retention
  ✅ UI Components
```

## Troubleshooting

### Python Import Errors

If you see import errors:

```bash
# Add edicraft-agent to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/edicraft-agent"
```

### Test Runner Not Executable

```bash
chmod +x tests/integration/run-edicraft-demo-integration-tests.sh
```

### npm Tests Fail

```bash
# Install dependencies
npm install

# Run tests with explicit config
npm test -- --config=jest.config.js tests/unit/test-edicraft-clear-button.test.tsx --run
```

## Documentation

For detailed information, see:
- [EDICRAFT_DEMO_INTEGRATION_TESTS.md](./EDICRAFT_DEMO_INTEGRATION_TESTS.md) - Full test documentation
- [TASK_13_INTEGRATION_TESTS_COMPLETE.md](./TASK_13_INTEGRATION_TESTS_COMPLETE.md) - Implementation summary
