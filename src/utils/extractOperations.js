/**
 * Utility to extract and display available operations from schema discovery
 * This helps us understand what operations are actually available
 */

import { discoverAllSchemas } from './schemaDiscovery';

/**
 * Extract and display available operations for manual inspection
 */
export async function extractAvailableOperations() {
  try {
    const discoveryResults = await discoverAllSchemas();
    
    const operations = {};
    
    Object.entries(discoveryResults).forEach(([serviceName, result]) => {
      if (result.status === 'success') {
        operations[serviceName] = {
          queries: result.queries.map(q => ({
            name: q.name,
            args: q.args?.map(arg => `${arg.name}: ${arg.type?.name || 'Unknown'}`).join(', ') || 'No args',
            description: q.description || 'No description'
          })),
          mutations: result.mutations.map(m => ({
            name: m.name,
            args: m.args?.map(arg => `${arg.name}: ${arg.type?.name || 'Unknown'}`).join(', ') || 'No args',
            description: m.description || 'No description'
          }))
        };
      }
    });
    
    // Log operations for manual inspection
    console.log('🔍 Available Operations by Service:');
    Object.entries(operations).forEach(([service, ops]) => {
      console.log(`\n📋 ${service.toUpperCase()} Service:`);
      console.log('  Queries:', ops.queries.map(q => q.name).join(', '));
      console.log('  Mutations:', ops.mutations.map(m => m.name).join(', '));
    });
    
    return operations;
  } catch (error) {
    console.error('Failed to extract operations:', error);
    throw error;
  }
}

// Run this to see available operations
extractAvailableOperations().then(ops => {
  console.log('📊 Complete operations extracted:', ops);
}).catch(console.error);