const axios = require('axios');

const testIntentDetection = async () => {
    console.log('🧪 Testing Agent Intent Detection...');
    console.log('📦 Deployment: agent-fix-lp');
    console.log('🔗 Endpoint: https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql');

    const testCases = [
        {
            name: "List Wells",
            prompt: "List all available wells",
            expectedIntent: "list_wells"
        },
        {
            name: "Well Info", 
            prompt: "Get information about SANDSTONE_RESERVOIR_001",
            expectedIntent: "well_info"
        },
        {
            name: "Calculate Porosity",
            prompt: "Calculate porosity for SANDSTONE_RESERVOIR_001",
            expectedIntent: "calculate_porosity"
        },
        {
            name: "Shale Analysis",
            prompt: "Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method",
            expectedIntent: "shale_analysis_workflow"
        },
        {
            name: "Formation Evaluation",
            prompt: "Formation evaluation for SANDSTONE_RESERVOIR_001", 
            expectedIntent: "formation_evaluation"
        }
    ];

    const mutation = `
        mutation SendChatMessage($input: SendChatMessageInput!) {
            sendChatMessage(input: $input) {
                id
                role
                content
                artifacts
                responseComplete
            }
        }
    `;

    console.log('\n🔄 Testing different prompts to check intent detection...\n');

    for (const testCase of testCases) {
        console.log(`📝 Testing: ${testCase.name}`);
        console.log(`💬 Prompt: "${testCase.prompt}"`);
        console.log(`🎯 Expected Intent: ${testCase.expectedIntent}`);
        
        try {
            const response = await axios.post('https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql', {
                query: mutation,
                variables: {
                    input: {
                        chatSessionId: 'intent-test-' + Date.now(),
                        content: testCase.prompt,
                        role: 'user'
                    }
                }
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });

            const result = response.data.data?.sendChatMessage;
            
            console.log(`✅ Response received`);
            console.log(`📤 Message: "${result?.content?.substring(0, 100)}..."`);
            console.log(`🎯 Artifacts count: ${result?.artifacts?.length || 0}`);
            
            // Check if it's always returning shale analysis response
            const isShaleResponse = result?.content?.includes('Comprehensive gamma ray shale analysis completed successfully');
            console.log(`🔍 Is Shale Response: ${isShaleResponse ? 'YES (WRONG!)' : 'NO (Good)'}`);
            
            console.log('---');
            
        } catch (error) {
            console.error(`❌ Error testing ${testCase.name}:`, error.message);
            console.log('---');
        }
    }
};

// Run the test
testIntentDetection()
    .then(() => {
        console.log('\n🎉 Intent detection test completed!');
        console.log('💡 If all prompts return shale analysis, the intent detection is broken');
    })
    .catch(error => {
        console.error('💥 Test failed:', error);
    });
