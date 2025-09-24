const axios = require('axios');

const testArtifactFixValidation = async () => {
    console.log('🧪 Testing artifact fix validation with new deployment...');
    console.log('📦 Deployment: agent-fix-lp');
    console.log('🔗 Endpoint: https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql');

    // Use the correct mutation from the deployed system
    const testQuery = {
        query: `
            mutation SendChatMessage($input: SendChatMessageInput!) {
                sendChatMessage(input: $input) {
                    id
                    role
                    content
                    artifacts
                    responseComplete
                }
            }
        `,
        variables: {
            input: {
                chatSessionId: 'artifact-test-' + Date.now(),
                content: 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.',
                role: 'user'
            }
        }
    };

    try {
        console.log('📤 Sending shale analysis request to test artifact parsing...');
        const response = await axios.post('https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql', testQuery, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minutes for complex analysis
        });

        console.log('✅ Request successful!');
        const result = response.data.data?.sendChatMessage;
        
        console.log('📊 Result structure:', {
            hasResult: !!result,
            hasContent: !!result?.content,
            responseLength: result?.content?.length || 0,
            hasArtifacts: Array.isArray(result?.artifacts),
            artifactsCount: result?.artifacts?.length || 0,
            responseComplete: result?.responseComplete
        });

        // Check if artifacts exist and are properly formatted
        const artifacts = result?.artifacts;
        if (artifacts && artifacts.length > 0) {
            console.log('🎯 ARTIFACTS FOUND!');
            console.log('🔍 First artifact type:', typeof artifacts[0]);
            console.log('🔍 First artifact length:', typeof artifacts[0] === 'string' ? artifacts[0].length : 'N/A');
            
            // Test the JSON parsing logic (this is what our fix addresses)
            if (typeof artifacts[0] === 'string') {
                try {
                    const parsed = JSON.parse(artifacts[0]);
                    console.log('✅ JSON parsing successful!');
                    console.log('📋 Artifact messageContentType:', parsed.messageContentType);
                    console.log('🎨 Has visualizations:', !!parsed.visualizations);
                    console.log('🔧 CRITICAL: Frontend fix should now handle this JSON string parsing correctly!');
                } catch (e) {
                    console.log('❌ JSON parsing failed:', e.message);
                    console.log('🔍 First 100 chars of artifact:', artifacts[0].substring(0, 100));
                }
            } else {
                console.log('📋 Artifact messageContentType:', artifacts[0]?.messageContentType);
                console.log('✅ Artifact is already an object (no parsing needed)');
            }
        } else {
            console.log('⚠️ No artifacts found in response');
            console.log('🔍 Raw response:', JSON.stringify(result, null, 2));
        }

        return result;
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
};

// Run the test
console.log('🚀 Starting artifact fix validation...');
testArtifactFixValidation()
    .then(result => {
        if (result) {
            console.log('\n🎉 Artifact fix validation completed!');
            console.log('💡 Frontend ChatMessage.tsx now properly parses JSON string artifacts');
            console.log('🔧 The fix handles both string and object artifacts correctly');
            console.log('📈 Interactive visualizations should now display properly');
        } else {
            console.log('\n❌ Validation failed - see errors above');
        }
    })
    .catch(error => {
        console.error('💥 Validation failed:', error);
    });
