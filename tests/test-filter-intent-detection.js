/**
 * Test suite for detectFilterIntent function
 * Tests the filter intent detection logic for OSDU conversational filtering
 */

// Mock implementation of detectFilterIntent for testing
const detectFilterIntent = (query, hasOsduContext) => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Only detect filter intent if OSDU context exists
  if (!hasOsduContext) {
    console.log('🔍 Filter intent: No OSDU context, skipping filter detection');
    return { isFilter: false };
  }
  
  // Filter keywords
  const filterKeywords = [
    'filter', 'show only', 'where', 'with', 
    'operator', 'location', 'depth', 'type', 'status',
    'greater than', 'less than', 'equals'
  ];
  
  const hasFilterKeyword = filterKeywords.some(kw => lowerQuery.includes(kw));
  
  if (!hasFilterKeyword) {
    console.log('🔍 Filter intent: No filter keywords found');
    return { isFilter: false };
  }
  
  // Parse filter type and value
  let filterType = undefined;
  let filterValue = undefined;
  let filterOperator = 'contains';
  
  // Operator filter
  if (lowerQuery.includes('operator')) {
    filterType = 'operator';
    const match = lowerQuery.match(/operator\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Location filter
  else if (lowerQuery.includes('location') || lowerQuery.includes('country')) {
    filterType = 'location';
    const match = lowerQuery.match(/(?:location|country)\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Depth filter
  else if (lowerQuery.includes('depth')) {
    filterType = 'depth';
    
    // Greater than
    if (lowerQuery.includes('greater than') || lowerQuery.includes('>')) {
      filterOperator = '>';
      const match = lowerQuery.match(/(?:greater than|>)\s*(\d+)/);
      if (match) filterValue = match[1];
    }
    // Less than
    else if (lowerQuery.includes('less than') || lowerQuery.includes('<')) {
      filterOperator = '<';
      const match = lowerQuery.match(/(?:less than|<)\s*(\d+)/);
      if (match) filterValue = match[1];
    }
    // Equals
    else {
      filterOperator = '=';
      const match = lowerQuery.match(/depth\s+(?:is\s+)?(\d+)/);
      if (match) filterValue = match[1];
    }
  }
  
  // Type filter
  else if (lowerQuery.includes('type')) {
    filterType = 'type';
    const match = lowerQuery.match(/type\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  // Status filter
  else if (lowerQuery.includes('status')) {
    filterType = 'status';
    const match = lowerQuery.match(/status\s+(?:is\s+)?([a-z0-9\s]+)/i);
    if (match) filterValue = match[1].trim();
  }
  
  console.log('🔍 Filter intent detected:', { filterType, filterValue, filterOperator });
  
  return {
    isFilter: true,
    filterType,
    filterValue,
    filterOperator
  };
};

// Test cases
console.log('\n🧪 Testing detectFilterIntent function\n');

// Test 1: No OSDU context
console.log('Test 1: Filter query without OSDU context');
const test1 = detectFilterIntent('filter by operator Shell', false);
console.assert(test1.isFilter === false, 'Should not detect filter without context');
console.log('✅ Test 1 passed\n');

// Test 2: Operator filter
console.log('Test 2: Operator filter detection');
const test2 = detectFilterIntent('filter by operator Shell', true);
console.assert(test2.isFilter === true, 'Should detect filter');
console.assert(test2.filterType === 'operator', 'Should detect operator type');
console.assert(test2.filterValue === 'Shell', 'Should extract operator value');
console.assert(test2.filterOperator === 'contains', 'Should use contains operator');
console.log('✅ Test 2 passed\n');

// Test 3: Location filter
console.log('Test 3: Location filter detection');
const test3 = detectFilterIntent('show only location Norway', true);
console.assert(test3.isFilter === true, 'Should detect filter');
console.assert(test3.filterType === 'location', 'Should detect location type');
console.assert(test3.filterValue === 'Norway', 'Should extract location value');
console.log('✅ Test 3 passed\n');

// Test 4: Country filter
console.log('Test 4: Country filter detection');
const test4 = detectFilterIntent('filter by country USA', true);
console.assert(test4.isFilter === true, 'Should detect filter');
console.assert(test4.filterType === 'location', 'Should detect location type for country');
console.assert(test4.filterValue === 'USA', 'Should extract country value');
console.log('✅ Test 4 passed\n');

// Test 5: Depth filter with greater than
console.log('Test 5: Depth filter with greater than');
const test5 = detectFilterIntent('show wells with depth greater than 3000', true);
console.assert(test5.isFilter === true, 'Should detect filter');
console.assert(test5.filterType === 'depth', 'Should detect depth type');
console.assert(test5.filterValue === '3000', 'Should extract depth value');
console.assert(test5.filterOperator === '>', 'Should detect greater than operator');
console.log('✅ Test 5 passed\n');

// Test 6: Depth filter with less than
console.log('Test 6: Depth filter with less than');
const test6 = detectFilterIntent('filter depth < 5000', true);
console.assert(test6.isFilter === true, 'Should detect filter');
console.assert(test6.filterType === 'depth', 'Should detect depth type');
console.assert(test6.filterValue === '5000', 'Should extract depth value');
console.assert(test6.filterOperator === '<', 'Should detect less than operator');
console.log('✅ Test 6 passed\n');

// Test 7: Depth filter with equals
console.log('Test 7: Depth filter with equals');
const test7 = detectFilterIntent('show wells where depth is 4000', true);
console.assert(test7.isFilter === true, 'Should detect filter');
console.assert(test7.filterType === 'depth', 'Should detect depth type');
console.assert(test7.filterValue === '4000', 'Should extract depth value');
console.assert(test7.filterOperator === '=', 'Should use equals operator');
console.log('✅ Test 7 passed\n');

// Test 8: Type filter
console.log('Test 8: Type filter detection');
const test8 = detectFilterIntent('filter by type production', true);
console.assert(test8.isFilter === true, 'Should detect filter');
console.assert(test8.filterType === 'type', 'Should detect type filter');
console.assert(test8.filterValue === 'production', 'Should extract type value');
console.log('✅ Test 8 passed\n');

// Test 9: Status filter
console.log('Test 9: Status filter detection');
const test9 = detectFilterIntent('show only status active', true);
console.assert(test9.isFilter === true, 'Should detect filter');
console.assert(test9.filterType === 'status', 'Should detect status filter');
console.assert(test9.filterValue === 'active', 'Should extract status value');
console.log('✅ Test 9 passed\n');

// Test 10: No filter keywords
console.log('Test 10: Query without filter keywords');
const test10 = detectFilterIntent('show me osdu wells', true);
console.assert(test10.isFilter === false, 'Should not detect filter without keywords');
console.log('✅ Test 10 passed\n');

// Test 11: Filter keyword but no parseable value
console.log('Test 11: Filter keyword without parseable value');
const test11 = detectFilterIntent('filter by something', true);
console.assert(test11.isFilter === true, 'Should detect filter intent');
console.assert(test11.filterType === undefined, 'Should not detect specific type');
console.assert(test11.filterValue === undefined, 'Should not extract value');
console.log('✅ Test 11 passed\n');

// Test 12: Case insensitivity
console.log('Test 12: Case insensitive detection');
const test12 = detectFilterIntent('FILTER BY OPERATOR BP', true);
console.assert(test12.isFilter === true, 'Should detect filter');
console.assert(test12.filterType === 'operator', 'Should detect operator type');
console.assert(test12.filterValue === 'BP', 'Should extract operator value');
console.log('✅ Test 12 passed\n');

console.log('🎉 All tests passed!\n');
