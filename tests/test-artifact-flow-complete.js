const { setAmplifyEnvVars, getConfiguredAmplifyClient } = require('./utils/amplifyUtils.ts');

async function testCompleteArtifactFlow() {
    console.log('=== COMPREHENSIVE ARTIFACT FLOW TEST ===');
    
    try {
        // Set up Amplify environment
        console.log('Setting up Amplify environment...');
        const envResult = await setAmplifyEnvVars();
        if (!envResult.success) {
            throw new Error(`Failed to set Amplify env vars: ${envResult.error}`);
        }
        
        const client = getConfiguredAmplifyClient();
        
        // Test 1: Direct Lambda invocation to ensure agent produces artifacts
        console.log('\n=== TEST 1: Direct GraphQL Mutation ===');
        
        const testChatSessionId = `test-session-${Date.now()}`;
        const testMessage = 'Perform comprehensive shale analysis for well HUNTON-EAST-1';
        
        console.log('Invoking agent via GraphQL...');
        console.log('Chat Session ID:', testChatSessionId);
        console.log('Message:', testMessage);
        
        const invokeResponse = await client.mutations.invokeLightweightAgent({
            chatSessionId: testChatSessionId,
            message: testMessage,
            foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
            userId: 'test-user'
        });
        
        console.log('\n=== GRAPHQL RESPONSE ANALYSIS ===');
        console.log('Response success:', !!invokeResponse.data);
        console.log('Response errors:', invokeResponse.errors?.length || 0);
        
        if (invokeResponse.errors && invokeResponse.errors.length > 0) {
            console.log('GraphQL Errors:', invokeResponse.errors);
        }
        
        if (invokeResponse.data) {
            console.log('Agent Success:', invokeResponse.data.success);
            console.log('Agent Message Length:', invokeResponse.data.message?.length || 0);
            console.log('Agent Artifacts Count:', invokeResponse.data.artifacts?.length || 0);
            
            if (invokeResponse.data.artifacts && invokeResponse.data.artifacts.length > 0) {
                console.log('\n🎯 ARTIFACTS FOUND IN GRAPHQL RESPONSE!');
                console.log('First artifact structure:', JSON.stringify(invokeResponse.data.artifacts[0], null, 2));
            } else {
                console.log('\n❌ NO ARTIFACTS in GraphQL response');
                console.log('Response data structure:', {
                    success: invokeResponse.data.success,
                    hasMessage: !!invokeResponse.data.message,
                    messagePreview: invokeResponse.data.message?.substring(0, 100),
                    artifactsType: typeof invokeResponse.data.artifacts,
                    artifactsIsArray: Array.isArray(invokeResponse.data.artifacts),
                    artifactsLength: invokeResponse.data.artifacts?.length
                });
            }
        }
        
        // Test 2: Create a ChatMessage with artifacts (simulate frontend behavior)
        console.log('\n=== TEST 2: ChatMessage Creation with Artifacts ===');
        
        if (invokeResponse.data?.success) {
            const testArtifacts = [
                {
                    messageContentType: 'comprehensive_shale_analysis',
                    analysisType: 'gamma_ray_shale_analysis',
                    wellName: 'HUNTON-EAST-1',
                    testData: 'This is a test artifact'
                }
            ];
            
            console.log('Creating ChatMessage with test artifacts...');
            
            const aiMessage = {
                role: 'ai',
                content: { text: invokeResponse.data.message },
                chatSessionId: testChatSessionId,
                responseComplete: true,
                artifacts: testArtifacts
            };
            
            const { data: messageData, errors: messageErrors } = await client.models.ChatMessage.create(aiMessage);
            
            if (messageErrors) {
                console.log('❌ Error creating message:', messageErrors);
            } else {
                console.log('✅ Message created successfully');
                console.log('Message ID:', messageData?.id);
                
                // Query the message back to verify artifacts were saved
                if (messageData?.id) {
                    const { data: retrievedMessage } = await client.models.ChatMessage.get({ id: messageData.id });
                    console.log('Retrieved message artifacts:', retrievedMessage?.artifacts?.length || 0);
                    if (retrievedMessage?.artifacts && retrievedMessage.artifacts.length > 0) {
                        console.log('✅ Artifacts successfully stored and retrieved');
                    } else {
                        console.log('❌ Artifacts not found in stored message');
                    }
                }
            }
        }
        
        console.log('\n=== SUMMARY ===');
        if (invokeResponse.data?.artifacts?.length > 0) {
            console.log('✅ Artifacts are being returned by GraphQL mutation');
        } else {
            console.log('❌ Artifacts are NOT being returned by GraphQL mutation');
            console.log('   This suggests the issue is in the Lambda handler or agent logic');
        }
        
    } catch (error) {
        console.error('\n=== TEST ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testCompleteArtifactFlow();
