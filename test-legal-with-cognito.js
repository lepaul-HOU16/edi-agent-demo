#!/usr/bin/env node

/**
 * Test Legal Tagging Service with Cognito JWT Tokens
 * This matches exactly how the frontend authenticates with the service
 */

const https = require('https');

const CONFIG = {
  legalTagsUrl: 'https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql',
  dataPartition: 'osdu',
  accessToken: 'PASTE_FRESH_ACCESS_TOKEN_HERE',
  idToken: 'PASTE_FRESH_ID_TOKEN_HERE'
};

/**
 * Test the getLegalTags query that the frontend is trying to use
 */
function testGetLegalTags() {
  const query = {
    query: `
      query GetLegalTags($dataPartition: String!, $limit: Int) {
        getLegalTags(dataPartition: $dataPartition, limit: $limit) {
          id
          name
          description
          properties
        }
      }
    `,
    variables: {
      dataPartition: CONFIG.dataPartition,
      limit: 10
    }
  };

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
      'data-partition-id': CONFIG.dataPartition,
      'User-Agent': 'OSDU-Frontend-Test/1.0'
    }
  };

  console.log('🔍 Testing Legal Tagging Service with Cognito tokens...');
  console.log(`📡 URL: ${CONFIG.legalTagsUrl}`);
  console.log(`🏢 Data Partition: ${CONFIG.dataPartition}`);
  console.log(`🔑 Using Access Token: ${CONFIG.accessToken.substring(0, 50)}...`);

  const req = https.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.data && response.data.getLegalTags) {
          console.log('✅ Legal Tagging Service is working!');
          console.log(`📝 Found ${response.data.getLegalTags.length} legal tags:`);
          
          response.data.getLegalTags.forEach((tag, index) => {
            console.log(`   ${index + 1}. ${tag.name} (${tag.id})`);
            if (tag.description) {
              console.log(`      Description: ${tag.description}`);
            }
          });
        } else if (response.errors) {
          console.log('❌ GraphQL errors:');
          response.errors.forEach(error => {
            console.log(`   - ${error.message}`);
            if (error.extensions) {
              console.log(`     Extensions:`, error.extensions);
            }
          });
        } else {
          console.log('⚠️  Unexpected response format:', response);
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', error.message);
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
    if (error.code === 'ENOTFOUND') {
      console.log('🔍 This suggests a DNS resolution issue with the endpoint');
    }
  });

  req.write(postData);
  req.end();
}

/**
 * Test a simple introspection query first
 */
function testIntrospection() {
  const query = {
    query: `
      query {
        __schema {
          queryType {
            name
          }
        }
      }
    `
  };

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

  console.log('🔍 Testing GraphQL introspection...');

  const req = https.request(options, (res) => {
    console.log(`📊 Introspection Status Code: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.data && response.data.__schema) {
          console.log('✅ GraphQL introspection successful!');
          console.log('🚀 Now testing getLegalTags query...\n');
          
          // If introspection works, test the actual query
          setTimeout(testGetLegalTags, 1000);
        } else if (response.errors) {
          console.log('❌ Introspection errors:', response.errors);
        } else {
          console.log('⚠️  Unexpected introspection response:', response);
        }
      } catch (error) {
        console.log('❌ Failed to parse introspection response:', error.message);
        console.log('📄 Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Introspection request failed:', error.message);
  });

  req.write(postData);
  req.end();
}

// Start with introspection test
testIntrospection();
