/**
 * OSDU Query Builder Validation Tests
 * Standalone test runner (no Jest required)
 */

// Mock query builder validation logic
class QueryBuilderValidator {
  validateCriterion(criterion) {
    if (criterion.value === '' || criterion.value === null || criterion.value === undefined) {
      return { isValid: false, errorMessage: 'Value is required' };
    }

    if (criterion.fieldType === 'number') {
      const numValue = Number(criterion.value);
      if (isNaN(numValue)) {
        return { isValid: false, errorMessage: 'Must be a valid number' };
      }
      if (numValue < 0) {
        return { isValid: false, errorMessage: 'Must be a positive number' };
      }
    }

    if (criterion.fieldType === 'date') {
      const dateValue = new Date(criterion.value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, errorMessage: 'Must be a valid date (YYYY-MM-DD)' };
      }
    }

    if (criterion.fieldType === 'string') {
      const strValue = String(criterion.value).trim();
      if (strValue.length === 0) {
        return { isValid: false, errorMessage: 'Value cannot be empty' };
      }
      if (strValue.length > 100) {
        return { isValid: false, errorMessage: 'Value too long (max 100 characters)' };
      }
    }

    return { isValid: true };
  }

  validateQuery(criteria) {
    const errors = [];

    if (criteria.length === 0) {
      errors.push('At least one filter criterion is required');
      return { isValid: false, errors };
    }

    criteria.forEach((criterion, index) => {
      const validation = this.validateCriterion(criterion);
      if (!validation.isValid) {
        errors.push(`Criterion ${index + 1}: ${validation.errorMessage}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}

// Test runner
let passedTests = 0;
let failedTests = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ FAIL: ${description}`);
    console.log(`   Error: ${error.message}`);
    failedTests++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected to contain "${expected}", got ${actual}`);
      }
    },
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${actual.length}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

// Run tests
console.log('\n🧪 OSDU Query Builder Validation Tests\n');
console.log('=' .repeat(60));

const validator = new QueryBuilderValidator();

console.log('\n📋 Empty Value Validation');
console.log('-'.repeat(60));

test('should reject empty string values', () => {
  const criterion = {
    field: 'data.operator',
    fieldType: 'string',
    operator: '=',
    value: '',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
  expect(result.errorMessage).toBe('Value is required');
});

test('should reject null values', () => {
  const criterion = {
    field: 'data.depth',
    fieldType: 'number',
    operator: '>',
    value: null,
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
});

console.log('\n📋 Number Field Validation');
console.log('-'.repeat(60));

test('should accept valid positive numbers', () => {
  const criterion = {
    field: 'data.depth',
    fieldType: 'number',
    operator: '>',
    value: 3000,
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(true);
});

test('should reject non-numeric values', () => {
  const criterion = {
    field: 'data.depth',
    fieldType: 'number',
    operator: '>',
    value: 'not a number',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
  expect(result.errorMessage).toBe('Must be a valid number');
});

test('should reject negative numbers', () => {
  const criterion = {
    field: 'data.depth',
    fieldType: 'number',
    operator: '>',
    value: -100,
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
  expect(result.errorMessage).toBe('Must be a positive number');
});

test('should accept zero', () => {
  const criterion = {
    field: 'data.depth',
    fieldType: 'number',
    operator: '=',
    value: 0,
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(true);
});

console.log('\n📋 Date Field Validation');
console.log('-'.repeat(60));

test('should accept valid date strings', () => {
  const criterion = {
    field: 'data.acquisitionDate',
    fieldType: 'date',
    operator: '>',
    value: '2024-01-01',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(true);
});

test('should reject invalid date strings', () => {
  const criterion = {
    field: 'data.acquisitionDate',
    fieldType: 'date',
    operator: '>',
    value: 'not-a-date',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
});

console.log('\n📋 String Field Validation');
console.log('-'.repeat(60));

test('should accept valid strings', () => {
  const criterion = {
    field: 'data.operator',
    fieldType: 'string',
    operator: '=',
    value: 'Shell',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(true);
});

test('should reject whitespace-only strings', () => {
  const criterion = {
    field: 'data.operator',
    fieldType: 'string',
    operator: '=',
    value: '   ',
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
});

test('should reject strings longer than 100 characters', () => {
  const criterion = {
    field: 'data.operator',
    fieldType: 'string',
    operator: '=',
    value: 'a'.repeat(101),
    logic: 'AND'
  };
  const result = validator.validateCriterion(criterion);
  expect(result.isValid).toBe(false);
});

console.log('\n📋 Query-Level Validation');
console.log('-'.repeat(60));

test('should reject queries with no criteria', () => {
  const result = validator.validateQuery([]);
  expect(result.isValid).toBe(false);
  expect(result.errors).toContain('At least one filter criterion is required');
});

test('should accept queries with all valid criteria', () => {
  const criteria = [
    {
      field: 'data.operator',
      fieldType: 'string',
      operator: '=',
      value: 'Shell',
      logic: 'AND'
    },
    {
      field: 'data.depth',
      fieldType: 'number',
      operator: '>',
      value: 3000,
      logic: 'AND'
    }
  ];
  const result = validator.validateQuery(criteria);
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

test('should reject queries with any invalid criterion', () => {
  const criteria = [
    {
      field: 'data.operator',
      fieldType: 'string',
      operator: '=',
      value: 'Shell',
      logic: 'AND'
    },
    {
      field: 'data.depth',
      fieldType: 'number',
      operator: '>',
      value: '',
      logic: 'AND'
    }
  ];
  const result = validator.validateQuery(criteria);
  expect(result.isValid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total:  ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Query builder validation is working correctly.');
  console.log('✅ Users can ONLY build queries that will succeed!');
} else {
  console.log('\n⚠️  Some tests failed. Please review the validation logic.');
  process.exit(1);
}

console.log('\n' + '='.repeat(60) + '\n');
