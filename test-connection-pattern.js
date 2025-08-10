#!/usr/bin/env node

/**
 * Test script for GraphQL connection pattern fix
 * Run with: node test-connection-pattern.js
 */

// Mock GraphQL response with connection pattern
const mockConnectionResponse = {
  listLegalTags: {
    edges: [
      {
        node: {
          id: "legal-tag-1",
          name: "Public Data Tag",
          description: "Tag for public data",
          properties: {
            countryOfOrigin: ["US"],
            dataType: "Public",
            securityClassification: "Public"
          }
        }
      },
      {
        node: {
          id: "legal-tag-2", 
          name: "Internal Data Tag",
          description: "Tag for internal data",
          properties: {
            countryOfOrigin: ["US"],
            dataType: "Internal",
            securityClassification: "Internal"
          }
        }
      }
    ],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false
    }
  }
};

// Test the response normalization logic
function normalizeConnectionResponse(result, queryName) {
  if (result[queryName]) {
    // Handle GraphQL connection pattern (edges/nodes)
    if (result[queryName].edges && Array.isArray(result[queryName].edges)) {
      const items = result[queryName].edges.map(edge => edge.node);
      return {
        [queryName]: {
          items: items,
          pageInfo: result[queryName].pageInfo
        },
        // Also provide it in the expected format for backward compatibility
        listLegalTags: {
          items: items
        }
      };
    }
    // If the result is an array, wrap it in the expected structure
    else if (Array.isArray(result[queryName])) {
      return {
        [queryName]: result[queryName],
        // Also provide it in the expected format
        listLegalTags: {
          items: result[queryName]
        }
      };
    } else {
      return result;
    }
  } else {
    return result;
  }
}

console.log('🧪 Testing GraphQL Connection Pattern Fix...\n');

console.log('📥 Mock Response:');
console.log(JSON.stringify(mockConnectionResponse, null, 2));

console.log('\n🔄 Normalizing response...');
const normalized = normalizeConnectionResponse(mockConnectionResponse, 'listLegalTags');

console.log('\n📤 Normalized Response:');
console.log(JSON.stringify(normalized, null, 2));

console.log('\n✅ Test Results:');
console.log(`- Items extracted: ${normalized.listLegalTags.items.length}`);
console.log(`- First item ID: ${normalized.listLegalTags.items[0]?.id}`);
console.log(`- PageInfo preserved: ${!!normalized.listLegalTags.pageInfo}`);

console.log('\n🎯 Expected UI behavior:');
console.log('- Legal tags should load without "FieldUndefined" errors');
console.log('- UI should display the extracted legal tag items');
console.log('- Pagination info should be available for future use');