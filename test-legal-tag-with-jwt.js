#!/usr/bin/env node

/**
 * Legal Tag Testing with JWT Authentication
 * 
 * This script tests legal tag queries using the same Cognito JWT authentication
 * that the frontend uses, to diagnose the actual issue.
 */

const https = require('https');
const http = require('http');

// Configuration from .env.local
const CONFIG = {
  legalTagsUrl: 'https://lpw54db5vvgrbodtvyfi4nytjq.appsync-api.us-east-1.amazonaws.com/graphql',
  dataPartition: 'osdu',
  // These would need to be obtained from a logged-in browser session
  idToken: process.env.ID_TOKEN || '',
  accessToken: process.env.ACCESS_TOKEN || ''
};

/**
 * Make a GraphQL request with JWT authentication (like the frontend)
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

    // Use the same headers as the frontend
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
          console.log(`Request Status: ${res.statusCode} ${res.statusMessage}`);
          console.log('Request Headers:', JSON.stringify(headers, null, 2));
          console.log('Response:', JSON.stringify(result, null, 2));
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
 * Test the exact queries that the frontend is using
 */
async function testFrontendQueries() {
  console.log('🧪 Testing Frontend Legal Tag Queries with JWT Authentication\n');
  
  if (!CONFIG.idToken || !CONFIG.accessToken) {
    console.log('❌ Missing JWT tokens!');
    console.log('To get tokens:');
    console.log('1. Open browser dev tools on the legal tags page');
    console.log('2. Go to Application/Storage > Local Storage');
    console.log('3. Look for Amplify tokens or run: window.__OIDC_TOKENS__');
    console.log('4. Set ID_TOKEN and ACCESS_TOKEN environment variables');
    console.log('\nAlternatively, check the browser console for token values.');
    return;
  }

  // Test 1: listLegalTags (primary query from frontend)
  console.log('🔬 Testing listLegalTags (primary frontend query)...');
  const listQuery = `
    query ListLegalTags($dataPartition: String!, $filter: LegalTagFilterInput, $pagination: PaginationInput) {
      listLegalTags(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
        items {
          id
          name
          description
          properties
          createdBy
          createdAt
          updatedBy
          updatedAt
        }
        pagination {
          nextToken
        }
      }
    }
  `;

  try {
    const listResult = await makeGraphQLRequestWithJWT(listQuery, {
      dataPartition: CONFIG.dataPartition,
      filter: {},
      pagination: { limit: 10 }
    });

    if (listResult.data?.listLegalTags) {
      console.log('✅ listLegalTags successful!');
      console.log(`Found ${listResult.data.listLegalTags.items?.length || 0} legal tags`);
      
      if (listResult.data.listLegalTags.items?.length > 0) {
        console.log('\nSample legal tags:');
        listResult.data.listLegalTags.items.slice(0, 2).forEach((tag, index) => {
          console.log(`  ${index + 1}. ${tag.name} (${tag.id})`);
          console.log(`     Description: ${tag.description || 'N/A'}`);
          console.log(`     Properties: ${typeof tag.properties === 'string' ? 'JSON String' : 'Object'}`);
        });
      }
    } else if (listResult.errors) {
      console.log('❌ listLegalTags failed:');
      listResult.errors.forEach(error => console.log(`   - ${error.message}`));
    }
  } catch (error) {
    console.log('❌ listLegalTags request failed:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: getLegalTags (fallback query from frontend)
  console.log('🔬 Testing getLegalTags (fallback frontend query)...');
  const getQuery = `
    query GetLegalTags($dataPartition: String!, $filter: LegalTagFilterInput) {
      getLegalTags(dataPartition: $dataPartition, filter: $filter) {
        items {
          id
          name
          description
          properties
          createdBy
          createdAt
          updatedBy
          updatedAt
        }
        pagination {
          nextToken
        }
      }
    }
  `;

  try {
    const getResult = await makeGraphQLRequestWithJWT(getQuery, {
      dataPartition: CONFIG.dataPartition,
      filter: {}
    });

    if (getResult.data?.getLegalTags) {
      console.log('✅ getLegalTags successful!');
      console.log(`Found ${getResult.data.getLegalTags.items?.length || 0} legal tags`);
    } else if (getResult.errors) {
      console.log('❌ getLegalTags failed:');
      getResult.errors.forEach(error => console.log(`   - ${error.message}`));
    }
  } catch (error) {
    console.log('❌ getLegalTags request failed:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Simple query to test if the issue is with the specific legal tag queries
  console.log('🔬 Testing simple query to verify JWT authentication...');
  const simpleQuery = `
    query TestAuth {
      __typename
    }
  `;

  try {
    const simpleResult = await makeGraphQLRequestWithJWT(simpleQuery, {});
    
    if (simpleResult.data) {
      console.log('✅ JWT authentication is working');
      console.log('The issue is specifically with legal tag query permissions');
    } else if (simpleResult.errors) {
      console.log('❌ JWT authentication failed:');
      simpleResult.errors.forEach(error => console.log(`   - ${error.message}`));
    }
  } catch (error) {
    console.log('❌ Simple query failed:', error.message);
  }
}

/**
 * Test what the actual response structure looks like
 */
async function testResponseStructure() {
  console.log('\n🔍 Testing Response Structure Analysis...\n');
  
  // Test with a minimal query to see what fields are actually available
  const introspectionQuery = `
    query TestLegalTagFields {
      __type(name: "Query") {
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  `;

  try {
    const result = await makeGraphQLRequestWithJWT(introspectionQuery, {});
    
    if (result.data?.__type?.fields) {
      console.log('Available Query fields:');
      const legalTagFields = result.data.__type.fields.filter(field => 
        field.name.toLowerCase().includes('legal') || field.name.toLowerCase().includes('tag')
      );
      
      legalTagFields.forEach(field => {
        console.log(`  - ${field.name}: ${field.type.name || field.type.kind}`);
      });
      
      if (legalTagFields.length === 0) {
        console.log('  No legal tag fields found in Query type');
      }
    }
  } catch (error) {
    console.log('❌ Introspection failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runJWTTests() {
  console.log('🚀 Legal Tag JWT Authentication Testing');
  console.log('=====================================\n');
  
  console.log('Configuration:');
  console.log(`  Endpoint: ${CONFIG.legalTagsUrl}`);
  console.log(`  Data Partition: ${CONFIG.dataPartition}`);
  console.log(`  ID Token Available: ${CONFIG.idToken ? 'Yes' : 'No'}`);
  console.log(`  Access Token Available: ${CONFIG.accessToken ? 'Yes' : 'No'}`);
  console.log('='.repeat(60));

  await testFrontendQueries();
  await testResponseStructure();

  console.log('\n🏁 JWT Testing Complete!');
  console.log('\n💡 Next Steps:');
  console.log('1. If authentication works but queries fail, check IAM permissions');
  console.log('2. If queries work, the issue is in frontend response parsing');
  console.log('3. Compare working response structure with frontend expectations');
}

// Instructions for getting tokens
console.log('📋 To get JWT tokens for testing:');
console.log('1. Open the legal tags page in your browser');
console.log('2. Open browser dev tools (F12)');
console.log('3. In the console, run: console.log(window.__OIDC_TOKENS__)');
console.log('4. Copy the idToken and accessToken values');
console.log('5. Run this script with: ID_TOKEN="..." ACCESS_TOKEN="..." node test-legal-tag-with-jwt.js');
console.log('');

// Run tests if tokens are provided
if (require.main === module) {
  if (CONFIG.idToken && CONFIG.accessToken) {
    runJWTTests().catch(console.error);
  } else {
    console.log('⚠️  No JWT tokens provided. Please set ID_TOKEN and ACCESS_TOKEN environment variables.');
    console.log('Example: ID_TOKEN="eyJ..." ACCESS_TOKEN="eyJ..." node test-legal-tag-with-jwt.js');
  }
}

module.exports = {
  makeGraphQLRequestWithJWT,
  testFrontendQueries,
  runJWTTests
};