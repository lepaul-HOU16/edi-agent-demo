const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
});

const lambda = new AWS.Lambda();

async function directTerrainAnalysisTest() {
    console.log('🔧 DIRECT TERRAIN ANALYSIS DEBUGGING\n');
    
    // Test the renewable energy agent directly
    const payload = {
        message: 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970',
        chatSessionId: `debug-terrain-${Date.now()}`,
        userId: 'debug-user'
    };
    
    console.log('🚀 Testing with payload:', JSON.stringify(payload, null, 2));
    
    try {
        console.log('📞 Calling Lambda function...');
        
        const result = await lambda.invoke({
            FunctionName: 'amplify-agentsforenergy-l-productionagentfunctionl-JJPz6npjb9ph',
            Payload: JSON.stringify(payload)
        }).promise();
        
        if (result.StatusCode === 200) {
            const response = JSON.parse(result.Payload);
            
            console.log('\n📋 LAMBDA RESPONSE ANALYSIS:');
            console.log('Success:', response.success);
            console.log('Agent Used:', response.agentUsed);
            console.log('Message:', response.message?.substring(0, 300) + '...');
            
            console.log('\n🎨 ARTIFACTS ANALYSIS:');
            if (response.artifacts && response.artifacts.length > 0) {
                console.log(`✅ Found ${response.artifacts.length} artifact(s):`);
                
                response.artifacts.forEach((artifact, index) => {
                    console.log(`\n   Artifact ${index + 1}:`);
                    console.log(`   - Type: ${artifact.messageContentType || artifact.type}`);
                    console.log(`   - Title: ${artifact.title || 'No title'}`);
                    
                    if (artifact.messageContentType === 'wind_farm_terrain_analysis' || artifact.type === 'wind_farm_terrain_analysis') {
                        console.log('   🌍 TERRAIN ANALYSIS ARTIFACT FOUND!');
                        console.log(`   - Suitability Score: ${artifact.suitabilityScore || 'Missing'}`);
                        console.log(`   - Exclusion Zones: ${artifact.exclusionZoneDetails?.length || 'Missing'}`);
                        console.log(`   - Constraints: ${artifact.constraintDetails?.length || 'Missing'}`);
                        console.log(`   - Recommendations: ${artifact.recommendations?.length || 'Missing'}`);
                        
                        // Check for all expected fields
                        const expectedFields = [
                            'suitabilityScore', 'riskAssessment', 'exclusionZoneDetails', 
                            'constraintDetails', 'recommendations', 'coordinates'
                        ];
                        
                        console.log('\n   📊 Field Validation:');
                        expectedFields.forEach(field => {
                            const hasField = artifact[field] !== undefined;
                            console.log(`   ${hasField ? '✅' : '❌'} ${field}: ${hasField ? 'Present' : 'Missing'}`);
                        });
                        
                    } else {
                        console.log('   ❌ Wrong artifact type - expected wind_farm_terrain_analysis');
                        console.log('   📄 Full artifact structure:', JSON.stringify(artifact, null, 4));
                    }
                });
                
            } else {
                console.log('❌ NO ARTIFACTS FOUND');
                console.log('🐛 This is the problem - terrain analysis should generate artifacts');
                
                // Check if it's routing to the right agent
                if (response.agentUsed !== 'renewableEnergyAgent') {
                    console.log('🔀 ROUTING ISSUE: Not using renewableEnergyAgent');
                    console.log(`   Current agent: ${response.agentUsed}`);
                } else {
                    console.log('🎯 ROUTING OK: Using renewableEnergyAgent');
                    console.log('❗ ISSUE: Agent is not generating artifacts');
                }
            }
            
            console.log('\n🧠 THOUGHT STEPS ANALYSIS:');
            if (response.thoughtSteps && response.thoughtSteps.length > 0) {
                console.log(`Found ${response.thoughtSteps.length} thought steps:`);
                response.thoughtSteps.forEach((step, index) => {
                    console.log(`   ${index + 1}. ${step.title} (${step.status})`);
                    if (step.summary) {
                        console.log(`      Summary: ${step.summary}`);
                    }
                });
            } else {
                console.log('No thought steps found');
            }
            
            console.log('\n📥 FULL RESPONSE STRUCTURE:');
            console.log(JSON.stringify(response, null, 2));
            
        } else {
            console.log('❌ Lambda failed with status:', result.StatusCode);
            console.log('Error:', result.Payload);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('If no artifacts are generated, the issue could be:');
    console.log('1. Pattern matching not recognizing terrain analysis requests');
    console.log('2. renewableTerrainAnalysisTool not being called');  
    console.log('3. Tool failing silently and not returning artifacts');
    console.log('4. Artifact transformation failing');
    console.log('\nNext step: Check deployment status and fix the identified issue.');
}

// Run the direct test
directTerrainAnalysisTest().catch(console.error);
