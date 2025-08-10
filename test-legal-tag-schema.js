#!/usr/bin/env node

/**
 * Legal Tag Schema Diagnostic Script
 * 
 * This script tests the actual GraphQL schema for legal tags to understand
 * what queries are available and what structure they return.
 */

const https = require('https');
const http = require('http');

// Configuration - update these based on your deployment
const LEGAL_API_URL = process.env.VITE_LEGAL_API_URL || 'https://your-legal-api-endpoint/graphql';
const DATA_PARTITION = 'osdu';

// Mock auth headers - you'll need to replace these with actual tokens
const AUTH_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer your-token-here',
  'data-partition-id': DATA_PARTITION
};

/**
 * Make a GraphQL request
 */
async function makeGraphQLRequest(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(LEGAL_API_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify({
      query,
      variables
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        ...AUTH_HEADERS,
        'Content-Length': Buffer.byteLength(postData)
      }
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
 * Test GraphQL introspection to see available queries
 */
async function testIntrospection() {
  console.log('🔍 Testing GraphQL introspection...\n');
  
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          fields {
            name
            description
            args {
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
            type {
              name
              kind
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await makeGraphQLRequest(introspectionQuery);
    
    if (result.errors) {
      console.log('❌ Introspection failed:', result.errors);
      return null;
    }

    const queries = result.data?.__schema?.queryType?.fields || [];
    const legalTagQueries = queries.filter(q => 
      q.name.toLowerCase().includes('legal') || 
      q.name.toLowerCase().includes('tag')
    );

    console.log('📋 Available legal tag queries:');
    legalTagQueries.forEach(query => {
      console.log(`  - ${query.name}`);
      console.log(`    Args: ${query.args.map(arg => `${arg.name}: ${arg.type.name || arg.type.kind}`).join(', ')}`);
      console.log(`    Returns: ${query.type.name || query.type.kind}`);
      console.log('');
    });

    return legalTagQueries;
  } catch (error) {
    console.log('❌ Introspection error:', error.message);
    return null;
  }
}

/**
 * Test different legal tag queries to see what works
 */
async function testLegalTagQueries() {
  console.log('🧪 Testing legal tag queries...\n');

  // Test queries to try
  const testQueries = [
    {
      name: 'listLegalTags (with connection)',
      query: `
        query ListLegalTags($dataPartition: String!) {
          listLegalTags(dataPartition: $dataPartition) {
            items {
              id
              name
              description
              properties
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      variables: { dataPartition: DATA_PARTITION }
    },
    {
      name: 'listLegalTags (direct array)',
      query: `
        query ListLegalTags($dataPartition: String!) {
          listLegalTags(dataPartition: $dataPartition) {
            id
            name
            description
            properties
          }
        }
      `,
      variables: { dataPartition: DATA_PARTITION }
    },
    {
      name: 'getLegalTags (with connection)',
      query: `
        query GetLegalTags($dataPartition: String!) {
          getLegalTags(dataPartition: $dataPartition) {
            items {
              id
              name
              description
              properties
            }
            pagination {
              nextToken
            }
          }
        }
      `,
      variables: { dataPartition: DATA_PARTITION }
    },
    {
      name: 'getLegalTags (direct array)',
      query: `
        query GetLegalTags($dataPartition: String!) {
          getLegalTags(dataPartition: $dataPartition) {
            id
            name
            description
            properties
          }
        }
      `,
      variables: { dataPartition: DATA_PARTITION }
    },
    {
      name: 'Simple field test',
      query: `
        query TestFields {
          __typename
        }
      `,
      variables: {}
    }
  ];

  for (const test of testQueries) {
    console.log(`🔬 Testing: ${test.name}`);
    
    try {
      const result = await makeGraphQLRequest(test.query, test.variables);
      
      if (result.errors) {
        console.log(`  ❌ Error:`, result.errors[0]?.message || 'Unknown error');
      } else {
        console.log(`  ✅ Success:`, JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`  ❌ Request failed:`, error.message);
    }
    
    console.log('');
  }
}

/**
 * Main diagnostic function
 */
async function runDiagnostics() {
  console.log('🚀 Legal Tag GraphQL Schema Diagnostics');
  console.log('=====================================\n');
  
  console.log('📋 Configuration:');
  console.log(`  API URL: ${LEGAL_API_URL}`);
  console.log(`  Data Partition: ${DATA_PARTITION}`);
  console.log('');

  // Test introspection first
  const availableQueries = await testIntrospection();
  
  if (availableQueries && availableQueries.length > 0) {
    console.log('✅ Found legal tag queries, proceeding with tests...\n');
    await testLegalTagQueries();
  } else {
    console.log('⚠️  No legal tag queries found or introspection failed');
    console.log('   Proceeding with blind tests...\n');
    await testLegalTagQueries();
  }

  console.log('🏁 Diagnostics complete!');
  console.log('\n💡 Next steps:');
  console.log('1. Update the AUTH_HEADERS in this script with real tokens');
  console.log('2. Update the LEGAL_API_URL with your actual endpoint');
  console.log('3. Run this script to see what queries actually work');
  console.log('4. Update the frontend queries based on the working structure');
}

// Run diagnostics if this script is executed directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = {
  makeGraphQLRequest,
  testIntrospection,
  testLegalTagQueries,
  runDiagnostics
};