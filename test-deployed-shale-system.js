const axios = require('axios');

async function testDeployedShaleSystem() {
    console.log('Testing deployed shale analysis system...');
    
    const graphqlEndpoint = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';
    
    // Test comprehensive shale analysis request
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
                chatSessionId: 'test-session-123',
                content: 'Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals.',
                role: 'user'
            }
        }
    };
    
    try {
        console.log('Sending test request to deployed system...');
        const response = await axios.post(graphqlEndpoint, testQuery, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // This will fail auth but should show us the error
            },
            timeout: 30000
        });
        
        console.log('Response received:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Test failed with error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Network/Other error:', error.message);
        }
    }
}

// Also test a simpler request to isolate the issue
async function testBasicRequest() {
    console.log('\nTesting basic agent request...');
    
    const graphqlEndpoint = 'https://doqkjfftczdazcaeyrt6kdcrvu.appsync-api.us-east-1.amazonaws.com/graphql';
    
    const testQuery = {
        query: `
            mutation SendChatMessage($input: SendChatMessageInput!) {
                sendChatMessage(input: $input) {
                    id
                    role
                    content
                    responseComplete
                }
            }
        `,
        variables: {
            input: {
                chatSessionId: 'test-session-123',
                content: 'Hello, can you help me with well analysis?',
                role: 'user'
            }
        }
    };
    
    try {
        const response = await axios.post(graphqlEndpoint, testQuery, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log('Basic response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('Basic test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runTests() {
    await testBasicRequest();
    await testDeployedShaleSystem();
}

runTests().catch(console.error);
