const { generateClient } = require('aws-amplify/api');
const { Amplify } = require('aws-amplify');
const { signIn } = require('aws-amplify/auth');
const config = require('./amplify_outputs.json');
require('dotenv').config({ path: '.env.local' });

// Configure Amplify
Amplify.configure(config);

// Sign in function
const signInUser = async () => {
    try {
        console.log('🔐 Signing in user...');
        await signIn({
            username: process.env.TEST_USERNAME,
            password: process.env.TEST_PASSWORD
        });
        console.log('✅ User signed in successfully');
    } catch (error) {
        console.error('❌ Sign in failed:', error);
        throw error;
    }
};

const testTerrainUIArtifacts = async () => {
    console.log('🧪 Testing Terrain Analysis UI Artifacts Fix...\n');
    
    try {
        // Sign in first
        await signInUser();
        const client = generateClient();
        
        // Query that should trigger renewable energy agent and generate wind_farm_terrain_analysis artifacts
        const terrainQuery = "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970";
        
        console.log('🌱 Sending terrain analysis query:', terrainQuery);
        
        const mutation = `
            mutation ProcessQuery($query: String!, $sessionId: String!) {
                processQuery(query: $query, sessionId: $sessionId) {
                    success
                    message
                    artifacts
                    thoughtSteps {
                        step
                        reasoning
                        result
                    }
                    sourceAttribution {
                        title
                        url
                    }
                    agentUsed
                }
            }
        `;
        
        const variables = {
            query: terrainQuery,
            sessionId: `test_session_${Date.now()}`
        };
        
        const response = await client.graphql({
            query: mutation,
            variables: variables
        });
        
        console.log('\n📊 Full Response Details:');
        console.log('Success:', response.data.processQuery.success);
        console.log('Agent Used:', response.data.processQuery.agentUsed);
        console.log('Message Length:', response.data.processQuery.message?.length || 0);
        console.log('Thought Steps:', response.data.processQuery.thoughtSteps?.length || 0);
        
        // Check artifacts
        console.log('\n🎨 Artifacts Analysis:');
        if (response.data.processQuery.artifacts) {
            console.log('✅ Artifacts found!');
            console.log('Raw artifacts:', response.data.processQuery.artifacts);
            
            try {
                const parsedArtifacts = JSON.parse(response.data.processQuery.artifacts);
                console.log('🏗️ Parsed artifacts structure:');
                console.log('Type:', typeof parsedArtifacts);
                
                if (Array.isArray(parsedArtifacts)) {
                    console.log('📦 Artifacts array with', parsedArtifacts.length, 'items:');
                    parsedArtifacts.forEach((artifact, i) => {
                        console.log(`  Artifact ${i}:`, artifact);
                        if (artifact.messageContentType) {
                            console.log(`  🎯 Content Type: ${artifact.messageContentType}`);
                        }
                    });
                } else if (parsedArtifacts.messageContentType) {
                    console.log('🎯 Single artifact content type:', parsedArtifacts.messageContentType);
                    console.log('🏗️ Artifact data:', parsedArtifacts);
                }
                
                // Check if we have wind_farm_terrain_analysis
                const hasTerrainArtifact = JSON.stringify(parsedArtifacts).includes('wind_farm_terrain_analysis');
                if (hasTerrainArtifact) {
                    console.log('🎉 SUCCESS: Found wind_farm_terrain_analysis artifact!');
                    console.log('🖥️  Frontend should now render WindFarmTerrainComponent instead of basic text');
                } else {
                    console.log('❌ ISSUE: No wind_farm_terrain_analysis artifact found');
                }
                
            } catch (parseError) {
                console.error('❌ Error parsing artifacts JSON:', parseError.message);
                console.log('Raw artifacts content:', response.data.processQuery.artifacts);
            }
        } else {
            console.log('❌ No artifacts found in response');
        }
        
        // Show message content for context
        console.log('\n📝 Response Message:');
        console.log(response.data.processQuery.message?.substring(0, 500) + (response.data.processQuery.message?.length > 500 ? '...' : ''));
        
        console.log('\n🔍 Next Steps:');
        if (response.data.processQuery.artifacts && JSON.stringify(response.data.processQuery.artifacts).includes('wind_farm_terrain_analysis')) {
            console.log('✅ Frontend fix successful! Terrain analysis should now show rich UI components');
            console.log('🌐 Test in browser: Navigate to chat and enter the terrain analysis query');
        } else {
            console.log('⚠️  Need to check why terrain analysis artifacts are not generating properly');
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error);
        if (error.errors) {
            console.error('GraphQL Errors:', error.errors);
        }
    }
};

// Run the test
testTerrainUIArtifacts().catch(console.error);
