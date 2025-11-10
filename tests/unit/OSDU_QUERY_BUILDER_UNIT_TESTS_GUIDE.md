# OSDU Query Builder Unit Tests - Quick Reference

## Running the Tests

### Run all unit tests
```bash
npm test tests/unit/test-osdu-query-builder-unit.test.ts
```

### Run with coverage
```bash
npm test -- --coverage tests/unit/test-osdu-query-builder-unit.test.ts
```

### Run specific test suite
```bash
npm test -- -t "Query Generation"
```

### Run in watch mode (for development)
```bash
npm test -- --watch tests/unit/test-osdu-query-builder-unit.test.ts
```

## Test Structure

### 12 Test Suites, 61 Tests Total

1. **String Escaping** (3 tests)
   - Special character handling
   - Multiple special characters
   - Empty strings

2. **Value Formatting** (15 tests)
   - String, number, and date formatting
   - Operator-specific formatting (LIKE, IN, BETWEEN)
   - Error handling for invalid values

3. **Criterion Generation** (5 tests)
   - All operator types
   - Field type handling
   - Query string generation

4. **Complete Query Generation** (6 tests)
   - Single and multiple criteria
   - AND/OR logic
   - Mixed logic with parentheses

5. **Formatted Query** (2 tests)
   - Multi-line formatting
   - Placeholder handling

6. **Query Validation** (5 tests)
   - Syntax validation
   - Quote and parentheses matching
   - Operator detection

7. **Query Optimization** (4 tests)
   - Parentheses removal
   - Query simplification

8. **Template Retrieval** (8 tests)
   - Get by ID, category, data type
   - Search functionality
   - Non-existent template handling

9. **Template Validation** (5 tests)
   - Complete template validation
   - Missing field detection
   - Invalid structure detection

10. **Custom Templates** (5 tests)
    - CRUD operations
    - LocalStorage integration
    - Error handling

11. **Field Type Validation** (3 tests)
    - String, number, date validation
    - Type-specific rules

12. **Complex Query Scenarios** (3 tests)
    - All operator types
    - NOT operators
    - Production-ready examples

## Key Test Examples

### Testing Query Generation
```typescript
const criteria: QueryCriterion[] = [{
  id: '1',
  field: 'data.operator',
  fieldType: 'string',
  operator: '=',
  value: 'Shell',
  logic: 'AND',
  isValid: true
}];

const query = generateOSDUQuery(criteria);
// Expected: 'data.operator = "Shell"'
```

### Testing Validation
```typescript
const query = 'data.operator = "Shell" AND data.country = "Norway"';
const result = validateQuerySyntax(query);
// Expected: { isValid: true, errors: [] }
```

### Testing Templates
```typescript
const template = getTemplateById('wells-by-operator');
// Expected: Template object with criteria
```

## Coverage Areas

✅ **Query Generation**
- All operators (=, !=, >, <, >=, <=, LIKE, IN, BETWEEN)
- All field types (string, number, date)
- AND/OR logic combinations
- Parentheses grouping

✅ **Validation**
- Empty values
- Data type validation
- Operator-specific rules
- Syntax validation

✅ **Templates**
- Built-in templates
- Custom templates
- Template search
- Template validation

✅ **Edge Cases**
- Special characters
- Invalid values
- Empty criteria
- Malformed queries

## Debugging Failed Tests

### Check test output
```bash
npm test tests/unit/test-osdu-query-builder-unit.test.ts 2>&1 | less
```

### Run single test
```bash
npm test -- -t "should generate simple equality criterion"
```

### Enable verbose output
```bash
npm test -- --verbose tests/unit/test-osdu-query-builder-unit.test.ts
```

## Common Issues

### LocalStorage not defined
Tests mock localStorage for browser environment testing. If you see localStorage errors, check the beforeEach setup in the test file.

### Import path errors
Ensure the import paths match your project structure:
```typescript
import { generateOSDUQuery } from '@/utils/osduQueryGenerator';
```

### Type errors
The tests use TypeScript. Run type checking:
```bash
npx tsc --noEmit tests/unit/test-osdu-query-builder-unit.test.ts
```

## Test Maintenance

### Adding new tests
1. Add test to appropriate describe block
2. Follow existing test patterns
3. Use descriptive test names
4. Include edge cases

### Updating tests
1. Run tests before changes
2. Update test expectations
3. Run tests after changes
4. Verify all tests pass

### Test naming convention
```typescript
test('should [expected behavior] when [condition]', () => {
  // Arrange
  const input = ...;
  
  // Act
  const result = ...;
  
  // Assert
  expect(result).toBe(...);
});
```

## Performance

Current test execution time: **~0.6 seconds**

All 61 tests run quickly, making them suitable for:
- Pre-commit hooks
- CI/CD pipelines
- Development workflow
- Regression testing

## Next Steps

After unit tests pass:
1. Run integration tests (Task 14.2)
2. Perform manual testing (Task 14.3)
3. Deploy to staging
4. User acceptance testing
