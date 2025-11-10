/**
 * Test Advanced Query Features (Task 10)
 * 
 * Tests wildcard support, range inputs, and multi-value selection
 */

const { generateOSDUQuery, formatQueryValue } = require('../src/utils/osduQueryGenerator');

console.log('🧪 Testing Advanced Query Features\n');

// Test 1: Wildcard Support (Task 10.1)
console.log('Test 1: Wildcard Support');
console.log('========================');

const wildcardCriteria = [
  {
    id: '1',
    field: 'data.operator',
    fieldType: 'string',
    operator: 'LIKE',
    value: 'Sh*ll',  // Should match Shell, Shall, etc.
    logic: 'AND'
  }
];

try {
  const wildcardQuery = generateOSDUQuery(wildcardCriteria);
  console.log('✓ Wildcard query generated:', wildcardQuery);
  console.log('  Expected: data.operator LIKE "Sh%ll"');
  console.log('  Match:', wildcardQuery.includes('Sh%ll') ? '✓' : '✗');
} catch (error) {
  console.error('✗ Wildcard test failed:', error.message);
}

console.log('\n');

// Test 2: Range Inputs (Task 10.2)
console.log('Test 2: Range Inputs (BETWEEN operator)');
console.log('========================================');

const rangeCriteria = [
  {
    id: '1',
    field: 'data.depth',
    fieldType: 'number',
    operator: 'BETWEEN',
    value: '1000, 5000',  // Min and max values
    logic: 'AND'
  }
];

try {
  const rangeQuery = generateOSDUQuery(rangeCriteria);
  console.log('✓ Range query generated:', rangeQuery);
  console.log('  Expected: data.depth BETWEEN 1000 AND 5000');
  console.log('  Match:', rangeQuery.includes('BETWEEN 1000 AND 5000') ? '✓' : '✗');
} catch (error) {
  console.error('✗ Range test failed:', error.message);
}

console.log('\n');

// Test 3: Multi-Value Selection (Task 10.3)
console.log('Test 3: Multi-Value Selection (IN operator)');
console.log('============================================');

const multiValueCriteria = [
  {
    id: '1',
    field: 'data.operator',
    fieldType: 'string',
    operator: 'IN',
    value: 'Shell, BP, Equinor',  // Multiple values
    logic: 'AND'
  }
];

try {
  const multiValueQuery = generateOSDUQuery(multiValueCriteria);
  console.log('✓ Multi-value query generated:', multiValueQuery);
  console.log('  Expected: data.operator IN ("Shell", "BP", "Equinor")');
  console.log('  Match:', multiValueQuery.includes('IN (') && multiValueQuery.includes('Shell') ? '✓' : '✗');
} catch (error) {
  console.error('✗ Multi-value test failed:', error.message);
}

console.log('\n');

// Test 4: NOT IN operator (Task 10.3)
console.log('Test 4: NOT IN operator');
console.log('=======================');

const notInCriteria = [
  {
    id: '1',
    field: 'data.status',
    fieldType: 'string',
    operator: 'NOT IN',
    value: 'Abandoned, Plugged',
    logic: 'AND'
  }
];

try {
  const notInQuery = generateOSDUQuery(notInCriteria);
  console.log('✓ NOT IN query generated:', notInQuery);
  console.log('  Expected: data.status NOT IN ("Abandoned", "Plugged")');
  console.log('  Match:', notInQuery.includes('NOT IN') ? '✓' : '✗');
} catch (error) {
  console.error('✗ NOT IN test failed:', error.message);
}

console.log('\n');

// Test 5: NOT LIKE operator (Task 10.3)
console.log('Test 5: NOT LIKE operator');
console.log('=========================');

const notLikeCriteria = [
  {
    id: '1',
    field: 'data.wellName',
    fieldType: 'string',
    operator: 'NOT LIKE',
    value: 'Test*',
    logic: 'AND'
  }
];

try {
  const notLikeQuery = generateOSDUQuery(notLikeCriteria);
  console.log('✓ NOT LIKE query generated:', notLikeQuery);
  console.log('  Expected: data.wellName NOT LIKE "Test%"');
  console.log('  Match:', notLikeQuery.includes('NOT LIKE') ? '✓' : '✗');
} catch (error) {
  console.error('✗ NOT LIKE test failed:', error.message);
}

console.log('\n');

// Test 6: Complex query with all features
console.log('Test 6: Complex Query with All Features');
console.log('========================================');

const complexCriteria = [
  {
    id: '1',
    field: 'data.operator',
    fieldType: 'string',
    operator: 'IN',
    value: 'Shell, BP',
    logic: 'AND'
  },
  {
    id: '2',
    field: 'data.depth',
    fieldType: 'number',
    operator: 'BETWEEN',
    value: '2000, 4000',
    logic: 'AND'
  },
  {
    id: '3',
    field: 'data.wellName',
    fieldType: 'string',
    operator: 'LIKE',
    value: '*-A',  // Ends with -A
    logic: 'OR'
  },
  {
    id: '4',
    field: 'data.status',
    fieldType: 'string',
    operator: 'NOT IN',
    value: 'Abandoned',
    logic: 'AND'
  }
];

try {
  const complexQuery = generateOSDUQuery(complexCriteria);
  console.log('✓ Complex query generated:');
  console.log(complexQuery);
  console.log('\n  Features used:');
  console.log('  - IN operator:', complexQuery.includes('IN (') ? '✓' : '✗');
  console.log('  - BETWEEN operator:', complexQuery.includes('BETWEEN') ? '✓' : '✗');
  console.log('  - Wildcard support:', complexQuery.includes('%') ? '✓' : '✗');
  console.log('  - NOT IN operator:', complexQuery.includes('NOT IN') ? '✓' : '✗');
  console.log('  - AND/OR logic:', complexQuery.includes('AND') && complexQuery.includes('OR') ? '✓' : '✗');
} catch (error) {
  console.error('✗ Complex query test failed:', error.message);
}

console.log('\n');
console.log('========================================');
console.log('✅ All advanced query features tested!');
console.log('========================================');
