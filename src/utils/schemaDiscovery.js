/**
 * GraphQL Schema Discovery Utility
 * Discovers the actual schema from deployed AWS AppSync endpoints
 */

import osduApi from '../services/osduApiService';

/**
 * Full GraphQL introspection query to discover schema
 */
const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType {
        name
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
            ofType {
              name
              kind
            }
          }
        }
      }
      mutationType {
        name
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
            ofType {
              name
              kind
            }
          }
        }
      }
      types {
        name
        kind
        description
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
        inputFields {
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
  }
`;

/**
 * Simplified introspection query for basic discovery
 */
const BASIC_INTROSPECTION_QUERY = `
  query BasicIntrospection {
    __schema {
      queryType {
        name
        fields {
          name
          args {
            name
            type {
              name
            }
          }
        }
      }
      mutationType {
        name
        fields {
          name
          args {
            name
            type {
              name
            }
          }
        }
      }
    }
  }
`;

/**
 * Discover schema for a single endpoint
 */
export async function discoverEndpointSchema(endpointName, endpointUrl) {
  const result = {
    endpoint: endpointName,
    url: endpointUrl,
    status: 'unknown',
    schema: null,
    queries: [],
    mutations: [],
    types: [],
    error: null
  };

  if (!endpointUrl) {
    result.status = 'not_configured';
    result.error = 'Endpoint URL not configured';
    return result;
  }

  try {
    console.log(`🔍 Discovering schema for ${endpointName}...`);
    
    // Get auth headers
    const headers = await osduApi.getAuthHeaders();
    
    // Try full introspection first
    let response;
    let data;
    
    try {
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: INTROSPECTION_QUERY })
      });
      
      if (response.ok) {
        data = await response.json();
        if (data.errors) {
          console.warn(`Full introspection failed for ${endpointName}, trying basic:`, data.errors);
          throw new Error('Full introspection failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fullError) {
      console.log(`Trying basic introspection for ${endpointName}...`);
      
      // Fallback to basic introspection
      response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: BASIC_INTROSPECTION_QUERY })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
      }
    }

    if (data.data && data.data.__schema) {
      result.status = 'success';
      result.schema = data.data.__schema;
      
      // Extract queries
      if (data.data.__schema.queryType && data.data.__schema.queryType.fields) {
        result.queries = data.data.__schema.queryType.fields.map(field => ({
          name: field.name,
          description: field.description,
          args: field.args || [],
          returnType: field.type
        }));
      }
      
      // Extract mutations
      if (data.data.__schema.mutationType && data.data.__schema.mutationType.fields) {
        result.mutations = data.data.__schema.mutationType.fields.map(field => ({
          name: field.name,
          description: field.description,
          args: field.args || [],
          returnType: field.type
        }));
      }
      
      // Extract types (if available from full introspection)
      if (data.data.__schema.types) {
        result.types = data.data.__schema.types
          .filter(type => !type.name.startsWith('__')) // Filter out introspection types
          .map(type => ({
            name: type.name,
            kind: type.kind,
            description: type.description,
            fields: type.fields || [],
            inputFields: type.inputFields || []
          }));
      }
      
      console.log(`✅ Schema discovered for ${endpointName}:`, {
        queries: result.queries.length,
        mutations: result.mutations.length,
        types: result.types.length
      });
      
    } else {
      throw new Error('Invalid introspection response structure');
    }

  } catch (error) {
    console.error(`❌ Schema discovery failed for ${endpointName}:`, error);
    result.status = 'error';
    result.error = error.message;
  }

  return result;
}

/**
 * Discover schemas for all configured endpoints
 */
export async function discoverAllSchemas() {
  const endpoints = {
    schema: osduApi.endpoints.schema,
    entitlements: osduApi.endpoints.entitlements,
    legal: osduApi.endpoints.legal,
    search: osduApi.endpoints.search,
    storage: osduApi.endpoints.storage,
    ai: osduApi.endpoints.ai,
    dataIngestion: osduApi.endpoints.dataIngestion,
    seismicIngestion: osduApi.endpoints.seismicIngestion
  };

  const results = {};
  
  console.log('🚀 Starting schema discovery for all endpoints...');
  
  // Discover schemas in parallel
  const discoveries = Object.entries(endpoints).map(async ([name, url]) => {
    const result = await discoverEndpointSchema(name, url);
    results[name] = result;
    return result;
  });

  await Promise.all(discoveries);
  
  console.log('📋 Schema discovery complete:', results);
  
  return results;
}

/**
 * Generate a summary report of discovered schemas
 */
export function generateSchemaReport(discoveryResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
      notConfigured: 0
    },
    endpoints: {},
    recommendations: []
  };

  Object.entries(discoveryResults).forEach(([endpointName, result]) => {
    report.summary.total++;
    
    if (result.status === 'success') {
      report.summary.successful++;
    } else if (result.status === 'error') {
      report.summary.failed++;
    } else if (result.status === 'not_configured') {
      report.summary.notConfigured++;
    }

    report.endpoints[endpointName] = {
      status: result.status,
      url: result.url,
      queriesCount: result.queries.length,
      mutationsCount: result.mutations.length,
      typesCount: result.types.length,
      availableQueries: result.queries.map(q => q.name),
      availableMutations: result.mutations.map(m => m.name),
      error: result.error
    };

    // Generate recommendations
    if (result.status === 'success') {
      if (result.queries.length === 0 && result.mutations.length === 0) {
        report.recommendations.push(`${endpointName}: No operations available - check if service is properly deployed`);
      }
    } else if (result.status === 'error') {
      report.recommendations.push(`${endpointName}: ${result.error} - check endpoint configuration and authentication`);
    } else if (result.status === 'not_configured') {
      report.recommendations.push(`${endpointName}: Configure endpoint URL in environment variables`);
    }
  });

  return report;
}

/**
 * Compare current frontend operations with discovered schema
 */
export function compareWithCurrentOperations(discoveryResults) {
  // This would analyze the current osduApiService operations
  // and compare them with what's actually available
  const comparison = {
    timestamp: new Date().toISOString(),
    missingOperations: [],
    availableAlternatives: [],
    exactMatches: []
  };

  // Current operations in the frontend (from osduApiService.js)
  const currentOperations = {
    schema: ['getSchemas', 'listSchemas', 'getSchema', 'createSchema'],
    entitlements: ['getEntitlements', 'createEntitlement', 'getGroups'], // Removed getEntitlement since it requires ID
    legal: ['getLegalTags', 'getLegalTag'],
    search: ['search'],
    storage: ['getRecordById']
  };

  Object.entries(currentOperations).forEach(([service, operations]) => {
    const discovered = discoveryResults[service];
    
    if (discovered && discovered.status === 'success') {
      const availableQueries = discovered.queries.map(q => q.name);
      const availableMutations = discovered.mutations.map(m => m.name);
      const allAvailable = [...availableQueries, ...availableMutations];

      operations.forEach(operation => {
        if (allAvailable.includes(operation)) {
          comparison.exactMatches.push({
            service,
            operation,
            type: availableQueries.includes(operation) ? 'query' : 'mutation'
          });
        } else {
          comparison.missingOperations.push({
            service,
            operation,
            available: allAvailable
          });
          
          // Look for similar operations
          const similar = allAvailable.filter(available => 
            available.toLowerCase().includes(operation.toLowerCase()) ||
            operation.toLowerCase().includes(available.toLowerCase())
          );
          
          if (similar.length > 0) {
            comparison.availableAlternatives.push({
              service,
              requested: operation,
              alternatives: similar
            });
          }
        }
      });
    }
  });

  return comparison;
}

export default {
  discoverEndpointSchema,
  discoverAllSchemas,
  generateSchemaReport,
  compareWithCurrentOperations
};