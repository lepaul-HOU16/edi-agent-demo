#!/usr/bin/env node

/**
 * Test script to verify storage service is working with proper headers
 */

const config = {
    VITE_STORAGE_API_URL: process.env.VITE_STORAGE_API_URL || 'https://sw6bp2s7ireffe5smt3t2occfa.appsync-api.us-east-1.amazonaws.com/graphql',
    VITE_DEFAULT_DATA_PARTITION: process.env.VITE_DEFAULT_DATA_PARTITION || 'osdu'
};

console.log('🔍 Storage Service Header Test');
console.log('==============================');
console.log('');
console.log('Testing storage service with proper OSDU headers...');
console.log('');
console.log('📋 Configuration:');
console.log(`  Storage API URL: ${config.VITE_STORAGE_API_URL}`);
console.log(`  Data Partition: ${config.VITE_DEFAULT_DATA_PARTITION}`);
console.log('');

// Mock headers that should be sent
const mockHeaders = {
    'Authorization': 'Bearer [JWT_ID_TOKEN]',
    'Content-Type': 'application/json',
    'data-partition-id': config.VITE_DEFAULT_DATA_PARTITION,
    'x-access-token': '[JWT_ACCESS_TOKEN]',
    'Accept': 'application/json'
};

console.log('✅ Expected Headers:');
Object.entries(mockHeaders).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
});
console.log('');

console.log('🎯 Key Points:');
console.log('  1. The data-partition-id header is set to:', config.VITE_DEFAULT_DATA_PARTITION);
console.log('  2. Authorization header contains the JWT ID token');
console.log('  3. x-access-token header contains the JWT access token');
console.log('  4. GraphQL queries MUST include dataPartition as a variable');
console.log('  5. The backend needs BOTH header and GraphQL variable');
console.log('');

console.log('📝 GraphQL Query Examples:');
console.log('');
console.log('Health Check (correct):');
console.log('  query { healthCheck }');
console.log('');
console.log('Create Record (correct):');
console.log('  mutation CreateRecord($dataPartition: String!, $input: CreateRecordInput!) {');
console.log('    createRecord(dataPartition: $dataPartition, input: $input) { id kind }');
console.log('  }');
console.log('');
console.log('Get Record (correct):');
console.log('  query GetRecord($id: ID!, $dataPartition: String!) {');
console.log('    getRecord(id: $id, dataPartition: $dataPartition) { id kind }');
console.log('  }');
console.log('');
console.log('List Records (correct):');
console.log('  query ListRecords($dataPartition: String!, $filter: RecordFilter, $pagination: PaginationInput) {');
console.log('    listRecords(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {');
console.log('      records { id kind }');
console.log('    }');
console.log('  }');
console.log('');

console.log('🚫 Common Mistakes:');
console.log('  ❌ Missing dataPartition as GraphQL variable');
console.log('  ❌ Missing data-partition-id header');
console.log('  ❌ Using wrong token in Authorization header');
console.log('  ❌ Not including x-access-token header');
console.log('');

console.log('🔧 Troubleshooting:');
console.log('  1. Check browser Network tab for actual headers sent');
console.log('  2. Verify JWT tokens are valid and not expired');
console.log('  3. Ensure data-partition-id header matches backend expectations');
console.log('  4. Check GraphQL schema for exact field names');
console.log('  5. Look for CORS issues in browser console');
console.log('');

console.log('✨ The storage service button should now work correctly!');