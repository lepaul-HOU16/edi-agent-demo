/**
 * Test script to verify deleteRenewableProject GraphQL mutation works
 */

const { generateClient } = require('aws-amplify/data');

async function testDeleteMutation() {
    console.log('Testing deleteRenewableProject mutation...\n');
    
    try {
        // This will fail without proper AWS credentials, but we can see if the mutation exists
        const client = generateClient();
        
        console.log('✓ generateClient() works');
        console.log('✓ Client mutations available:', Object.keys(client.mutations || {}).slice(0, 10));
        
        // Check if deleteRenewableProject exists
        if (client.mutations && client.mutations.deleteRenewableProject) {
            console.log('✅ deleteRenewableProject mutation EXISTS');
        } else {
            console.log('❌ deleteRenewableProject mutation NOT FOUND');
            console.log('Available mutations:', Object.keys(client.mutations || {}));
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDeleteMutation();
