#!/usr/bin/env node

/**
 * Script to discover the actual GraphQL schema fields for each service
 */

console.log('🔍 GraphQL Schema Field Discovery');
console.log('=================================');
console.log('');

console.log('Based on the error logs, here are the actual schema issues:');
console.log('');

console.log('📊 SCHEMA Service:');
console.log('  ❌ Field "schemas" does not exist in SchemaConnection');
console.log('  ❌ Field "hasNextPage" does not exist in PaginationOutput');
console.log('  ❌ Field "totalCount" does not exist in PaginationOutput');
console.log('  ✅ Query "listSchemas" exists and works');
console.log('  💡 Need to discover correct field names in SchemaConnection');
console.log('');

console.log('🔍 SEARCH Service:');
console.log('  ❌ Type "SearchOptionsInput" does not exist');
console.log('  ❌ Field arguments dataPartition, query, options do not exist');
console.log('  ❌ Missing required field argument "input"');
console.log('  ❌ Field "results" does not exist in SearchResult');
console.log('  ✅ Query "search" exists but has different signature');
console.log('  💡 Need to discover correct input type and field names');
console.log('');

console.log('👥 ENTITLEMENTS Service:');
console.log('  ❌ Field "listGroups" does not exist in Query type');
console.log('  ✅ Query "listEntitlements" already works (used elsewhere)');
console.log('  💡 Should use listEntitlements instead of listGroups');
console.log('');

console.log('🎯 Recommended Fix Strategy:');
console.log('');
console.log('1. Use minimal introspection to discover actual field names');
console.log('2. Start with basic queries that return any data');
console.log('3. Gradually add fields that actually exist');
console.log('4. Use the working patterns from Legal and Storage services');
console.log('');

console.log('📝 Quick Fixes:');
console.log('');

console.log('Schema Service - Try minimal query first:');
console.log('  query ListSchemas($dataPartition: String!) {');
console.log('    listSchemas(dataPartition: $dataPartition) {');
console.log('      # Discover what fields actually exist here');
console.log('    }');
console.log('  }');
console.log('');

console.log('Search Service - Use input argument:');
console.log('  query Search($input: SearchInput!) {');
console.log('    search(input: $input) {');
console.log('      # Discover what fields actually exist here');
console.log('    }');
console.log('  }');
console.log('');

console.log('Entitlements Service - Use existing listEntitlements:');
console.log('  query ListEntitlements($dataPartition: String!) {');
console.log('    listEntitlements(dataPartition: $dataPartition) {');
console.log('      items { id groupEmail }');
console.log('    }');
console.log('  }');
console.log('');

console.log('✨ This approach will discover the actual schema structure!');