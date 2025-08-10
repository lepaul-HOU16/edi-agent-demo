#!/usr/bin/env node

// Simple test script to verify GraphQL group operations
const https = require('https');
const { URL } = require('url');

const API_URL = 'https://ucbxezqhn5gjdcfak4ffsn65da.appsync-api.us-east-1.amazonaws.com/graphql';
const API_KEY = 'da2-ctlrmykumbcatcmqi3xykhohcy';

async function testGraphQLRequest(query, variables = {}) {
  const requestBody = JSON.stringify({
    query,
    variables
  });

  const url = new URL(API_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody),
      'x-api-key': API_KEY
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(requestBody);
    req.end();
  });
}

async function testCreateGroup() {
  console.log('Testing createGroup mutation...');
  
  const mutation = `
    mutation CreateGroup($input: CreateGroupInput!) {
      createGroup(input: $input) {
        name
        description
        dataPartition
        createdBy
        createdAt
      }
    }
  `;

  const variables = {
    input: {
      dataPartition: 'osdu',
      name: 'test.group@osdu.dataservices.energy',
      description: 'Test group for validation'
    }
  };

  try {
    const response = await testGraphQLRequest(mutation, variables);
    
    if (response.errors) {
      console.error('❌ CreateGroup failed:', response.errors);
      return false;
    }
    
    if (response.data && response.data.createGroup) {
      console.log('✅ CreateGroup successful:', response.data.createGroup);
      return true;
    }
    
    console.error('❌ Unexpected response:', response);
    return false;
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testListGroups() {
  console.log('Testing listGroups query...');
  
  const query = `
    query ListGroups($dataPartition: String!) {
      listGroups(dataPartition: $dataPartition) {
        items {
          name
          description
          dataPartition
          createdBy
          createdAt
        }
      }
    }
  `;

  const variables = {
    dataPartition: 'osdu'
  };

  try {
    const response = await testGraphQLRequest(query, variables);
    
    if (response.errors) {
      console.error('❌ ListGroups failed:', response.errors);
      return false;
    }
    
    if (response.data && response.data.listGroups) {
      console.log('✅ ListGroups successful:', response.data.listGroups);
      return true;
    }
    
    console.error('❌ Unexpected response:', response);
    return false;
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing GraphQL Group Operations\n');
  
  const results = [];
  
  // Test createGroup
  results.push(await testCreateGroup());
  console.log('');
  
  // Test listGroups
  results.push(await testListGroups());
  console.log('');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! GraphQL operations are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  return passed === total;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });