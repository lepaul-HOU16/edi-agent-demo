const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'us-west-2',
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
});

const lambda = new AWS.Lambda();

async function testTerrainArtifactGeneration() {
    console.log('🧪 Testing terrain analysis artifact generation...\n');
    
    const testCases = [
        {
            name: 'Direct Terrain Analysis Request',
            message: 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970'
        },
        {
            name: 'Terrain Analysis with Setbacks',
            message: 'Analyze terrain at 32.7767, -96.7970 with 100 meter setbacks for wind farm'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 Test Case: ${testCase.name}`);
        console.log(`💬 Message: "${testCase.message}"`);
        
        try {
            const payload = {
                message: testCase.message,
                chatSessionId: `test-terrain-${Date.now()}`,
                userId: 'test-user'
            };
            
            console.log('🚀 Calling agents Lambda...');
            
            const result = await lambda.invoke({
                FunctionName: 'amplify-d1eeg2gu6ddc3z-ma-agentshandlerlambda61-UdWDGiJ8gm7R',
                Payload: JSON.stringify(payload)
            }).promise();
            
            if (result.StatusCode === 200) {
                const response = JSON.parse(result.Payload);
                console.log('✅ Lambda Response Status:', result.StatusCode);
                
                if (response.success) {
                    console.log('📄 Response Message:', response.message.substring(0, 200) + '...');
                    console.log('🤖 Agent Used:', response.agentUsed);
                    
                    if (response.artifacts && response.artifacts.length > 0) {
                        console.log('🎨 Artifacts Found:', response.artifacts.length);
                        
                        response.artifacts.forEach((artifact, index) => {
                            console.log(`   Artifact ${index + 1}:`);
                            console.log(`   - Type: ${artifact.messageContentType || artifact.type}`);
                            console.log(`   - Title: ${artifact.title || 'No title'}`);
                            
                            // Check for wind_farm_terrain_analysis specific fields
                            if (artifact.messageContentType === 'wind_farm_terrain_analysis' || artifact.type === 'wind_farm_terrain_analysis') {
                                console.log('🌍 WIND FARM TERRAIN ANALYSIS ARTIFACT FOUND!');
                                console.log(`   - Suitability Score: ${artifact.suitabilityScore}%`);
                                console.log(`   - Exclusion Zones: ${artifact.exclusionZoneDetails?.length || 0} zones`);
                                console.log(`   - Constraints: ${artifact.constraintDetails?.length || 0} constraints`);
                                console.log(`   - Recommendations: ${artifact.recommendations?.length || 0} items`);
                                
                                if (artifact.exclusionZoneDetails) {
                                    console.log('   - Zone Types:', artifact.exclusionZoneDetails.map(z => z.type).join(', '));
                                }
                                
                                console.log('✅ ARTIFACT FORMAT VALIDATION: PASSED');
                            } else {
                                console.log('❌ Expected wind_farm_terrain_analysis artifact, got:', artifact.messageContentType || artifact.type);
                            }
                        });
                    } else {
                        console.log('❌ NO ARTIFACTS FOUND - This is the problem!');
                        console.log('Expected: wind_farm_terrain_analysis artifact with rich data');
                    }
                    
                    if (response.thoughtSteps && response.thoughtSteps.length > 0) {
                        console.log('🧠 Thought Steps:', response.thoughtSteps.length);
                        response.thoughtSteps.forEach((step, index) => {
                            console.log(`   Step ${index + 1}: ${step.title} (${step.status})`);
                        });
                    }
                    
                } else {
                    console.log('❌ Lambda Response Error:', response.message);
                }
            } else {
                console.log('❌ Lambda Status Code:', result.StatusCode);
                console.log('❌ Lambda Error:', result.Payload);
            }
            
        } catch (error) {
            console.error('❌ Test Error:', error.message);
        }
        
        console.log('\n' + '='.repeat(80) + '\n');
    }
    
    console.log('🎯 SUMMARY:');
    console.log('Expected: Rich wind_farm_terrain_analysis artifacts with:');
    console.log('- Detailed exclusion zones');
    console.log('- Risk assessments'); 
    console.log('- Terrain constraints');
    console.log('- Development recommendations');
    console.log('- Interactive map data');
    console.log('\nIf only basic text responses are returned, the artifact generation is failing.');
}

// Run the test
testTerrainArtifactGeneration().catch(console.error);
