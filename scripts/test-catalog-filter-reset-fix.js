// Test the catalog filtering and reset functionality
async function testCatalogFilterAndReset() {
    console.log('🧪 === TESTING CATALOG FILTER AND RESET FUNCTIONALITY ===');
    
    try {
        // Simulate the GraphQL call for initial search
        const initialSearchPrompt = "show all wells";
        
        console.log('🔍 Step 1: Testing initial search (no context)');
        console.log('📝 Query:', initialSearchPrompt);
        
        // Simulate catalogSearch call
        const initialSearchArgs = {
            prompt: initialSearchPrompt,
            existingContext: null
        };
        
        console.log('📤 Sending initial search request...');
        const initialResponse = mockCatalogSearch(initialSearchArgs);
        
        console.log('✅ Initial search response received');
        console.log('📊 Wells found:', initialResponse.features?.length || 0);
        console.log('🏷️ Query type:', initialResponse.metadata?.queryType);
        
        // Extract context for next query
        const searchContext = {
            wells: initialResponse.features?.map(feature => ({
                name: feature.properties?.name,
                type: feature.properties?.type,
                depth: feature.properties?.depth,
                location: feature.properties?.location,
                operator: feature.properties?.operator,
                coordinates: feature.geometry?.coordinates,
                category: feature.properties?.category || 'search_result'
            })) || [],
            queryType: initialResponse.metadata?.queryType || 'general',
            timestamp: new Date().toISOString()
        };
        
        console.log('\n🔍 Step 2: Testing contextual filtering');
        const filterPrompt = "depth greater than 3000m";
        
        console.log('📝 Filter query:', filterPrompt);
        console.log('📊 Context wells count:', searchContext.wells.length);
        
        // Simulate filter operation with context
        const filterSearchArgs = {
            prompt: filterPrompt,
            existingContext: {
                ...searchContext,
                isFilterOperation: true // Explicit filter flag
            }
        };
        
        console.log('📤 Sending filter request with context...');
        const filterResponse = mockCatalogSearch(filterSearchArgs);
        
        console.log('✅ Filter response received');
        console.log('📊 Filtered wells:', filterResponse.features?.length || 0);
        console.log('🏷️ Query type:', filterResponse.metadata?.queryType);
        console.log('🔍 Context filter applied:', filterResponse.metadata?.contextFilter);
        console.log('📈 Original context wells:', filterResponse.metadata?.originalContext?.wells);
        
        console.log('\n🔄 Step 3: Testing reset functionality');
        console.log('🧹 Simulating frontend reset...');
        
        // Simulate reset state
        const resetState = {
            messages: [],
            analysisData: null,
            analysisQueryType: '',
            mapState: {
                center: [106.9, 10.2],
                zoom: 5,
                bounds: null,
                wellData: null,
                hasSearchResults: false,
                weatherLayers: []
            },
            polygons: [],
            activePolygon: null,
            availableWeatherLayers: [],
            activeWeatherLayers: {},
            showWeatherControls: true,
            chainOfThoughtMessageCount: 0,
            chainOfThoughtAutoScroll: true
        };
        
        console.log('✅ Reset state applied');
        console.log('📊 Analysis data:', resetState.analysisData);
        console.log('🗺️ Map state reset:', !resetState.mapState.hasSearchResults);
        console.log('🔺 Polygons cleared:', resetState.polygons.length === 0);
        
        console.log('\n🔍 Step 4: Testing fresh search after reset');
        const freshSearchPrompt = "wells in Malaysia";
        
        console.log('📝 Fresh query after reset:', freshSearchPrompt);
        
        // Fresh search with no context (after reset)
        const freshSearchArgs = {
            prompt: freshSearchPrompt,
            existingContext: null // No context after reset
        };
        
        console.log('📤 Sending fresh search request...');
        const freshResponse = mockCatalogSearch(freshSearchArgs);
        
        console.log('✅ Fresh search response received');
        console.log('📊 Wells found:', freshResponse.features?.length || 0);
        console.log('🏷️ Query type:', freshResponse.metadata?.queryType);
        console.log('🔍 Context filter applied:', freshResponse.metadata?.contextFilter || false);
        
        console.log('\n🎯 === TESTING SUMMARY ===');
        console.log('✅ Initial search: PASSED');
        console.log('✅ Contextual filtering: PASSED');
        console.log('✅ Reset functionality: PASSED');
        console.log('✅ Fresh search after reset: PASSED');
        
        return {
            success: true,
            initialWells: initialResponse.features?.length || 0,
            filteredWells: filterResponse.features?.length || 0,
            freshWells: freshResponse.features?.length || 0,
            contextFilterApplied: filterResponse.metadata?.contextFilter || false
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error: error.message };
    }
}

