/**
 * Test: OSDU Query Builder Autocomplete Integration
 * 
 * Validates that autocomplete functionality works correctly for field value inputs.
 * 
 * Requirements tested:
 * - 11.1: Autocomplete data sources defined for common fields
 * - 11.2: Real-time filtering of suggestions
 * - 11.3: Autocomplete for Operator, Country, Basin, Well types, Log types
 * - 11.4: Fallback to free-text for fields without autocomplete
 * - 11.5: Show at least 10 most common values
 */

const {
  getAutocompleteValues,
  hasAutocompleteData,
  getSuggestedValues,
  filterAutocompleteValues,
  getAllAutocompleteSources,
  isValidAutocompleteValue,
  OPERATOR_AUTOCOMPLETE,
  COUNTRY_AUTOCOMPLETE,
  BASIN_AUTOCOMPLETE,
  WELL_STATUS_AUTOCOMPLETE,
  WELL_TYPE_AUTOCOMPLETE,
  WELLBORE_TYPE_AUTOCOMPLETE,
  LOG_TYPE_AUTOCOMPLETE,
  SEISMIC_SURVEY_TYPE_AUTOCOMPLETE
} = require('../src/utils/osduAutocompleteData');

console.log('🧪 Testing OSDU Query Builder Autocomplete Integration\n');

// Test 1: Verify autocomplete data sources exist
console.log('Test 1: Autocomplete Data Sources');
console.log('=====================================');

const requiredFields = [
  'data.operator',
  'data.country',
  'data.basin',
  'data.status',
  'data.wellType',
  'data.wellboreType',
  'data.logType',
  'data.surveyType'
];

let test1Pass = true;
requiredFields.forEach(field => {
  const values = getAutocompleteValues(field);
  const hasData = hasAutocompleteData(field);
  const pass = values.length >= 10 && hasData;
  
  console.log(`  ${pass ? '✓' : '✗'} ${field}: ${values.length} values (min 10 required)`);
  
  if (!pass) test1Pass = false;
});

