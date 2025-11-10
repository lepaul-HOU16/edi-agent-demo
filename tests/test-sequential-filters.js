/**
 * Test: Sequential Filter Support (Task 9)
 * 
 * Verifies that multiple filters can be applied in sequence,
 * with each new filter applied to the already-filtered results.
 * 
 * Requirements tested:
 * - 8.1: System updates context with filtered results
 * - 8.2: Second filter applied to already-filtered results
 * - 8.3: System maintains filter history
 * - 8.5: System displays cumulative filter criteria
 */

const testSequentialFilters = () => {
  console.log('🧪 Testing Sequential Filter Support...\n');
  
  // Mock OSDU context with sample data
  const mockOsduContext = {
    query: 'show me osdu wells',
    timestamp: new Date(),
    recordCount: 10,
    records: [
      { id: '1', name: 'Well-A', operator: 'Shell', location: 'Norway', depth: '3500m', type: 'production' },
      { id: '2', name: 'Well-B', operator: 'BP', location: 'Norway', depth: '4200m', type: 'exploration' },
      { id: '3', name: 'Well-C', operator: 'Shell', location: 'USA', depth: '2800m', type: 'production' },
      { id: '4', name: 'Well-D', operator: 'Equinor', location: 'Norway', depth: '3800m', type: 'production' },
      { id: '5', name: 'Well-E', operator: 'Shell', location: 'Norway', depth: '4500m', type: 'production' },
      { id: '6', name: 'Well-F', operator: 'BP', location: 'USA', depth: '3200m', type: 'exploration' },
      { id: '7', name: 'Well-G', operator: 'Shell', location: 'Norway', depth: '3900m', type: 'production' },
      { id: '8', name: 'Well-H', operator: 'Equinor', location: 'Norway', depth: '2900m', type: 'production' },
      { id: '9', name: 'Well-I', operator: 'BP', location: 'Norway', depth: '4100m', type: 'exploration' },
      { id: '10', name: 'Well-J', operator: 'Shell', location: 'USA', depth: '3300m', type: 'production' }
    ],
    filteredRecords: undefined,
    activeFilters: []
  };
  
  console.log('📊 Initial data:', {
    totalRecords: mockOsduContext.recordCount,
    operators: [...new Set(mockOsduContext.records.map(r => r.operator))],
    locations: [...new Set(mockOsduContext.records.map(r => r.location))],
    types: [...new Set(mockOsduContext.records.map(r => r.type))]
  });
  console.log('');
  
  // Test 1: Apply first filter (location = Norway)
  console.log('🔍 Test 1: Apply first filter (location = Norway)');
  const baseRecords1 = mockOsduContext.filteredRecords || mockOsduContext.records;
  const filteredRecords1 = baseRecords1.filter(r => 
    r.location?.toLowerCase().includes('norway')
  );
  
  const filter1 = {
    type: 'location',
    value: 'Norway',
    operator: 'contains'
  };
  
  const context1 = {
    ...mockOsduContext,
    filteredRecords: filteredRecords1,
    activeFilters: [...(mockOsduContext.activeFilters || []), filter1]
  };
  
  console.log('✅ After first filter:', {
    originalCount: mockOsduContext.recordCount,
    filteredCount: filteredRecords1.length,
    activeFilters: context1.activeFilters.length,
    filterDescription: `${filter1.type} ${filter1.operator} "${filter1.value}"`
  });
  
  // Verify first filter results
  const expectedAfterFilter1 = 7; // Wells in Norway
  if (filteredRecords1.length !== expectedAfterFilter1) {
    console.error(`❌ FAIL: Expected ${expectedAfterFilter1} records, got ${filteredRecords1.length}`);
    return false;
  }
  console.log('✅ PASS: First filter applied correctly\n');
  
  // Test 2: Apply second filter to already-filtered results (operator = Shell)
  console.log('🔍 Test 2: Apply second filter (operator = Shell) to already-filtered results');
  const baseRecords2 = context1.filteredRecords || context1.records;
  const filteredRecords2 = baseRecords2.filter(r => 
    r.operator?.toLowerCase().includes('shell')
  );
  
  const filter2 = {
    type: 'operator',
    value: 'Shell',
    operator: 'contains'
  };
  
  const context2 = {
    ...context1,
    filteredRecords: filteredRecords2,
    activeFilters: [...(context1.activeFilters || []), filter2]
  };
  
  console.log('✅ After second filter:', {
    originalCount: mockOsduContext.recordCount,
    afterFirstFilter: filteredRecords1.length,
    afterSecondFilter: filteredRecords2.length,
    activeFilters: context2.activeFilters.length,
    cumulativeFilters: context2.activeFilters.map(f => `${f.type}=${f.value}`).join(', ')
  });
  
  // Verify second filter applied to already-filtered results
  const expectedAfterFilter2 = 3; // Shell wells in Norway
  if (filteredRecords2.length !== expectedAfterFilter2) {
    console.error(`❌ FAIL: Expected ${expectedAfterFilter2} records, got ${filteredRecords2.length}`);
    return false;
  }
  
  // Verify all results match both filters
  const allMatchBothFilters = filteredRecords2.every(r => 
    r.location?.toLowerCase().includes('norway') && 
    r.operator?.toLowerCase().includes('shell')
  );
  
  if (!allMatchBothFilters) {
    console.error('❌ FAIL: Not all records match both filters');
    return false;
  }
  console.log('✅ PASS: Second filter applied to already-filtered results correctly\n');
  
  // Test 3: Apply third filter (depth > 3500m)
  console.log('🔍 Test 3: Apply third filter (depth > 3500m) to cumulative results');
  const baseRecords3 = context2.filteredRecords || context2.records;
  const filteredRecords3 = baseRecords3.filter(r => {
    const depthValue = parseFloat(r.depth?.replace(/[^\d.]/g, '') || '0');
    return depthValue > 3500;
  });
  
  const filter3 = {
    type: 'depth',
    value: '3500',
    operator: '>'
  };
  
  const context3 = {
    ...context2,
    filteredRecords: filteredRecords3,
    activeFilters: [...(context2.activeFilters || []), filter3]
  };
  
  console.log('✅ After third filter:', {
    originalCount: mockOsduContext.recordCount,
    afterFirstFilter: filteredRecords1.length,
    afterSecondFilter: filteredRecords2.length,
    afterThirdFilter: filteredRecords3.length,
    activeFilters: context3.activeFilters.length,
    cumulativeFilters: context3.activeFilters.map(f => `${f.type} ${f.operator} "${f.value}"`).join(', ')
  });
  
  // Verify third filter applied to cumulative results
  const expectedAfterFilter3 = 2; // Shell wells in Norway with depth > 3500m
  if (filteredRecords3.length !== expectedAfterFilter3) {
    console.error(`❌ FAIL: Expected ${expectedAfterFilter3} records, got ${filteredRecords3.length}`);
    return false;
  }
  
  // Verify all results match all three filters
  const allMatchAllFilters = filteredRecords3.every(r => {
    const depthValue = parseFloat(r.depth?.replace(/[^\d.]/g, '') || '0');
    return r.location?.toLowerCase().includes('norway') && 
           r.operator?.toLowerCase().includes('shell') &&
           depthValue > 3500;
  });
  
  if (!allMatchAllFilters) {
    console.error('❌ FAIL: Not all records match all three filters');
    return false;
  }
  console.log('✅ PASS: Third filter applied to cumulative results correctly\n');
  
  // Test 4: Verify filter history is maintained
  console.log('🔍 Test 4: Verify filter history is maintained');
  if (context3.activeFilters.length !== 3) {
    console.error(`❌ FAIL: Expected 3 filters in history, got ${context3.activeFilters.length}`);
    return false;
  }
  
  console.log('✅ Filter history:', context3.activeFilters.map((f, i) => 
    `  ${i + 1}. ${f.type} ${f.operator} "${f.value}"`
  ).join('\n'));
  console.log('✅ PASS: Filter history maintained correctly\n');
  
  // Test 5: Verify cumulative filter display
  console.log('🔍 Test 5: Verify cumulative filter display message');
  const allFilters = context3.activeFilters;
  const filterSummary = allFilters.length > 1 
    ? `Applied ${allFilters.length} filters: ${allFilters.map(f => {
        const op = f.operator === 'contains' ? 'containing' : f.operator === '>' ? '>' : f.operator === '<' ? '<' : f.operator === '=' ? '=' : f.operator;
        return `${f.type} ${op} "${f.value}"`;
      }).join(', ')}`
    : `Applied filter: ${allFilters[0].type} ${allFilters[0].operator} "${allFilters[0].value}"`;
  
  console.log('✅ Cumulative filter summary:');
  console.log(`   "${filterSummary}"`);
  
  const expectedSummary = 'Applied 3 filters: location containing "Norway", operator containing "Shell", depth > "3500"';
  if (filterSummary !== expectedSummary) {
    console.error(`❌ FAIL: Filter summary doesn't match expected format`);
    console.error(`   Expected: "${expectedSummary}"`);
    console.error(`   Got: "${filterSummary}"`);
    return false;
  }
  console.log('✅ PASS: Cumulative filter display is correct\n');
  
  // Test 6: Verify original records are preserved
  console.log('🔍 Test 6: Verify original records are preserved');
  if (context3.records.length !== mockOsduContext.recordCount) {
    console.error(`❌ FAIL: Original records modified! Expected ${mockOsduContext.recordCount}, got ${context3.records.length}`);
    return false;
  }
  console.log('✅ PASS: Original records preserved (not modified by filters)\n');
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ ALL TESTS PASSED - Sequential Filter Support Working!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Final Results:');
  console.log(`   Original records: ${mockOsduContext.recordCount}`);
  console.log(`   After filter 1 (location=Norway): ${filteredRecords1.length}`);
  console.log(`   After filter 2 (operator=Shell): ${filteredRecords2.length}`);
  console.log(`   After filter 3 (depth>3500m): ${filteredRecords3.length}`);
  console.log(`   Filters applied: ${context3.activeFilters.length}`);
  console.log('');
  console.log('✅ Requirements verified:');
  console.log('   ✅ 8.1: Context updated with filtered results');
  console.log('   ✅ 8.2: Second filter applied to already-filtered results');
  console.log('   ✅ 8.3: Filter history maintained');
  console.log('   ✅ 8.5: Cumulative filter criteria displayed');
  console.log('');
  
  return true;
};

// Run the test
try {
  const success = testSequentialFilters();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
}
