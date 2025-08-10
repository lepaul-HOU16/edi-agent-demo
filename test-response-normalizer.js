#!/usr/bin/env node

/**
 * Test Response Normalizer with actual response structures
 */

// Mock the response normalizer (simplified version for testing)
function normalizeLegalTagResponse(response, options = {}) {
  const {
    allowEmptyResponse = true,
    source = 'test',
    queryType = 'test'
  } = options;

  console.log('🔍 Testing Response Normalizer Input:', {
    source,
    queryType,
    responseType: typeof response,
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : 'not object',
    responseStructure: JSON.stringify(response, null, 2)
  });

  // Initialize normalized response
  const normalized = {
    data: { items: [], pagination: {} },
    isEmpty: true,
    isError: false,
    originalResponse: response
  };

  try {
    // Handle null or undefined response
    if (response === null || response === undefined) {
      if (allowEmptyResponse) {
        return normalized; // Return empty but valid response
      } else {
        return {
          ...normalized,
          isError: true,
          errorType: 'DATA',
          errorMessage: 'Response is null or undefined'
        };
      }
    }

    // Handle different response structures
    let legalTags = [];
    let pagination = {};

    // Case 1: Response has getLegalTags field (connection format)
    if (response.getLegalTags !== undefined && response.getLegalTags !== null) {
      console.log('✅ Found getLegalTags with data');
      const result = extractFromConnectionFormat(response.getLegalTags);
      legalTags = result.items;
      pagination = result.pagination;
    }
    // Case 2: Response has listLegalTags field (connection format)
    else if (response.listLegalTags !== undefined && response.listLegalTags !== null) {
      console.log('✅ Found listLegalTags with data');
      const result = extractFromConnectionFormat(response.listLegalTags);
      legalTags = result.items;
      pagination = result.pagination;
    }
    // Case 2a: Handle null values for GraphQL fields (valid empty response)
    else if (response.getLegalTags === null || response.listLegalTags === null) {
      console.log('✅ Found null GraphQL field - treating as empty result');
      legalTags = [];
      pagination = {};
    }
    // Case 3: Direct array format
    else if (Array.isArray(response)) {
      console.log('✅ Found direct array format');
      legalTags = response;
    }
    // Case 4: Response has items field directly
    else if (response.items && Array.isArray(response.items)) {
      console.log('✅ Found direct items field');
      legalTags = response.items;
      pagination = response.pagination || {};
    }
    // Case 5: Single legal tag object
    else if (response.id && response.name) {
      console.log('✅ Found single legal tag object');
      legalTags = [response];
    }
    // Case 6: Nested structure with data field
    else if (response.data) {
      console.log('✅ Found nested data field - recursing');
      return normalizeLegalTagResponse(response.data, options);
    }
    // Case 7: Unknown structure
    else {
      console.log('❌ Unknown response structure');
      return {
        ...normalized,
        isError: true,
        errorType: 'DATA',
        errorMessage: `Unknown response structure: ${JSON.stringify(Object.keys(response))}`
      };
    }

    // Update normalized response
    normalized.data = {
      items: legalTags,
      pagination: pagination
    };
    normalized.isEmpty = legalTags.length === 0;

    return normalized;

  } catch (error) {
    return {
      ...normalized,
      isError: true,
      errorType: 'UNKNOWN',
      errorMessage: `Response normalization failed: ${error.message}`
    };
  }
}

function extractFromConnectionFormat(connectionData) {
  if (!connectionData) {
    return { items: [], pagination: {} };
  }

  // Handle different connection formats
  if (connectionData.items && Array.isArray(connectionData.items)) {
    return {
      items: connectionData.items,
      pagination: connectionData.pagination || (connectionData.nextToken ? { nextToken: connectionData.nextToken } : {})
    };
  }

  // Handle direct array (some backends return array directly)
  if (Array.isArray(connectionData)) {
    return { items: connectionData, pagination: {} };
  }

  // Handle single item
  if (connectionData.id && connectionData.name) {
    return { items: [connectionData], pagination: {} };
  }

  return { items: [], pagination: {} };
}

// Test cases based on actual responses
console.log('🧪 Testing Response Normalizer with Real Response Structures\n');

// Test 1: listLegalTags returns null (actual failing case)
console.log('Test 1: listLegalTags returns null');
const test1 = normalizeLegalTagResponse(
  { listLegalTags: null },
  { source: 'listLegalTags', queryType: 'primary' }
);
console.log('Result:', test1);
console.log('Success:', !test1.isError && test1.isEmpty);
console.log('');

// Test 2: getLegalTags returns empty array (actual working case)
console.log('Test 2: getLegalTags returns empty connection');
const test2 = normalizeLegalTagResponse(
  { 
    getLegalTags: { 
      items: [], 
      pagination: { nextToken: null } 
    } 
  },
  { source: 'getLegalTags', queryType: 'fallback' }
);
console.log('Result:', test2);
console.log('Success:', !test2.isError && test2.isEmpty);
console.log('');

// Test 3: getLegalTags with actual data
console.log('Test 3: getLegalTags with sample data');
const test3 = normalizeLegalTagResponse(
  { 
    getLegalTags: { 
      items: [
        {
          id: 'test-1',
          name: 'Test Legal Tag',
          description: 'Test description',
          properties: '{"countryOfOrigin":["US"]}'
        }
      ], 
      pagination: { nextToken: null } 
    } 
  },
  { source: 'getLegalTags', queryType: 'primary' }
);
console.log('Result:', test3);
console.log('Success:', !test3.isError && !test3.isEmpty && test3.data.items.length === 1);
console.log('');

// Test 4: Unknown structure (should fail gracefully)
console.log('Test 4: Unknown structure');
const test4 = normalizeLegalTagResponse(
  { unknownField: 'value' },
  { source: 'unknown', queryType: 'test' }
);
console.log('Result:', test4);
console.log('Success:', test4.isError && test4.errorMessage.includes('Unknown response structure'));
console.log('');

console.log('🏁 All tests completed!');
console.log('');
console.log('Summary:');
console.log('- Test 1 (null handling):', !test1.isError ? '✅ PASS' : '❌ FAIL');
console.log('- Test 2 (empty connection):', !test2.isError ? '✅ PASS' : '❌ FAIL');
console.log('- Test 3 (with data):', !test3.isError && test3.data.items.length === 1 ? '✅ PASS' : '❌ FAIL');
console.log('- Test 4 (error handling):', test4.isError ? '✅ PASS' : '❌ FAIL');