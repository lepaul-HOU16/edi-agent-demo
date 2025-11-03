/**
 * Debug why weather pattern detection isn't working in production
 */

function debugWeatherPatternDetection() {
    console.log('🔍 Debugging Weather Pattern Detection');
    console.log('=====================================');
    
    const testQuery = "can you show me weather maps for the area near my wells";
    const lowerQuery = testQuery.toLowerCase().trim();
    
    console.log('🧪 Test Query:', testQuery);
    console.log('🔤 Lowercase Query:', lowerQuery);
    console.log('');
    
    // Test each pattern individually
    console.log('🔍 Testing individual patterns:');
    
    const pattern1 = lowerQuery.includes('weather map');
    console.log(`1. includes('weather map'): ${pattern1}`);
    console.log(`   - Query contains "weather map": "${lowerQuery}".includes("weather map") = ${pattern1}`);
    
    const pattern2Weather = lowerQuery.includes('weather');
    const pattern2Map = lowerQuery.includes('map');
    const pattern2Combined = pattern2Weather && pattern2Map;
    console.log(`2. includes('weather') && includes('map'): ${pattern2Combined}`);
    console.log(`   - weather: ${pattern2Weather}, map: ${pattern2Map}`);
    
    const pattern3Weather = lowerQuery.includes('weather');
    const pattern3Near = lowerQuery.includes('near');
    const pattern3Wells = lowerQuery.includes('wells');
    const pattern3Combined = pattern3Weather && pattern3Near && pattern3Wells;
    console.log(`3. includes('weather') && includes('near') && includes('wells'): ${pattern3Combined}`);
    console.log(`   - weather: ${pattern3Weather}, near: ${pattern3Near}, wells: ${pattern3Wells}`);
    
    // Test the full condition
    const fullCondition = pattern1 || pattern2Combined || pattern3Combined;
    console.log('');
    console.log(`🎯 Full condition result: ${fullCondition}`);
    
    if (fullCondition) {
        console.log('✅ Pattern SHOULD match - weather maps query type should be detected');
        console.log('🚨 If this is not working in production, there may be a deployment issue');
        
        // Test what the actual query type would be
        const expectedResult = {
            queryType: 'weatherMaps',
            parameters: {
                includeUserWells: true,
                weatherTypes: ['temperature', 'precipitation'],
                additionalWeatherTypes: ['wind', 'pressure', 'humidity'],
                radius: 50,
                region: 'user_wells_area',
                coordinates: null
            }
        };
        
        console.log('');
        console.log('📋 Expected Result:', expectedResult);
        
    } else {
        console.log('❌ Pattern does NOT match - this is the bug!');
    }
    
    // Test potential issues
    console.log('');
    console.log('🔍 Potential Issues to Check:');
    console.log('1. Is the deployed version different from the code?');
    console.log('2. Is there logging in the Lambda to see what query it receives?');
    console.log('3. Is the parseNLPQuery function being called at all?');
    console.log('4. Could there be a different code path bypassing the pattern?');
    
    return {
        queryTested: testQuery,
        patternsMatch: fullCondition,
        individualPatterns: {
            weatherMap: pattern1,
            weatherAndMap: pattern2Combined,
            weatherNearWells: pattern3Combined
        }
    };
}

// Test against the exact production scenario
function testProductionScenario() {
    console.log('');
    console.log('🏭 Testing Production Scenario');
    console.log('==============================');
    
    const productionQuery = "can you show me weather maps for the area near my wells";
    console.log('Query from production:', productionQuery);
    
    // Simulate the exact parseNLPQuery logic
    const parseNLPQuery = (searchQuery) => {
        const lowerQuery = searchQuery.toLowerCase().trim();
        console.log('🔤 Processing query:', lowerQuery);
        
        // PRIORITY 1: Check for weather map queries first
        if (lowerQuery.includes('weather map') || 
            (lowerQuery.includes('weather') && lowerQuery.includes('map')) ||
            (lowerQuery.includes('weather') && lowerQuery.includes('near') && lowerQuery.includes('wells'))) {
            console.log('✅ Weather pattern MATCHED!');
            return {
                queryType: 'weatherMaps',
                parameters: {
                    includeUserWells: true,
                    weatherTypes: ['temperature', 'precipitation'],
                    additionalWeatherTypes: ['wind', 'pressure', 'humidity'],
                    radius: 50,
                    region: 'user_wells_area',
                    coordinates: null
                }
            };
        }
        
        console.log('❌ Weather pattern did NOT match, checking other patterns...');
        
        // Check other patterns that might be matching instead
        if (lowerQuery.includes('show all wells') || lowerQuery.includes('all wells')) {
            console.log('⚠️ Matched "all wells" pattern instead');
            return { queryType: 'allWells', parameters: {} };
        }
        
        if (lowerQuery.includes('my wells')) {
            console.log('⚠️ Matched "my wells" pattern instead');
            return { queryType: 'myWells', parameters: {} };
        }
        
        // Default to general search
        console.log('⚠️ Defaulting to general search');
        return { queryType: 'general', parameters: { text: searchQuery } };
    };
    
    const result = parseNLPQuery(productionQuery);
    console.log('🎯 Parse result:', result);
    
    if (result.queryType === 'weatherMaps') {
        console.log('🎉 SUCCESS: Query would be handled by weather maps handler');
        console.log('📊 Expected: 27 personal wells + weather overlay');
    } else {
        console.log('💥 FAILURE: Query would NOT be handled by weather maps handler');
        console.log('📊 Actual result: Falls through to', result.queryType, 'handler');
        console.log('🚨 This explains why you see 259 wells instead of weather overlay');
    }
    
    return result;
}

// Main debug function
function main() {
    console.log('🚀 Weather Pattern Detection Debug');
    console.log('==================================');
    
    const basicTest = debugWeatherPatternDetection();
    const productionTest = testProductionScenario();
    
    console.log('');
    console.log('📋 DIAGNOSIS SUMMARY:');
    console.log(`Pattern should match: ${basicTest.patternsMatch}`);
    console.log(`Production test result: ${productionTest.queryType}`);
    
    if (basicTest.patternsMatch && productionTest.queryType === 'weatherMaps') {
        console.log('✅ Logic is correct - likely a deployment/caching issue');
        console.log('💡 Try: Hard refresh browser, clear cache, or redeploy');
    } else {
        console.log('❌ Logic has a bug - pattern detection needs to be fixed');
    }
    
    return { basicTest, productionTest };
}

if (require.main === module) {
    main();
}

module.exports = { debugWeatherPatternDetection, testProductionScenario };
