#!/usr/bin/env node

/**
 * Test Legal Tag Creation and Retrieval
 */

const https = require('https');
const http = require('http');

// Configuration from .env.local
const CONFIG = {
  legalTagsUrl: 'https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql',
  dataPartition: 'osdu',
  idToken: process.env.ID_TOKEN || '',
  accessToken: process.env.ACCESS_TOKEN || ''
};

/**
 * Make a GraphQL request with JWT authentication
 */
async function makeGraphQLRequestWithJWT(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.legalTagsUrl);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify({
      query,
      variables
    });

    const headers = {
      'Authorization': `Bearer ${CONFIG.idToken}`,
      'Content-Type': 'application/json',
      'data-partition-id': CONFIG.dataPartition,
      'x-access-token': CONFIG.accessToken,
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test creating a legal tag
 */
async function testCreateLegalTag() {
  console.log('➕ Testing Legal Tag Creation...\n');
  
  const mutation = `
    mutation CreateLegalTag($input: CreateLegalTagInput!) {
      createLegalTag(input: $input) {
        id
        name
        description
        properties
        createdBy
        createdAt
      }
    }
  `;

  const timestamp = Date.now();
  const variables = {
    input: {
      name: `test-legal-tag-${timestamp}`,
      description: 'Test legal tag created for diagnosis',
      properties: JSON.stringify({
        countryOfOrigin: ['US'],
        contractId: 'test-contract-diagnosis',
        expirationDate: '2025-12-31T23:59:59.999Z',
        originator: 'OSDU-Diagnosis-Test',
        dataType: 'Public',
        securityClassification: 'Public',
        personalData: 'NonPersonalData',
        exportClassification: 'EAR99'
      })
    }
  };

  try {
    console.log('Creating legal tag with input:', JSON.stringify(variables, null, 2));
    
    const result = await makeGraphQLRequestWithJWT(mutation, variables);
    
    console.log('Create response:', JSON.stringify(result, null, 2));

    if (result.data?.createLegalTag) {
      const createdTag = result.data.createLegalTag;
      console.log('✅ Legal tag creation successful!');
      console.log(`   Created: ${createdTag.name} (${createdTag.id})`);
      console.log(`   Description: ${createdTag.description}`);
      console.log(`   Created At: ${createdTag.createdAt || 'N/A'}`);
      return createdTag;
    } else if (result.errors) {
      console.log('❌ Legal tag creation failed with errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
        if (error.path) {
          console.log(`     Path: ${error.path.join('.')}`);
        }
      });
      return null;
    } else {
      console.log('❌ Legal tag creation failed - no data returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Legal tag creation request failed:', error.message);
    return null;
  }
}

/**
 * Test retrieving legal tags
 */
async function testRetrieveLegalTags() {
  console.log('\n📋 Testing Legal Tag Retrieval...\n');
  
  const query = `
    query GetLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
      getLegalTags(dataPartition: $dataPartition, filter: $filter) {
        items {
          id
          name
          description
          properties
          createdBy
          createdAt
        }
        pagination {
          nextToken
        }
      }
    }
  `;

  const variables = {
    dataPartition: CONFIG.dataPartition,
    filter: {}
  };

  try {
    console.log('Retrieving legal tags...');
    
    const result = await makeGraphQLRequestWithJWT(query, variables);
    
    console.log('Retrieve response:', JSON.stringify(result, null, 2));

    if (result.data?.getLegalTags) {
      const legalTags = result.data.getLegalTags;
      console.log(`✅ Legal tags retrieval successful - found ${legalTags.items?.length || 0} legal tags`);
      
      if (legalTags.items && legalTags.items.length > 0) {
        console.log('\nLegal tags:');
        legalTags.items.forEach((tag, index) => {
          console.log(`  ${index + 1}. ${tag.name} (${tag.id})`);
          console.log(`     Description: ${tag.description || 'N/A'}`);
          console.log(`     Created: ${tag.createdAt || 'N/A'}`);
          console.log(`     Properties: ${typeof tag.properties === 'string' ? 'JSON String' : 'Object'}`);
        });
      } else {
        console.log('   No legal tags found');
      }
      
      return legalTags;
    } else if (result.errors) {
      console.log('❌ Legal tags retrieval failed with errors:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
      return null;
    } else {
      console.log('❌ Legal tags retrieval failed - no data returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Legal tags retrieval request failed:', error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function runCreateAndRetrieveTest() {
  console.log('🚀 Legal Tag Create and Retrieve Test');
  console.log('====================================\n');
  
  if (!CONFIG.idToken || !CONFIG.accessToken) {
    console.log('❌ Missing JWT tokens!');
    console.log('Set ID_TOKEN and ACCESS_TOKEN environment variables');
    return;
  }

  console.log('Configuration:');
  console.log(`  Endpoint: ${CONFIG.legalTagsUrl}`);
  console.log(`  Data Partition: ${CONFIG.dataPartition}`);
  console.log('='.repeat(60));

  // Step 1: Create a legal tag
  const createdTag = await testCreateLegalTag();
  
  if (!createdTag) {
    console.log('\n❌ Cannot proceed with retrieval test - creation failed');
    return;
  }

  // Step 2: Wait a moment for consistency
  console.log('\n⏳ Waiting 2 seconds for data consistency...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Retrieve legal tags
  const retrievedTags = await testRetrieveLegalTags();

  // Step 4: Verify the created tag is in the retrieved list
  if (retrievedTags && retrievedTags.items) {
    const foundTag = retrievedTags.items.find(tag => tag.id === createdTag.id);
    if (foundTag) {
      console.log('\n✅ SUCCESS: Created legal tag was found in retrieval!');
      console.log('   The create/retrieve flow is working correctly.');
    } else {
      console.log('\n⚠️  WARNING: Created legal tag was not found in retrieval.');
      console.log('   This might indicate a consistency issue or filtering problem.');
    }
  }

  console.log('\n🏁 Test Complete!');
}

// Run the test
if (require.main === module) {
  if (CONFIG.idToken && CONFIG.accessToken) {
    runCreateAndRetrieveTest().catch(console.error);
  } else {
    console.log('⚠️  No JWT tokens provided. Please set ID_TOKEN and ACCESS_TOKEN environment variables.');
    console.log('Example: ID_TOKEN="eyJ..." ACCESS_TOKEN="eyJ..." node test-create-legal-tag.js');
  }
}

module.exports = {
  testCreateLegalTag,
  testRetrieveLegalTags,
  runCreateAndRetrieveTest
};