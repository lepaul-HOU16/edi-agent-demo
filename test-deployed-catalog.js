const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const amplifyOutputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

async function testDeployedCatalogSearch() {
    try {
        console.log('🧪 Testing deployed catalog search function...');
        console.log('Query: "my wells"');
        
        const result = await client.graphql({
            query: `
                query CatalogSearch($prompt: String!) {
                    catalogSearch(prompt: $prompt)
                }
            `,
            variables: {
                prompt: "my wells"
            }
        });
        
        console.log('\n📋 Raw result:', result);
        
        // Parse the JSON response
        const searchData = JSON.parse(result.data.catalogSearch);
        
        console.log('\n📊 Parsed result:');
        console.log(`- Type: ${searchData.type}`);
        console.log(`- Record count: ${searchData.metadata.recordCount}`);
        console.log(`- Query type: ${searchData.metadata.queryType}`);
        console.log(`- Source: ${searchData.metadata.source}`);
        console.log(`- Features found: ${searchData.features.length}`);
        
        if (searchData.features.length > 0) {
            console.log('\n🗺️ Sample wells:');
            searchData.features.slice(0, 5).forEach((feature, index) => {
                console.log(`  ${index + 1}. ${feature.properties.name} at [${feature.geometry.coordinates[0]}, ${feature.geometry.coordinates[1]}]`);
            });
        }
        
        return searchData.features.length;
        
    } catch (error) {
        console.error('❌ Error testing deployed catalog search:', error);
        if (error.errors) {
            console.error('GraphQL errors:', error.errors);
        }
        return 0;
    }
}

// Main execution
testDeployedCatalogSearch()
    .then(count => {
        console.log(`\n🏁 Test complete. Deployed function returned ${count} wells.`);
        if (count > 0) {
            console.log(`\n✅ SUCCESS! The "my wells" search is now working!`);
            console.log(`You should now see ${count} wells when searching for "my wells" in the UI.`);
        } else {
            console.log(`\n❌ Still returning 0 wells. There may be additional issues to investigate.`);
        }
    })
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
