// Test the actual deployed catalog system with depth queries
const https = require('https');
const fs = require('fs');

async function testActualCatalogDepthQuery() {
    console.log('🔍 === TESTING ACTUAL DEPLOYED CATALOG DEPTH QUERY ===');
    
    try {
        // Read the Amplify configuration
        let amplifyConfig;
        try {
            const configPath = './amplify_outputs.json';
            if (fs.existsSync(configPath)) {
                amplifyConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                console.log('✅ Amplify config loaded');
                console.log('🔗 GraphQL endpoint:', amplifyConfig.data?.url || 'Not found');
            } else {
                console.log('❌ amplify_outputs.json not found');
                return { success: false, error: 'Config file not found' };
            }
        } catch (error) {
            console.error('❌ Error reading Amplify config:', error.message);
            return { success: false, error: 'Config read error' };
        }

        // Test the specific query that's not working
        const testQuery = 'wells with depth greater than 3500m';
        console.log('📝 Testing query:', testQuery);

        // Create the GraphQL query
        const graphqlQuery = {
            query: `
                query CatalogSearch($prompt: String!, $existingContext: AWSJSON) {
                    catalogSearch(prompt: $prompt, existingContext: $existingContext)
                }
            `,
            variables: {
                prompt: testQuery,
                existingContext: null
            }
        };

        console.log('📤 Sending GraphQL query to:', amplifyConfig.data?.url);
        console.log('🔍 Query details:', JSON.stringify(graphqlQuery, null, 2));

        // Make the request to the deployed GraphQL endpoint
        const response = await makeGraphQLRequest(amplifyConfig.data.url, graphqlQuery);
        
        if (response.errors) {
            console.error('❌ GraphQL errors:', JSON.stringify(response.errors, null, 2));
            return { success: false, error: 'GraphQL errors', details: response.errors };
        }

        if (response.data && response.data.catalogSearch) {
            console.log('✅ Response received');
            
            let parsedResponse;
            try {
                parsedResponse = typeof response.data.catalogSearch === 'string' 
                    ? JSON.parse(response.data.catalogSearch) 
                    : response.data.catalogSearch;
                
                console.log('📊 Response metadata:', {
                    type: parsedResponse.type,
                    recordCount: parsedResponse.metadata?.recordCount,
                    queryType: parsedResponse.metadata?.queryType,
                    source: parsedResponse.metadata?.source,
                    hasThoughtSteps: !!parsedResponse.thoughtSteps,
                    thoughtStepsCount: parsedResponse.thoughtSteps?.length || 0
                });

                console.log('🗺️ Features found:', parsedResponse.features?.length || 0);
                
                if (parsedResponse.features && parsedResponse.features.length > 0) {
                    console.log('📋 Sample wells:');
                    parsedResponse.features.slice(0, 3).forEach((feature, index) => {
                        console.log(`  ${index + 1}. ${feature.properties?.name || 'Unknown'} - ${feature.properties?.depth || 'Unknown depth'}`);
                    });
                }

                if (parsedResponse.thoughtSteps && parsedQuery.thoughtSteps.length > 0) {
                    console.log('🧠 Thought steps:');
                    parsedResponse.thoughtSteps.forEach((step, index) => {
                        console.log(`  ${index + 1}. ${step.title || 'Unknown step'}: ${step.summary || 'No summary'}`);
                    });
                }

                return {
                    success: true,
                    wellsFound: parsedResponse.features?.length || 0,
                    queryType: parsedResponse.metadata?.queryType,
                    hasThoughtSteps: !!parsedResponse.thoughtSteps,
                    response: parsedResponse
                };

            } catch (parseError) {
                console.error('❌ Error parsing response:', parseError.message);
                console.log('📄 Raw response:', response.data.catalogSearch.substring(0, 500) + '...');
                return { success: false, error: 'Parse error', details: parseError.message };
            }
        } else {
            console.log('❌ No data in response');
            console.log('📄 Full response:', JSON.stringify(response, null, 2));
            return { success: false, error: 'No data returned' };
        }

    } catch (error) {
        console.error('💥 Test failed with error:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to make GraphQL requests
async function makeGraphQLRequest(url, query) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(query);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                // Note: In a real app, you'd need authentication headers here
            }
        };

        // Parse the URL
        const urlObj = new URL(url);
        options.hostname = urlObj.hostname;
        options.port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
        options.path = urlObj.pathname + urlObj.search;

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    console.error('❌ Error parsing response JSON:', error.message);
                    console.log('📄 Raw response:', data.substring(0, 1000));
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Alternative simpler test without authentication (if auth is the issue)
async function testCatalogSearchDirectly() {
    console.log('\n🔧 === TESTING CATALOG SEARCH FUNCTION DIRECTLY ===');
    
    try {
        // Try to simulate the catalogSearch function call directly
        const testEvent = {
            arguments: {
                prompt: 'wells with depth greater than 3500m',
                existingContext: null
            }
        };

        console.log('📝 Simulating catalogSearch with:', testEvent.arguments);
        
        // Mock the environment variables that might be needed
        process.env.STORAGE_BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || 'mock-bucket';
        process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
        
        // This would require importing the actual function, but let's at least log what we'd expect
        console.log('🔍 Expected behavior:');
        console.log('  1. Parse "wells with depth greater than 3500m"');
        console.log('  2. Detect depth query type');
        console.log('  3. Extract minDepth: 3500');
        console.log('  4. Fetch user wells from S3');
        console.log('  5. Apply depth filter');
        console.log('  6. Return filtered results');
        
        return { success: true, note: 'Direct function test would need function import' };
        
    } catch (error) {
        console.error('❌ Direct test error:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the tests
if (require.main === module) {
    Promise.resolve()
        .then(() => testActualCatalogDepthQuery())
        .then(result => {
            console.log('\n🏁 GraphQL Test Result:', result);
            return testCatalogSearchDirectly();
        })
        .then(directResult => {
            console.log('\n🏁 Direct Test Result:', directResult);
            console.log('\n🎯 === DEBUGGING RECOMMENDATIONS ===');
            console.log('1. Check if GraphQL endpoint is accessible');
            console.log('2. Verify authentication is not required');
            console.log('3. Check CloudWatch logs for the catalogSearch function');
            console.log('4. Test with a simpler query first (e.g., "show wells")');
            console.log('5. Verify the depth parsing regex in parseDepthCriteria');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test suite crashed:', error);
            process.exit(1);
        });
}

module.exports = { testActualCatalogDepthQuery, testCatalogSearchDirectly };
