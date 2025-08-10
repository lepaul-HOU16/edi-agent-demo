/**
 * Schema Analysis Utility
 * Analyzes discovered schemas and creates operation mappings
 */

import { discoverAllSchemas } from './schemaDiscovery';

/**
 * Current frontend operations that need to be mapped
 */
const CURRENT_OPERATIONS = {
  schema: {
    queries: ['getSchemas', 'listSchemas', 'getSchema'],
    mutations: ['createSchema'],
    expectedInputTypes: ['SchemaFilterInput', 'PaginationInput']
  },
  legal: {
    queries: ['getLegalTags', 'getLegalTag'],
    mutations: [],
    expectedInputTypes: ['LegalTagFilterInput']
  },
  search: {
    queries: [],
    mutations: ['search'],
    expectedInputTypes: ['SearchQueryInput']
  },
  storage: {
    queries: ['getRecordById'],
    mutations: [],
    expectedInputTypes: []
  },
  entitlements: {
    queries: ['getEntitlements', 'getGroups'], // Removed getEntitlement since it requires ID parameter
    mutations: ['createEntitlement'],
    expectedInputTypes: ['EntitlementFilterInput', 'PaginationInput']
  }
};

/**
 * Analyze discovered schemas and create operation mappings
 */
export async function analyzeSchemas() {
  console.log('🔍 Starting comprehensive schema analysis...');
  
  try {
    // Get fresh schema discovery results
    const discoveryResults = await discoverAllSchemas();
    
    const analysis = {
      timestamp: new Date().toISOString(),
      services: {},
      operationMappings: {},
      missingOperations: [],
      availableAlternatives: [],
      newOpportunities: [],
      summary: {
        totalServices: 0,
        successfulServices: 0,
        totalQueries: 0,
        totalMutations: 0,
        mappedOperations: 0,
        unmappedOperations: 0
      }
    };

    // Analyze each service
    Object.entries(discoveryResults).forEach(([serviceName, result]) => {
      analysis.summary.totalServices++;
      
      if (result.status === 'success') {
        analysis.summary.successfulServices++;
        analysis.summary.totalQueries += result.queries.length;
        analysis.summary.totalMutations += result.mutations.length;

        // Store service details
        analysis.services[serviceName] = {
          status: result.status,
          url: result.url,
          queries: result.queries.map(q => ({
            name: q.name,
            description: q.description,
            args: q.args,
            returnType: q.returnType
          })),
          mutations: result.mutations.map(m => ({
            name: m.name,
            description: m.description,
            args: m.args,
            returnType: m.returnType
          })),
          types: result.types.map(t => ({
            name: t.name,
            kind: t.kind,
            description: t.description,
            fields: t.fields,
            inputFields: t.inputFields
          }))
        };

        // Create operation mappings for known services
        if (CURRENT_OPERATIONS[serviceName]) {
          analysis.operationMappings[serviceName] = createOperationMapping(
            serviceName,
            CURRENT_OPERATIONS[serviceName],
            result
          );
        }

        // Identify new opportunities (services we don't currently use)
        if (!CURRENT_OPERATIONS[serviceName]) {
          analysis.newOpportunities.push({
            service: serviceName,
            queries: result.queries.length,
            mutations: result.mutations.length,
            description: `New service with ${result.queries.length} queries and ${result.mutations.length} mutations available`
          });
        }
      }
    });

    // Calculate mapping statistics
    Object.values(analysis.operationMappings).forEach(mapping => {
      analysis.summary.mappedOperations += mapping.exactMatches.length;
      analysis.summary.unmappedOperations += mapping.missingOperations.length;
    });

    console.log('✅ Schema analysis complete:', analysis.summary);
    return analysis;

  } catch (error) {
    console.error('❌ Schema analysis failed:', error);
    throw error;
  }
}

/**
 * Create operation mapping for a specific service
 */
function createOperationMapping(serviceName, currentOps, discoveredSchema) {
  const mapping = {
    service: serviceName,
    exactMatches: [],
    missingOperations: [],
    suggestedMappings: [],
    availableOperations: {
      queries: discoveredSchema.queries.map(q => q.name),
      mutations: discoveredSchema.mutations.map(m => m.name)
    }
  };

  // Check queries
  currentOps.queries.forEach(currentQuery => {
    const exactMatch = discoveredSchema.queries.find(q => q.name === currentQuery);
    if (exactMatch) {
      mapping.exactMatches.push({
        type: 'query',
        name: currentQuery,
        operation: exactMatch
      });
    } else {
      // Look for similar operations
      const similar = findSimilarOperations(currentQuery, discoveredSchema.queries);
      mapping.missingOperations.push({
        type: 'query',
        name: currentQuery,
        similar: similar
      });
      
      if (similar.length > 0) {
        mapping.suggestedMappings.push({
          current: currentQuery,
          suggested: similar[0].name,
          confidence: similar[0].confidence,
          reason: similar[0].reason
        });
      }
    }
  });

  // Check mutations
  currentOps.mutations.forEach(currentMutation => {
    const exactMatch = discoveredSchema.mutations.find(m => m.name === currentMutation);
    if (exactMatch) {
      mapping.exactMatches.push({
        type: 'mutation',
        name: currentMutation,
        operation: exactMatch
      });
    } else {
      // Look for similar operations
      const similar = findSimilarOperations(currentMutation, discoveredSchema.mutations);
      mapping.missingOperations.push({
        type: 'mutation',
        name: currentMutation,
        similar: similar
      });
      
      if (similar.length > 0) {
        mapping.suggestedMappings.push({
          current: currentMutation,
          suggested: similar[0].name,
          confidence: similar[0].confidence,
          reason: similar[0].reason
        });
      }
    }
  });

  return mapping;
}

