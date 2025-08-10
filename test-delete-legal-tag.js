#!/usr/bin/env node

/**
 * Test Legal Tag Delete Functionality
 * This script tests the delete legal tag mutation
 */

const https = require('https');

const CONFIG = {
  legalTagsUrl: 'https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql',
  dataPartition: 'osdu',
  // You'll need to paste fresh tokens here
  accessToken: 'PASTE_FRESH_ACCESS_TOKEN_HERE',
  idToken: 'PASTE_FRESH_ID_TOKEN_HERE'
};

/**
 * Test creating a legal tag first, then deleting it
 */
async function testDeleteLegalTag() {
  console.log('🧪 Testing Legal Tag Delete Functionality...\n');

  // Step 1: Create a test legal tag
  console.log('📝 Step 1: Creating a test legal tag...');
  const testTag = await createTestLegalTag();
  
  if (!testTag) {
    console.log('❌ Failed to create test legal tag. Cannot proceed with delete test.');
    return;
  }

  console.log(`✅ Test legal tag created with ID: ${testTag.id}\n`);

  // Step 2: Delete the test legal tag
  console.log('🗑️  Step 2: Deleting the test legal tag...');
  const deleteResult = await deleteLegalTag(testTag.id);
  
  if (deleteResult) {
    console.log('✅ Legal tag deleted successfully!');
  } else {
    console.log('❌ Failed to delete legal tag.');
  }

  // Step 3: Verify the tag is gone
  console.log('\n🔍 Step 3: Verifying the tag is deleted...');
  const verifyResult = await getLegalTag(testTag.id);
  
  if (!verifyResult) {
    console.log('✅ Verification successful: Legal tag no longer exists.');
  } else {
    console.log('⚠️  Warning: Legal tag still exists after deletion.');
  }
}

/**
 * Create a test legal tag
 */
function createTestLegalTag() {
  return new Promise((resolve, reject) => {
    const mutation = {
      query: `
        mutation CreateLegalTag($input: CreateLegalTagInput!, $dataPartition: String!) {
          createLegalTag(input: $input, dataPartition: $dataPartition) {
            id
            name
            description
          }
        }
      `,
      variables: {
        input: {
          name: `test-delete-tag-${Date.now()}`,
          description: 'Test legal tag for delete functionality',
          properties: JSON.stringify({
            dataType: 'Test',
            securityClassification: 'Public',
            originator: 'Test System'
          })
        },
        dataPartition: CONFIG.dataPartition
      }
    };

    makeGraphQLRequest(mutation, (result) => {
      if (result?.createLegalTag) {
        resolve(result.createLegalTag);
      } else {
        console.log('❌ Create mutation failed:', result);
        resolve(null);
      }
    });
  });
}

/**
 * Delete a legal tag
 */
function deleteLegalTag(id) {
  return new Promise((resolve, reject) => {
    const mutation = {
      query: `
        mutation DeleteLegalTag($id: ID!, $dataPartition: String!) {
          deleteLegalTag(id: $id, dataPartition: $dataPartition)
        }
      `,
      variables: {
        id: id,
        dataPartition: CONFIG.dataPartition
      }
    };

    makeGraphQLRequest(mutation, (result) => {
      if (result?.deleteLegalTag === true) {
        resolve(true);
      } else {
        console.log('❌ Delete mutation failed:', result);
        resolve(false);
      }
    });
  });
}

/**
 * Get a legal tag to verify it exists/doesn't exist
 */
function getLegalTag(id) {
  return new Promise((resolve, reject) => {
    const query = {
      query: `
        query GetLegalTag($id: ID!, $dataPartition: String!) {
          getLegalTag(id: $id, dataPartition: $dataPartition) {
            id
            name
          }
        }
      `,
      variables: {
        id: id,
        dataPartition: CONFIG.dataPartition
      }
    };

    makeGraphQLRequest(query, (result) => {
      resolve(result?.getLegalTag || null);
    });
  });
}

/**
 * Make a GraphQL request
 */
function makeGraphQLRequest(query, callback) {
  const postData = JSON.stringify(query);
  const url = new URL(CONFIG.legalTagsUrl);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': `Bearer ${CONFIG.accessToken}`,
      'data-partition-id': CONFIG.dataPartition
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.errors) {
          console.log('❌ GraphQL errors:', response.errors);
          callback(null);
        } else {
          callback(response.data);
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', error.message);
        console.log('📄 Raw response:', data);
        callback(null);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
    callback(null);
  });

  req.write(postData);
  req.end();
}

// Check if tokens are provided
if (CONFIG.accessToken === 'PASTE_FRESH_ACCESS_TOKEN_HERE') {
  console.log('❌ Please update the CONFIG with fresh Cognito tokens before running this test.');
  console.log('   You can get them from your browser session.');
  process.exit(1);
}

// Run the test
testDeleteLegalTag();