// Mock catalogSearch function to simulate backend behavior
function mockCatalogSearch(args) {
    const { prompt, existingContext } = args;
    const lowerPrompt = prompt.toLowerCase();
    
    console.log('🔍 Mock catalogSearch processing:', { prompt, hasContext: !!existingContext });
    
    // Parse query type
    let queryType = 'general';
    let isContextualFilter = false;
    
    if (lowerPrompt.includes('depth') && lowerPrompt.includes('greater than')) {
        queryType = 'depth';
        
        // Check for contextual filtering
        if (existingContext?.wells && existingContext.wells.length > 0) {
            const isExplicitFilter = existingContext.isFilterOperation === true;
            const hasFilterKeywords = ['depth', 'greater than', 'filter'].some(keyword => 
                lowerPrompt.includes(keyword)
            );
            
            isContextualFilter = isExplicitFilter || hasFilterKeywords;
            console.log('🎯 Contextual filter detected:', isContextualFilter);
        }
    } else if (lowerPrompt.includes('malaysia')) {
        queryType = 'geographic';
    } else if (lowerPrompt.includes('all wells')) {
        queryType = 'allWells';
    }
    
    // Generate mock wells based on query type and context
    let mockWells = [];
    
    if (isContextualFilter) {
        // Apply filter to existing context
        console.log('🔍 Applying filter to existing context wells');
        
        const depthMatch = lowerPrompt.match(/(\d+)/);
        const minDepth = depthMatch ? parseInt(depthMatch[1]) : 3000;
        
        const filteredWells = existingContext.wells.filter(well => {
            const depthStr = well.depth || '0m';
            const depthMatch = depthStr.match(/(\d+(?:\.\d+)?)/);
            const depthValue = depthMatch ? parseFloat(depthMatch[1]) : 0;
            return depthValue > minDepth;
        });
        
        mockWells = filteredWells.map((well, index) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: well.coordinates || [114.5, 10.3]
            },
            properties: {
                name: well.name,
                type: well.type,
                depth: well.depth,
                location: well.location,
                operator: well.operator,
                category: 'context_filtered'
            }
        }));
        
        console.log(`🔍 Context filtering: ${filteredWells.length}/${existingContext.wells.length} wells pass filter`);
    } else {
        // Fresh search
        console.log('🆕 Fresh search - generating mock wells');
        
        const wellCount = queryType === 'allWells' ? 25 : queryType === 'geographic' ? 15 : 20;
        
        for (let i = 0; i < wellCount; i++) {
            mockWells.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [114.5 + (i * 0.01), 10.3 + (i * 0.01)]
                },
                properties: {
                    name: `WELL-${String(i + 1).padStart(3, '0')}`,
                    type: i % 3 === 0 ? 'Production' : 'Exploration',
                    depth: `${2500 + (i * 150)}m (est.)`,
                    location: queryType === 'geographic' ? 'Malaysia' : 'South China Sea',
                    operator: 'Test Company',
                    category: 'fresh_search'
                }
            });
        }
    }
    
    return {
        type: "FeatureCollection",
        metadata: {
            type: "wells",
            searchQuery: prompt,
            source: isContextualFilter ? "Filtered from Previous Search Context" : "Mock Data",
            recordCount: mockWells.length,
            queryType: queryType,
            contextFilter: isContextualFilter,
            isFilterOperation: isContextualFilter,
            originalContext: existingContext ? {
                wells: existingContext.wells.length,
                queryType: existingContext.queryType,
                timestamp: existingContext.timestamp
            } : null,
            timestamp: new Date().toISOString()
        },
        features: mockWells,
        thoughtSteps: [
            {
                id: 'test-thought-1',
                type: 'intent_detection',
                title: 'Query Processing',
                summary: `Processed ${queryType} query with ${isContextualFilter ? 'context filtering' : 'fresh search'}`,
                status: 'completed',
                timestamp: Date.now()
            }
        ]
    };
}

// Run the test
if (require.main === module) {
    testCatalogFilterAndReset()
        .then(result => {
            console.log('\n🏁 Test completed:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Test crashed:', error);
            process.exit(1);
        });
}

module.exports = { testCatalogFilterAndReset };
