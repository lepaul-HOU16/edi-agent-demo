const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const amplifyOutputs = require('./amplify_outputs.json');

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient();

async function testTerrainAnalysisViaGraphQL() {
    console.log('🔧 TESTING TERRAIN ANALYSIS VIA GRAPHQL API\n');
    
    const testMessage = 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970';
    console.log(`🎯 Query: "${testMessage}"`);
    
    try {
        console.log('📡 Calling GraphQL API...');
        
        const result = await client.graphql({
            query: `
                mutation ProcessAgentQuery($message: String!, $chatSessionId: String!, $userId: String!) {
                    processAgentQuery(message: $message, chatSessionId: $chatSessionId, userId: $userId)
                }
            `,
            variables: {
                message: testMessage,
                chatSessionId: `test-terrain-${Date.now()}`,
                userId: 'test-user'
            }
        });
        
        console.log('\n📋 GraphQL Response Status: SUCCESS');
        
        // Parse the response
        const response = JSON.parse(result.data.processAgentQuery);
        
        console.log('\n📊 AGENT ANALYSIS:');
        console.log(`✓ Success: ${response.success}`);
        console.log(`✓ Agent Used: ${response.agentUsed}`);
        console.log(`✓ Message: ${response.message?.substring(0, 200)}...`);
        
        console.log('\n🎨 ARTIFACT ANALYSIS:');
        if (response.artifacts && response.artifacts.length > 0) {
            console.log(`✅ Found ${response.artifacts.length} artifact(s):`);
            
            response.artifacts.forEach((artifact, index) => {
                console.log(`\n   📦 Artifact ${index + 1}:`);
                console.log(`   - Type: ${artifact.messageContentType || artifact.type || 'No type'}`);
                console.log(`   - Title: ${artifact.title || 'No title'}`);
                
                if (artifact.messageContentType === 'wind_farm_terrain_analysis' || artifact.type === 'wind_farm_terrain_analysis') {
                    console.log('   🌍 ✅ WIND FARM TERRAIN ANALYSIS FOUND!');
                    console.log(`   - Suitability Score: ${artifact.suitabilityScore || 'Missing'}%`);
                    console.log(`   - Exclusion Zones: ${artifact.exclusionZoneDetails?.length || 'Missing'} zones`);
                    console.log(`   - Constraints: ${artifact.constraintDetails?.length || 'Missing'} constraints`);
                    console.log(`   - Recommendations: ${artifact.recommendations?.length || 'Missing'} items`);
                    
                    if (artifact.exclusionZoneDetails && artifact.exclusionZoneDetails.length > 0) {
                        console.log(`   - Zone Types: ${artifact.exclusionZoneDetails.map(z => z.type).join(', ')}`);
                    }
                    
                    console.log('   🎯 RICH ARTIFACT VALIDATION: ✅ PASSED');
                    return true; // Success!
                    
                } else if (artifact.messageContentType === 'renewable_energy_guidance') {
                    console.log('   ⚠️  Got generic renewable guidance instead of terrain analysis');
                    console.log('   🔍 This suggests pattern matching or tool execution issue');
                    
                } else {
                    console.log(`   ❌ Unexpected artifact type: ${artifact.messageContentType || artifact.type}`);
                }
            });
            
        } else {
            console.log('❌ NO ARTIFACTS FOUND');
            console.log('🐛 This confirms the problem - no terrain analysis artifacts generated');
            
            // Check routing
            if (response.agentUsed === 'renewableEnergyAgent') {
                console.log('✓ Routing OK: Using renewableEnergyAgent');
                console.log('❗ Issue: Agent not generating terrain analysis artifacts');
            } else {
                console.log(`❌ Routing Issue: Expected renewableEnergyAgent, got ${response.agentUsed}`);
            }
        }
        
        console.log('\n🧠 THOUGHT STEPS:');
        if (response.thoughtSteps && response.thoughtSteps.length > 0) {
            console.log(`✓ Found ${response.thoughtSteps.length} thought steps:`);
            response.thoughtSteps.forEach((step, index) => {
                console.log(`   ${index + 1}. ${step.title} (${step.status})`);
            });
        } else {
            console.log('❌ No thought steps - may indicate agent execution failure');
        }
        
        return response;
        
    } catch (error) {
        console.error('❌ GraphQL Error:', error);
        if (error.errors) {
            console.error('📋 Error Details:', error.errors);
        }
        return null;
    }
}

// Main test execution
testTerrainAnalysisViaGraphQL()
    .then(response => {
        console.log('\n' + '='.repeat(70));
        console.log('🎯 TEST SUMMARY:');
        
        if (response && response.success) {
            if (response.artifacts?.some(a => a.messageContentType === 'wind_farm_terrain_analysis')) {
                console.log('🎉 SUCCESS: Rich terrain analysis artifacts are working!');
                console.log('✅ Users should see interactive terrain analysis with:');
                console.log('   - Exclusion zone maps');
                console.log('   - Constraint analysis');
                console.log('   - Development recommendations');
                console.log('   - Risk assessments');
            } else {
                console.log('⚠️  PARTIAL SUCCESS: Agent responding but not generating rich artifacts');
                console.log('🔧 Next step: Debug terrain analysis tool execution');
            }
        } else {
            console.log('❌ FAILURE: Terrain analysis not working properly');
            console.log('🔧 Issues to investigate:');
            console.log('   1. Agent routing problems');
            console.log('   2. Pattern matching not detecting terrain requests');
            console.log('   3. Tool execution failures');
            console.log('   4. Artifact generation problems');
        }
    })
    .catch(error => {
        console.error('💥 Test script failed:', error);
        process.exit(1);
    });
