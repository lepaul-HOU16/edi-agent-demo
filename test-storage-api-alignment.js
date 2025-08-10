#!/usr/bin/env node

/**
 * Test script to verify frontend-backend API alignment for storage service
 * This script tests the storage service endpoints to ensure they match the frontend expectations
 */

const https = require('https');

// Configuration from our deployed backend
const STORAGE_API_URL = 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql';
const TEST_TOKEN = 'eyJraWQiOiJ1MjNcLytLR04wN3dFKzJkOXlwcUp1MEJUYm1LRzljamtrOGpOWG1KK3hcL1E9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJiNGI4MzRhOC03MDgxLTcwMTgtZDgwZC02YjYzZDBlODIwYTEiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9lVk5mUUg0blciLCJjb2duaXRvOnVzZXJuYW1lIjoidGVzdHVzZXIiLCJnaXZlbl9uYW1lIjoiVGVzdCIsIm9yaWdpbl9qdGkiOiIxNWY5ODc0OC02ODAwLTRlYzYtYjNiOC1hN2NiYzBkZWFhY2UiLCJhdWQiOiI2dGZjZWdxc24xdWc1OTFsdGJyamVmbmExOSIsImV2ZW50X2lkIjoiM2RjODg2ZGMtNjFjMy00ODU5LWE4MGQtNDY1MGVmOTY1ZGVhIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTQ3NTQ0MzMsImV4cCI6MTc1NDc1ODAzMywiaWF0IjoxNzU0NzU0NDMzLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJqdGkiOiI0MGE5NWU5YS1lOGRhLTRiNzYtYTYwYi04YzViMDg5ZTA3MjYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.MpGm6ffIVvPH4Gn7U8wD37X2EtpKn_3l6qUnNq8lMjpy-ycRUXfSd12D8AWogFWU7kAdsiEaGZin2-8TEdAR7kU_fwJhuxXQM0tfAKiVBNENhMbMUUMmGMeqOOssO2IaFEewUqvlhyYZu3q35DMhWZBU7C-6jrx-yz1MKBdR7ByFf4epuoptUrQk4CmV2xN_mHkFIqxck3Y1o6TzqNDYrWDwBbjMrldC2vF9XQgN8nidBDmpRGSGYp6plCOTIjRYA3tMJlNresHLcoAFTvDRlC4dCbXYmzQhKhqQJ4KfwFL88v_9lyEEwOVAyVjEQSE421ulszK-xkOUZFY49jBNCg';

/**
 * Make a GraphQL request to the storage service
 */
function makeGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query,
      variables
    });

    const url = new URL(STORAGE_API_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'data-partition-id': 'osdu',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test the health check endpoint
 */
async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  
  const query = `
    query {
      healthCheck
    }
  `;

  try {
    const result = await makeGraphQLRequest(query);
    
    if (result.data?.healthCheck === 'OK') {
      console.log('✅ Health check PASSED');
      return { status: 'success', data: result.data };
    } else {
      console.log('❌ Health check FAILED:', result);
      return { status: 'error', error: 'Health check did not return OK', data: result };
    }
  } catch (error) {
    console.log('❌ Health check ERROR:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test record creation
 */
async function testRecordCreation() {
  console.log('📝 Testing record creation...');
  
  const mutation = `
    mutation CreateRecord($dataPartition: String!, $input: CreateRecordInput!) {
      createRecord(dataPartition: $dataPartition, input: $input) {
        id
        kind
        version
        createTime
        data
      }
    }
  `;

  const variables = {
    dataPartition: 'osdu',
    input: {
      kind: 'osdu:wks:dataset--File.Generic:1.0.0',
      acl: {
        viewers: ['testuser'],
        owners: ['testuser']
      },
      legal: {
        legaltags: ['osdu-public-usa-dataset-7643990'],
        otherRelevantDataCountries: ['US']
      },
      data: JSON.stringify({
        Name: 'Frontend-Backend Alignment Test',
        Description: 'Test record created to verify API alignment',
        TestTimestamp: new Date().toISOString()
      })
    }
  };

  try {
    const result = await makeGraphQLRequest(mutation, variables);
    
    if (result.data?.createRecord?.id) {
      console.log('✅ Record creation PASSED');
      console.log('   Record ID:', result.data.createRecord.id);
      return { status: 'success', data: result.data, recordId: result.data.createRecord.id };
    } else {
      console.log('❌ Record creation FAILED:', result);
      return { status: 'error', error: 'Record creation did not return an ID', data: result };
    }
  } catch (error) {
    console.log('❌ Record creation ERROR:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test record retrieval
 */
async function testRecordRetrieval(recordId) {
  console.log('📖 Testing record retrieval...');
  
  const query = `
    query GetRecord($id: ID!, $dataPartition: String!) {
      getRecord(id: $id, dataPartition: $dataPartition) {
        id
        kind
        version
        createTime
        data
        acl {
          viewers
          owners
        }
        legal {
          legaltags
          otherRelevantDataCountries
        }
      }
    }
  `;

  const variables = {
    id: recordId,
    dataPartition: 'osdu'
  };

  try {
    const result = await makeGraphQLRequest(query, variables);
    
    if (result.data?.getRecord?.id) {
      console.log('✅ Record retrieval PASSED');
      console.log('   Retrieved record:', result.data.getRecord.id);
      return { status: 'success', data: result.data };
    } else {
      console.log('❌ Record retrieval FAILED:', result);
      return { status: 'error', error: 'Record retrieval did not return the record', data: result };
    }
  } catch (error) {
    console.log('❌ Record retrieval ERROR:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test record listing
 */
async function testRecordListing() {
  console.log('📋 Testing record listing...');
  
  const query = `
    query ListRecords($dataPartition: String!, $pagination: PaginationInput) {
      listRecords(dataPartition: $dataPartition, pagination: $pagination) {
        records {
          id
          kind
          version
          createTime
        }
        pagination {
          nextToken
          hasNextPage
        }
      }
    }
  `;

  const variables = {
    dataPartition: 'osdu',
    pagination: { limit: 5 }
  };

  try {
    const result = await makeGraphQLRequest(query, variables);
    
    if (result.data?.listRecords?.records) {
      console.log('✅ Record listing PASSED');
      console.log(`   Found ${result.data.listRecords.records.length} records`);
      return { status: 'success', data: result.data };
    } else {
      console.log('❌ Record listing FAILED:', result);
      return { status: 'error', error: 'Record listing did not return records array', data: result };
    }
  } catch (error) {
    console.log('❌ Record listing ERROR:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Frontend-Backend API Alignment Tests for Storage Service\n');
  
  const results = {
    healthCheck: null,
    recordCreation: null,
    recordRetrieval: null,
    recordListing: null
  };

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  console.log('');

  // Test 2: Record Creation
  results.recordCreation = await testRecordCreation();
  console.log('');

  // Test 3: Record Retrieval (if creation succeeded)
  if (results.recordCreation.status === 'success' && results.recordCreation.recordId) {
    results.recordRetrieval = await testRecordRetrieval(results.recordCreation.recordId);
    console.log('');
  }

  // Test 4: Record Listing
  results.recordListing = await testRecordListing();
  console.log('');

  // Summary
  console.log('📊 TEST SUMMARY:');
  console.log('================');
  
  const testNames = Object.keys(results);
  const passedTests = testNames.filter(test => results[test]?.status === 'success');
  const failedTests = testNames.filter(test => results[test]?.status === 'error');
  
  console.log(`✅ Passed: ${passedTests.length}/${testNames.length}`);
  console.log(`❌ Failed: ${failedTests.length}/${testNames.length}`);
  
  if (passedTests.length > 0) {
    console.log(`\nPassed tests: ${passedTests.join(', ')}`);
  }
  
  if (failedTests.length > 0) {
    console.log(`\nFailed tests: ${failedTests.join(', ')}`);
    failedTests.forEach(test => {
      console.log(`  - ${test}: ${results[test].error}`);
    });
  }

  console.log('\n🎯 FRONTEND ALIGNMENT STATUS:');
  if (passedTests.length === testNames.length) {
    console.log('✅ Frontend is FULLY ALIGNED with backend storage service');
  } else if (passedTests.length > 0) {
    console.log('⚠️  Frontend is PARTIALLY ALIGNED with backend storage service');
  } else {
    console.log('❌ Frontend is NOT ALIGNED with backend storage service');
  }

  return results;
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testHealthCheck, testRecordCreation, testRecordRetrieval, testRecordListing };