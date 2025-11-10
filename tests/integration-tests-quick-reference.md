# OSDU Query Builder Integration Tests - Quick Reference

## Running the Tests

### Run All Integration Tests
```bash
npm test -- tests/test-osdu-query-builder-integration.test.ts
```

### Run Specific Test Suite
```bash
npm test -- tests/test-osdu-query-builder-integration.test.ts -t "Template to Execution Workflow"
```

### Run with Coverage
```bash
npm test -- tests/test-osdu-query-builder-integration.test.ts --coverage
```

### Watch Mode (for development)
```bash
npm test -- tests/test-osdu-query-builder-integration.test.ts --watch
```

## Test Organization

### Test File Structure
```
tests/test-osdu-query-builder-integration.test.ts
├── Template to Execution Workflow (1 test)
├── Build from Scratch Workflow (1 test)
├── History Reload and Modify Workflow (1 test)
├── Autocomplete Integration (1 test)
├── Validation Integration (3 tests)
├── Complex Query Building (1 test)
├── Analytics Integration (1 test)
├── Error Handling Integration (1 test)
├── Multi-Step Query Refinement (1 test)
├── Template Customization and Saving (1 test)
├── Query Execution and Result Display Integration (3 tests)
├── Query History Storage and Retrieval Integration (5 tests)
├── Complete User Workflow Simulation (3 tests)
└── Component Integration (3 tests)
```

## What Each Test Suite Validates

### 1. Template to Execution Workflow
**Purpose**: Validates the complete workflow from template selection to query execution

**Tests**:
- Template selection
- Criteria modification
- Query generation
- Query execution
- History storage

**Example**:
```typescript
// User selects "Wells by Operator" template
// User sets operator to "Shell"
// User executes query
// Query is saved to history
```

### 2. Build from Scratch Workflow
**Purpose**: Validates building queries without using templates

**Tests**:
- Adding first criterion
- Adding second criterion
- Query validation
- Query execution
- History storage

**Example**:
```typescript
// User adds operator criterion: Shell
// User adds depth criterion: > 3000
// User executes query
```

### 3. History Reload and Modify Workflow
**Purpose**: Validates loading queries from history and modifying them

**Tests**:
- Creating and saving initial query
- Retrieving from history
- Modifying criteria
- Generating new query
- Saving modified query

**Example**:
```typescript
// User creates query for Shell
// User saves to history
// User reloads query
// User changes operator to BP
// User executes modified query
```

### 4. Autocomplete Integration
**Purpose**: Validates autocomplete integration with query building

**Tests**:
- Getting autocomplete values
- Filtering autocomplete values
- Using autocomplete value in query

**Example**:
```typescript
// User types "shell" in operator field
// Autocomplete suggests "Shell"
// User selects "Shell"
// Query includes "Shell"
```

### 5. Validation Integration
**Purpose**: Validates query validation before execution

**Tests**:
- Invalid query detection (empty value)
- Valid query detection
- BETWEEN operator validation
- IN operator validation
- Range validation

**Example**:
```typescript
// User enters empty value → validation fails
// User enters "Shell" → validation passes
// User enters "1000, 5000" for BETWEEN → validation passes
```

### 6. Complex Query Building
**Purpose**: Validates building complex queries with multiple operators

**Tests**:
- Multiple criteria
- Different operators (IN, BETWEEN, LIKE, NOT IN)
- AND/OR logic
- Query generation

**Example**:
```typescript
// data.operator IN ("Shell", "BP")
// AND data.depth BETWEEN 2000 AND 4000
// OR data.wellName LIKE "North*"
// AND data.status NOT IN ("Abandoned")
```

### 7. Analytics Integration
**Purpose**: Validates analytics tracking during query execution

**Tests**:
- Query execution tracking
- Metrics collection
- Timestamp recording
- Success/failure tracking

**Example**:
```typescript
// User executes query
// Analytics records:
//   - Query text
//   - Execution time
//   - Result count
//   - Success status
```

### 8. Error Handling Integration
**Purpose**: Validates graceful error handling

**Tests**:
- Query execution errors
- Error structure validation
- Error message display
- Error analytics tracking

**Example**:
```typescript
// OSDU API connection fails
// Error is caught and structured
// User sees: "Query execution failed: OSDU API connection failed"
```

### 9. Multi-Step Query Refinement
**Purpose**: Validates iterative query refinement workflow

**Tests**:
- Initial broad query
- First refinement
- Second refinement
- History tracking of refinements

**Example**:
```typescript
// Query 1: operator = Shell → 100 results (too many)
// Query 2: + country = Norway → 50 results (better)
// Query 3: + depth > 3000 → 15 results (perfect)
```

### 10. Template Customization and Saving
**Purpose**: Validates customizing and saving templates

**Tests**:
- Loading existing template
- Customizing criteria
- Template validation
- Saving custom template

**Example**:
```typescript
// User loads "Wells by Operator" template
// User adds country and depth criteria
// User saves as "Deep Wells in North Sea"
```

### 11. Query Execution and Result Display Integration
**Purpose**: Validates query execution and result formatting

**Tests**:
- Query execution
- Result formatting for display
- Error handling
- Metrics tracking

**Example**:
```typescript
// User executes query
// OSDU returns 2 wells
// Results formatted for UI display
// Each well has: name, operator, location, coordinates
```

### 12. Query History Storage and Retrieval Integration
**Purpose**: Validates query history functionality

**Tests**:
- Saving queries to history
- Retrieving queries from history
- Searching history
- 20-item limit enforcement
- Deleting queries

**Example**:
```typescript
// User executes 5 queries
// All 5 saved to history
// User searches for "Shell"
// Finds 2 matching queries
// User deletes one query
```

### 13. Complete User Workflow Simulation
**Purpose**: Validates complete real-world user workflows

**Tests**:
- Full workflow: open → template → modify → execute → history
- Error workflow: build → validate → fix → execute
- Complex refinement workflow

**Example**:
```typescript
// User opens query builder
// User selects template
// User modifies criteria
// User executes query
// Query saved to history
// User can reload later
```

### 14. Component Integration
**Purpose**: Validates integration between components

**Tests**:
- Query generator ↔ Template system
- Autocomplete ↔ Query building
- Validation ↔ Query generation

**Example**:
```typescript
// Template provides criteria structure
// Query generator creates OSDU query
// Validation checks query syntax
// All components work together
```

## Expected Test Results

### All Tests Passing
```
Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
Snapshots:   0 total
Time:        ~1.5s
```

### Test Execution Time
- **Total**: ~1.5 seconds
- **Average per test**: ~60ms
- **Fastest test**: ~1ms
- **Slowest test**: ~450ms (async operations)

## Troubleshooting

### Tests Failing
1. **Check localStorage**: Some tests depend on localStorage working correctly
2. **Clear test cache**: `npm test -- --clearCache`
3. **Check dependencies**: Ensure all required modules are installed
4. **Check imports**: Verify all imports are correct

### Slow Tests
1. **Check async operations**: Some tests may be waiting for timeouts
2. **Check console logs**: Excessive logging can slow tests
3. **Run specific test**: Isolate slow test to identify issue

### localStorage Issues
- Tests are designed to work around localStorage limitations in test environment
- If tests fail due to localStorage, check jest.setup.ts for proper mocking

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run Integration Tests
  run: npm test -- tests/test-osdu-query-builder-integration.test.ts
```

### Pre-commit Hook
```bash
#!/bin/sh
npm test -- tests/test-osdu-query-builder-integration.test.ts
```

## Related Documentation

- **Unit Tests**: `tests/unit/test-osdu-query-builder-unit.test.ts`
- **Manual Testing Guide**: `tests/osdu-query-builder-manual-testing-guide.md`
- **Implementation Summary**: `tests/TASK_14_2_INTEGRATION_TESTS_COMPLETE.md`
- **Requirements**: `.kiro/specs/osdu-visual-query-builder/requirements.md`
- **Design**: `.kiro/specs/osdu-visual-query-builder/design.md`

## Quick Commands

```bash
# Run all tests
npm test

# Run integration tests only
npm test -- tests/test-osdu-query-builder-integration.test.ts

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- -t "should complete full workflow"

# Watch mode
npm test -- --watch

# Update snapshots (if any)
npm test -- -u
```

## Test Maintenance

### Adding New Tests
1. Add test to appropriate describe block
2. Follow existing test patterns
3. Ensure test is isolated (clears state)
4. Add descriptive test name
5. Document what the test validates

### Updating Tests
1. Update test when requirements change
2. Ensure backward compatibility
3. Update documentation
4. Run full test suite to verify no regressions

### Removing Tests
1. Document why test is being removed
2. Ensure functionality is still tested elsewhere
3. Update test count in documentation

---

**Last Updated**: 2025-01-15  
**Test Count**: 26 integration tests  
**Status**: All passing ✅
