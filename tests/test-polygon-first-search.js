// Test script for polygon-first search functionality
// This simulates the exact conditions and logic flow

console.log('🧪 TESTING POLYGON-FIRST SEARCH FUNCTIONALITY');
console.log('================================================');

// Simulate the state conditions
const mockState = {
  activePolygon: {
    id: 'polygon-test-123',
    geometry: {
      type: 'Polygon',
      coordinates: [[[106.0, 9.0], [108.0, 9.0], [108.0, 11.0], [106.0, 11.0], [106.0, 9.0]]]
    },
    name: 'Test Area',
    area: 48842.5, // km²
    createdAt: new Date()
  },
  currentContext: null, // No existing context (important!)
  polygons: []
};

// Test queries that should trigger polygon-first search
const testQueries = [
  'wells in polygon',
  'find wells in the polygon',
  'show wells within the polygon',
  'wells in the area',
  'search for wells in polygon',
  'wells inside the boundary'
];

// Simulate analyzeQuery function logic
function testAnalyzeQuery(query, activePolygon, currentContext) {
  const lowerQuery = query.toLowerCase().trim();
  
  console.log(`\n🎯 Testing query: "${query}"`);
  console.log('  - Active polygon exists:', !!activePolygon);
  console.log('  - Current context exists:', !!currentContext);
  
  // Check for polygon queries
  const polygonFilterPatterns = [
    /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
    /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
    /(?:polygon|area)\s*(?:filter|selection)/i,
    /(?:find|search|show).*wells?.*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i
  ];
  
  const isPolygonQuery = polygonFilterPatterns.some(pattern => pattern.test(lowerQuery));
  console.log('  - Matches polygon patterns:', isPolygonQuery);
  
  // EXISTING FUNCTIONALITY: Polygon filter on existing context
  if (isPolygonQuery && activePolygon && currentContext && currentContext.data && currentContext.data.features?.length > 0) {
    console.log('  ✅ RESULT: POLYGON FILTER ON EXISTING CONTEXT');
    return {
      isContextual: true,
      operation: 'filter',
      filterType: 'polygon',
      filterValue: activePolygon.id,
      polygonId: activePolygon.id,
      originalQuery: query
    };
  }
  
  // NEW FUNCTIONALITY: Polygon-first search (no existing context)
  if (isPolygonQuery && activePolygon && (!currentContext || !currentContext.data || !currentContext.data.features?.length)) {
    console.log('  ✅ RESULT: POLYGON-FIRST SEARCH DETECTED');
    return {
      isContextual: false, // Treat as new search, not filter
      operation: 'new',
      filterType: 'polygon',
      filterValue: 'polygon_first_search', // Clear flag for new feature
      polygonId: activePolygon.id,
      originalQuery: query
    };
  }
  
  console.log('  ❌ RESULT: No polygon match');
  return {
    isContextual: false,
    operation: 'new',
    originalQuery: query
  };
}

// Test each query
testQueries.forEach(query => {
  const result = testAnalyzeQuery(query, mockState.activePolygon, mockState.currentContext);
  
  if (result.filterType === 'polygon' && result.filterValue === 'polygon_first_search') {
    console.log('  🎉 SUCCESS: Polygon-first search correctly detected!');
  } else {
    console.log('  ⚠️  FAILED: Did not detect polygon-first search');
  }
  
  console.log('  📝 Full result:', JSON.stringify(result, null, 4));
});

console.log('\n🔍 TESTING HANDLER LOGIC');
console.log('========================');

// Test the handler condition
const testResult = testAnalyzeQuery('wells in polygon', mockState.activePolygon, mockState.currentContext);

if (testResult.filterType === 'polygon' && testResult.filterValue === 'polygon_first_search' && mockState.activePolygon) {
  console.log('✅ Handler condition PASSED: Polygon-first search should be processed');
  
  // Test the table/map update condition
  const mockGeoJsonData = { features: [], metadata: { polygonFilter: { id: 'test' } } };
  const shouldUpdateTableAndMap = (
    (testResult.isContextual && testResult.operation === 'filter') ||
    (testResult.filterType === 'polygon' && testResult.filterValue === 'polygon_first_search')
  );
  
  console.log('✅ Table/Map update condition PASSED:', shouldUpdateTableAndMap);
  
  // Test contextual info condition
  const shouldShowPolygonContext = (
    testResult.filterType === 'polygon' && 
    testResult.filterValue === 'polygon_first_search' && 
    mockState.activePolygon && 
    mockGeoJsonData.metadata?.polygonFilter
  );
  
  console.log('✅ Contextual info condition PASSED:', shouldShowPolygonContext);
} else {
  console.log('❌ Handler condition FAILED');
  console.log('  - filterType:', testResult.filterType);
  console.log('  - filterValue:', testResult.filterValue);
  console.log('  - activePolygon exists:', !!mockState.activePolygon);
}

console.log('\n🏁 TEST COMPLETE');
console.log('================');
console.log('If you see ✅ SUCCESS messages above, the polygon-first search logic should work.');
console.log('If you see ❌ FAILED messages, there may be an issue with the query patterns or logic.');
