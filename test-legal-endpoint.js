#!/usr/bin/env node

/**
 * Test Legal Tagging Service Endpoint
 * Verifies the correct endpoint is accessible and returns expected schema
 */

const https = require('https');

const CONFIG = {
  legalTagsUrl: 'https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql',
  apiKey: 'da2-skk2h4ny2fh53ds33jvrxdzi5a'
};

/**
 * Make a GraphQL introspection query to test the endpoint
 */
function testEndpoint() {
  const query = {
    query: `
      query IntrospectionQuery {
        __schema {
          queryType {
            name
            fields {
              name
              type {
                name
              }
            }
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
      'x-api-key': CONFIG.apiKey
    }
  };

  console.log('🔍 Testing Legal Tagging Service endpoint...');
  console.log(`📡 URL: ${CONFIG.legalTagsUrl}`);
  console.log(`🔑 API Key: ${CONFIG.apiKey.substring(0, 10)}...`);

  const req = https.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.data && response.data.__schema) {
          console.log('✅ Legal Tagging Service endpoint is working!');
          console.log('📝 Available queries:');
          
          const queries = response.data.__schema.queryType.fields;
          queries.forEach(field => {
            console.log(`   - ${field.name}: ${field.type.name || 'Custom Type'}`);
          });
        } else if (response.errors) {
          console.log('❌ GraphQL errors:', response.errors);
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
  });

  req.write(postData);
  req.end();
}

// Run the test
testEndpoint();