console.log(`\n${test1Pass ? '✓' : '✗'} Test 1: ${test1Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 2: Verify specific autocomplete lists
console.log('Test 2: Specific Autocomplete Lists');
console.log('=====================================');

const autocompleteTests = [
  { name: 'Operators', values: OPERATOR_AUTOCOMPLETE, expected: ['Shell', 'BP', 'Equinor'] },
  { name: 'Countries', values: COUNTRY_AUTOCOMPLETE, expected: ['Norway', 'United Kingdom', 'United States'] },
  { name: 'Basins', values: BASIN_AUTOCOMPLETE, expected: ['North Sea', 'Gulf of Mexico'] },
  { name: 'Well Status', values: WELL_STATUS_AUTOCOMPLETE, expected: ['Active', 'Producing'] },
  { name: 'Well Types', values: WELL_TYPE_AUTOCOMPLETE, expected: ['Production', 'Exploration'] },
  { name: 'Wellbore Types', values: WELLBORE_TYPE_AUTOCOMPLETE, expected: ['Vertical', 'Horizontal'] },
  { name: 'Log Types', values: LOG_TYPE_AUTOCOMPLETE, expected: ['GR', 'RHOB', 'NPHI'] },
  { name: 'Seismic Types', values: SEISMIC_SURVEY_TYPE_AUTOCOMPLETE, expected: ['2D', '3D', '4D'] }
];

let test2Pass = true;
autocompleteTests.forEach(test => {
  const hasExpected = test.expected.every(val => test.values.includes(val));
  const hasMinimum = test.values.length >= 10;
  const pass = hasExpected && hasMinimum;
  
  console.log(`  ${pass ? '✓' : '✗'} ${test.name}: ${test.values.length} values, includes ${test.expected.join(', ')}`);
  
  if (!pass) test2Pass = false;
});

console.log(`\n${test2Pass ? '✓' : '✗'} Test 2: ${test2Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 3: Real-time filtering
console.log('Test 3: Real-time Filtering');
console.log('=====================================');

const filterTests = [
  { 
    field: 'data.operator', 
    input: 'shell', 
    expectedInResults: ['Shell'],
    expectedNotInResults: ['BP', 'Equinor']
  },
  { 
    field: 'data.country', 
    input: 'united', 
    expectedInResults: ['United Kingdom', 'United States'],
    expectedNotInResults: ['Norway', 'Brazil']
  },
  { 
    field: 'data.basin', 
    input: 'sea', 
    expectedInResults: ['North Sea', 'Norwegian Sea', 'Barents Sea'],
    expectedNotInResults: ['Gulf of Mexico']
  }
];

let test3Pass = true;
filterTests.forEach(test => {
  const allValues = getAutocompleteValues(test.field);
  const filtered = filterAutocompleteValues(allValues, test.input);
  
  const hasExpected = test.expectedInResults.every(val => filtered.includes(val));
  const excludesUnexpected = test.expectedNotInResults.every(val => !filtered.includes(val));
  const pass = hasExpected && excludesUnexpected;
  
  console.log(`  ${pass ? '✓' : '✗'} Filter "${test.input}" in ${test.field}:`);
  console.log(`      Found: ${filtered.join(', ')}`);
  console.log(`      Expected: ${test.expectedInResults.join(', ')}`);
  
  if (!pass) test3Pass = false;
});

console.log(`\n${test3Pass ? '✓' : '✗'} Test 3: ${test3Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 4: Suggested values with relevance sorting
console.log('Test 4: Suggested Values (Relevance Sorting)');
console.log('=====================================');

const suggestionTests = [
  { field: 'data.operator', input: 'shell', expectedFirst: 'Shell' },
  { field: 'data.country', input: 'nor', expectedFirst: 'Norway' },
  { field: 'data.basin', input: 'north', expectedFirst: 'North Sea' }
];

let test4Pass = true;
suggestionTests.forEach(test => {
  const suggestions = getSuggestedValues(test.field, test.input, 5);
  const firstMatch = suggestions[0];
  const pass = firstMatch === test.expectedFirst;
  
  console.log(`  ${pass ? '✓' : '✗'} "${test.input}" → First: ${firstMatch} (expected: ${test.expectedFirst})`);
  console.log(`      Top 5: ${suggestions.slice(0, 5).join(', ')}`);
  
  if (!pass) test4Pass = false;
});

console.log(`\n${test4Pass ? '✓' : '✗'} Test 4: ${test4Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 5: Fallback to free-text for fields without autocomplete
console.log('Test 5: Free-text Fallback');
console.log('=====================================');

const freeTextFields = [
  'data.wellName',
  'data.wellboreName',
  'data.logName',
  'data.surveyName',
  'data.depth',
  'data.md',
  'data.tvd'
];

let test5Pass = true;
freeTextFields.forEach(field => {
  const hasData = hasAutocompleteData(field);
  const values = getAutocompleteValues(field);
  const pass = !hasData && values.length === 0;
  
  console.log(`  ${pass ? '✓' : '✗'} ${field}: No autocomplete (free-text enabled)`);
  
  if (!pass) test5Pass = false;
});

console.log(`\n${test5Pass ? '✓' : '✗'} Test 5: ${test5Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 6: Validation of autocomplete values
console.log('Test 6: Value Validation');
console.log('=====================================');

const validationTests = [
  { field: 'data.operator', value: 'Shell', expectedValid: true },
  { field: 'data.operator', value: 'shell', expectedValid: true }, // Case-insensitive
  { field: 'data.operator', value: 'InvalidOperator', expectedValid: false },
  { field: 'data.wellName', value: 'AnyValue', expectedValid: true }, // No autocomplete = any value valid
];

let test6Pass = true;
validationTests.forEach(test => {
  const isValid = isValidAutocompleteValue(test.field, test.value);
  const pass = isValid === test.expectedValid;
  
  console.log(`  ${pass ? '✓' : '✗'} ${test.field} = "${test.value}": ${isValid ? 'Valid' : 'Invalid'} (expected: ${test.expectedValid ? 'Valid' : 'Invalid'})`);
  
  if (!pass) test6Pass = false;
});

console.log(`\n${test6Pass ? '✓' : '✗'} Test 6: ${test6Pass ? 'PASSED' : 'FAILED'}\n`);

// Test 7: All autocomplete sources accessible
console.log('Test 7: All Autocomplete Sources');
console.log('=====================================');

const allSources = getAllAutocompleteSources();
const test7Pass = allSources.length === 8; // Should have 8 autocomplete sources

console.log(`  ${test7Pass ? '✓' : '✗'} Total autocomplete sources: ${allSources.length} (expected: 8)`);

allSources.forEach(source => {
  console.log(`      - ${source.field}: ${source.values.length} values - ${source.description}`);
});

console.log(`\n${test7Pass ? '✓' : '✗'} Test 7: ${test7Pass ? 'PASSED' : 'FAILED'}\n`);

// Final Summary
console.log('=====================================');
console.log('FINAL SUMMARY');
console.log('=====================================');

const allTests = [
  { name: 'Test 1: Autocomplete Data Sources', pass: test1Pass },
  { name: 'Test 2: Specific Autocomplete Lists', pass: test2Pass },
  { name: 'Test 3: Real-time Filtering', pass: test3Pass },
  { name: 'Test 4: Suggested Values', pass: test4Pass },
  { name: 'Test 5: Free-text Fallback', pass: test5Pass },
  { name: 'Test 6: Value Validation', pass: test6Pass },
  { name: 'Test 7: All Autocomplete Sources', pass: test7Pass }
];

const passedTests = allTests.filter(t => t.pass).length;
const totalTests = allTests.length;
const allPassed = passedTests === totalTests;

allTests.forEach(test => {
  console.log(`${test.pass ? '✓' : '✗'} ${test.name}`);
});

console.log('\n=====================================');
console.log(`${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log(`${passedTests}/${totalTests} tests passed`);
console.log('=====================================\n');

// Requirements Coverage
console.log('Requirements Coverage:');
console.log('  ✓ 11.1: Autocomplete data sources defined');
console.log('  ✓ 11.2: Real-time filtering of suggestions');
console.log('  ✓ 11.3: Autocomplete for Operator, Country, Basin, Well types, Log types');
console.log('  ✓ 11.4: Fallback to free-text for fields without autocomplete');
console.log('  ✓ 11.5: Show at least 10 most common values');

process.exit(allPassed ? 0 : 1);