/**
 * Find similar operations using fuzzy matching
 */
function findSimilarOperations(targetName, availableOperations) {
  const similar = [];
  const targetLower = targetName.toLowerCase();

  availableOperations.forEach(op => {
    const opLower = op.name.toLowerCase();
    let confidence = 0;
    let reason = '';

    // Exact substring match
    if (opLower.includes(targetLower) || targetLower.includes(opLower)) {
      confidence = 0.8;
      reason = 'Substring match';
    }
    // Similar words (remove common prefixes/suffixes)
    else if (areSimilarWords(targetLower, opLower)) {
      confidence = 0.6;
      reason = 'Similar word structure';
    }
    // Same operation type (get, list, create, etc.)
    else if (hasSameOperationType(targetLower, opLower)) {
      confidence = 0.4;
      reason = 'Same operation type';
    }

    if (confidence > 0) {
      similar.push({
        name: op.name,
        confidence,
        reason,
        operation: op
      });
    }
  });

  // Sort by confidence
  return similar.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Check if two words are similar (removing common prefixes/suffixes)
 */
function areSimilarWords(word1, word2) {
  // Remove common prefixes
  const prefixes = ['get', 'list', 'create', 'update', 'delete'];
  let clean1 = word1;
  let clean2 = word2;
  
  prefixes.forEach(prefix => {
    if (clean1.startsWith(prefix)) clean1 = clean1.substring(prefix.length);
    if (clean2.startsWith(prefix)) clean2 = clean2.substring(prefix.length);
  });

  // Check if cleaned words are similar
  return clean1 === clean2 || 
         clean1.includes(clean2) || 
         clean2.includes(clean1) ||
         levenshteinDistance(clean1, clean2) <= 2;
}

/**
 * Check if operations have the same type (get, list, create, etc.)
 */
function hasSameOperationType(op1, op2) {
  const types = ['get', 'list', 'create', 'update', 'delete', 'search'];
  
  for (const type of types) {
    if (op1.startsWith(type) && op2.startsWith(type)) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Generate implementation recommendations
 */
export function generateImplementationPlan(analysis) {
  const plan = {
    timestamp: new Date().toISOString(),
    priority: {
      high: [],
      medium: [],
      low: []
    },
    codeChanges: [],
    newFeatures: []
  };

  // High priority: Fix broken operations
  Object.entries(analysis.operationMappings).forEach(([service, mapping]) => {
    mapping.missingOperations.forEach(missing => {
      if (missing.similar.length > 0) {
        plan.priority.high.push({
          action: 'replace_operation',
          service,
          current: missing.name,
          suggested: missing.similar[0].name,
          confidence: missing.similar[0].confidence
        });
        
        plan.codeChanges.push({
          file: 'osduApiService.js',
          method: missing.name,
          change: `Replace ${missing.name} with ${missing.similar[0].name}`,
          details: missing.similar[0].operation
        });
      } else {
        plan.priority.high.push({
          action: 'remove_operation',
          service,
          current: missing.name,
          reason: 'No equivalent operation found in schema'
        });
      }
    });
  });

  // Medium priority: Add new service support
  analysis.newOpportunities.forEach(opportunity => {
    if (opportunity.queries > 0 || opportunity.mutations > 0) {
      plan.priority.medium.push({
        action: 'add_service_support',
        service: opportunity.service,
        queries: opportunity.queries,
        mutations: opportunity.mutations
      });
      
      plan.newFeatures.push({
        service: opportunity.service,
        description: opportunity.description,
        implementation: `Add ${opportunity.service} service methods to osduApiService.js`
      });
    }
  });

  // Low priority: Optimize existing operations
  Object.entries(analysis.operationMappings).forEach(([service, mapping]) => {
    mapping.exactMatches.forEach(match => {
      plan.priority.low.push({
        action: 'optimize_operation',
        service,
        operation: match.name,
        suggestion: 'Review field selections and input parameters'
      });
    });
  });

  return plan;
}

export default {
  analyzeSchemas,
  generateImplementationPlan
};