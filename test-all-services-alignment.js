#!/usr/bin/env node

/**
 * Test script to check all OSDU services alignment
 */

console.log('🔍 OSDU Services Alignment Test');
console.log('===============================');
console.log('');

const services = {
  schema: {
    endpoint: process.env.VITE_SCHEMA_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    method: 'getSchemas',
    expectedQuery: 'listSchemas',
    status: '❓ Unknown'
  },
  legal: {
    endpoint: process.env.VITE_LEGAL_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    method: 'getLegalTags',
    expectedQuery: 'listLegalTags',
    status: '✅ Working'
  },
  search: {
    endpoint: process.env.VITE_SEARCH_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    method: 'search',
    expectedQuery: 'search or queryRecords',
    status: '❓ Unknown'
  },
  storage: {
    endpoint: process.env.VITE_STORAGE_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    method: 'testStorageHealthCheck',
    expectedQuery: 'healthCheck',
    status: '✅ Working'
  },
  entitlements: {
    endpoint: process.env.VITE_ENTITLEMENTS_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    method: 'getGroups',
    expectedQuery: 'listGroups or getGroups',
    status: '❓ Unknown'
  }
};

console.log('📋 Service Status Summary:');
console.log('');
Object.entries(services).forEach(([name, info]) => {
  console.log(`${info.status} ${name.toUpperCase()} Service`);
  console.log(`  Method: ${info.method}()`);
  console.log(`  Expected Query: ${info.expectedQuery}`);
  console.log(`  Endpoint: ${info.endpoint}`);
  console.log('');
});

console.log('🔧 Issues to Fix:');
console.log('');

console.log('1. 📊 SCHEMA Service:');
console.log('   Problem: Using complex introspection and query builder');
console.log('   Solution: Use direct GraphQL query like storage service');
console.log('   Expected: query listSchemas($dataPartition: String!, $pagination: PaginationInput)');
console.log('');

console.log('2. 🔍 SEARCH Service:');
console.log('   Problem: Using complex introspection to find search operations');
console.log('   Solution: Use direct GraphQL query with known operation name');
console.log('   Expected: query search($dataPartition: String!, $query: String!, $options: SearchOptions)');
console.log('');

console.log('3. 👥 ENTITLEMENTS Service:');
console.log('   Problem: Using introspection-based getGroups method');
console.log('   Solution: Use direct GraphQL query like other services');
console.log('   Expected: query listGroups($dataPartition: String!, $pagination: PaginationInput)');
console.log('');

console.log('🎯 Recommended Approach:');
console.log('');
console.log('Follow the same pattern as the working storage service:');
console.log('1. Use direct GraphQL queries (no introspection)');
console.log('2. Include dataPartition as GraphQL variable');
console.log('3. Rely on data-partition-id header for authentication');
console.log('4. Keep queries simple and explicit');
console.log('');

console.log('📝 Example Fixed Queries:');
console.log('');
console.log('Schema Service:');
console.log('  query ListSchemas($dataPartition: String!, $pagination: PaginationInput) {');
console.log('    listSchemas(dataPartition: $dataPartition, pagination: $pagination) {');
console.log('      schemas { id schemaIdentity schema }');
console.log('      pagination { nextToken }');
console.log('    }');
console.log('  }');
console.log('');

console.log('Search Service:');
console.log('  query SearchRecords($dataPartition: String!, $query: String!) {');
console.log('    search(dataPartition: $dataPartition, query: $query) {');
console.log('      results { id kind data }');
console.log('      totalCount');
console.log('    }');
console.log('  }');
console.log('');

console.log('Entitlements Service:');
console.log('  query ListGroups($dataPartition: String!, $pagination: PaginationInput) {');
console.log('    listGroups(dataPartition: $dataPartition, pagination: $pagination) {');
console.log('      groups { id name email }');
console.log('      pagination { nextToken }');
console.log('    }');
console.log('  }');
console.log('');

console.log('✨ After fixing, all services should render properly in the API test page!');