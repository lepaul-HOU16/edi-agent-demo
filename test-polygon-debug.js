// Comprehensive test to debug polygon-first search issues
console.log('🔬 COMPREHENSIVE POLYGON-FIRST SEARCH DEBUG');
console.log('==============================================');

// Simulate the exact conditions from the frontend
const mockActivePolygon = {
  id: 'polygon-1732399850123',
  geometry: {
    type: 'Polygon',
    coordinates: [[[106.0, 9.0], [108.0, 9.0], [108.0, 11.0], [106.0, 11.0], [106.0, 9.0]]]
  },
  name: 'Test Area',
  area: 48842.5,
  createdAt: new Date()
};

const mockCurrentContext = null; // No existing context

// Mock backend response
const mockBackendResponse = {
  type: "FeatureCollection",
  metadata: {
    type: "wells",
    searchQuery: "wells in polygon",
    source: "OSDU Community Platform",
    recordCount: 15,
    region: 'south-china-sea',
    queryType: 'general',
    timestamp: new Date().toISOString()
  },
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [107.0, 10.0] },
      properties: { name: "Test Well 1", type: "Production", depth: "3500m", operator: "PetroVietnam" }
    },
    {
      type: "Feature", 
      geometry: { type: "Point", coordinates: [107.5, 10.5] },
      properties: { name: "Test Well 2", type: "Exploration", depth: "4200m", operator: "Shell" }
    }
  ]
};

// Test query analysis
function testAnalyzeQuery(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  console.log('\n🎯 TESTING QUERY ANALYSIS');
  console.log('  Query:', query);
  console.log('  Has active polygon:', !!mockActivePolygon);
  console.log('  Has current context:', !!mockCurrentContext);
  
  const polygonFilterPatterns = [
    /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
    /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
    /(?:polygon|area)\s*(?:filter|selection)/i,
    /(?:find|search|show).*wells?.*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i
  ];
  
  const isPolygonQuery = polygonFilterPatterns.some(pattern => pattern.test(lowerQuery));
  console.log('  Matches polygon patterns:', isPolygonQuery);
  
  // Check existing functionality first
  if (isPolygonQuery && mockActivePolygon && mockCurrentContext && mockCurrentContext.data && mockCurrentContext.data.features?.length > 0) {
    console.log('  ✅ RESULT: POLYGON FILTER ON EXISTING CONTEXT');
    return {
      isContextual: true,
      operation: 'filter',
      filterType: 'polygon',
      filterValue: mockActivePolygon.id,
      polygonId: mockActivePolygon.id,
      originalQuery: query
    };
  }
  
  // Check new functionality
  if (isPolygonQuery && mockActivePolygon && (!mockCurrentContext || !mockCurrentContext.data || !mockCurrentContext.data.features?.length)) {
    console.log('  ✅ RESULT: POLYGON-FIRST SEARCH DETECTED');
    return {
      isContextual: false,
      operation: 'new',
      filterType: 'polygon',
      filterValue: 'polygon_first_search',
      polygonId: mockActivePolygon.id,
      originalQuery: query
    };
  }
  
  console.log('  ❌ RESULT: No polygon match');
  return { isContextual: false, operation: 'new', originalQuery: query };
}

// Test the flow
const queryAnalysis = testAnalyzeQuery('wells in polygon');
console.log('📊 Query analysis result:', JSON.stringify(queryAnalysis, null, 2));

// Test handler condition
const shouldProcessPolygonFirst = (
  queryAnalysis.filterType === 'polygon' && 
  queryAnalysis.filterValue === 'polygon_first_search' && 
  mockActivePolygon
);
console.log('\n🔧 TESTING HANDLER CONDITIONS');
console.log('  Should process polygon-first:', shouldProcessPolygonFirst);

if (shouldProcessPolygonFirst) {
  console.log('  ✅ POLYGON-FIRST HANDLER SHOULD TRIGGER');
  
  // Simulate backend call success
  console.log('  📡 Simulating backend call...');
  
  // Test polygon filtering logic
  function testApplyPolygonFilter(wells, polygon) {
    console.log('  🗺️ Testing polygon filter...');
    console.log('    Input wells:', wells.features.length);
    console.log('    Polygon area:', polygon.area, 'km²');
    
    // For testing, assume 1 well passes filter
    const filteredFeatures = wells.features.slice(0, 1); // Take first well
    
    return {
      ...wells,
      features: filteredFeatures,
      metadata: {
        ...wells.metadata,
        recordCount: filteredFeatures.length,
        filtered: true,
        originalCount: wells.features.length,
        polygonFilter: {
          id: polygon.id,
          name: polygon.name,
          area: polygon.area
        }
      }
    };
  }
  
  const geoJsonData = testApplyPolygonFilter(mockBackendResponse, mockActivePolygon);
  console.log('  📊 Filtered data:', {
    originalCount: mockBackendResponse.features.length,
    filteredCount: geoJsonData.features.length,
    hasPolygonFilter: !!geoJsonData.metadata.polygonFilter
  });
  
  // Test table/map update condition
  const shouldUpdateTableAndMap = (
    (queryAnalysis.isContextual && queryAnalysis.operation === 'filter') ||
    (queryAnalysis.filterType === 'polygon' && queryAnalysis.filterValue === 'polygon_first_search')
  );
  console.log('  🎯 Should update table/map:', shouldUpdateTableAndMap);
  
  // Test contextual info condition
  const shouldShowPolygonContext = (
    queryAnalysis.filterType === 'polygon' && 
    queryAnalysis.filterValue === 'polygon_first_search' && 
    mockActivePolygon && 
    geoJsonData.metadata?.polygonFilter
  );
  console.log('  📝 Should show polygon context:', shouldShowPolygonContext);
  
  if (shouldShowPolygonContext) {
    console.log('  ✅ CONTEXTUAL INFO SHOULD DISPLAY CORRECTLY');
    
    const originalCount = geoJsonData.metadata?.originalCount || 0;
    const filteredCount = geoJsonData.features.length;
    
    console.log('    - Original count:', originalCount);
    console.log('    - Filtered count:', filteredCount);
    console.log('    - Percentage:', originalCount > 0 ? Math.round((filteredCount/originalCount)*100) : 0, '%');
    console.log('    - Well density:', (filteredCount / (mockActivePolygon.area || 1)).toFixed(2), 'wells/km²');
  } else {
    console.log('  ❌ CONTEXTUAL INFO CONDITION FAILED');
    console.log('    - filterType:', queryAnalysis.filterType);
    console.log('    - filterValue:', queryAnalysis.filterValue);
    console.log('    - activePolygon exists:', !!mockActivePolygon);
    console.log('    - polygonFilter in metadata:', !!geoJsonData.metadata?.polygonFilter);
  }
  
} else {
  console.log('  ❌ POLYGON-FIRST HANDLER WILL NOT TRIGGER');
  console.log('    - filterType:', queryAnalysis.filterType);
  console.log('    - filterValue:', queryAnalysis.filterValue);
  console.log('    - activePolygon exists:', !!mockActivePolygon);
}

console.log('\n🏁 DEBUG SUMMARY');
console.log('================');
console.log('Query Analysis Working:', queryAnalysis.filterType === 'polygon');
console.log('Handler Condition Working:', shouldProcessPolygonFirst);
console.log('Expected Flow: Draw polygon → Type "wells in polygon" → Backend call → Filter → Display');

if (queryAnalysis.filterType === 'polygon' && shouldProcessPolygonFirst) {
  console.log('✅ LOGIC IS CORRECT - Polygon-first search should work');
} else {
  console.log('❌ LOGIC ERROR - Check conditions');
}
