const https = require('https');

// Test the entitlements GraphQL API
const testEntitlementsAPI = async () => {
  const endpoint = 'https://lmcmnthgenbpdeyc2txmqxjkjm.appsync-api.us-east-1.amazonaws.com/graphql';
  const apiKey = 'da2-r5puac27trgtrmeob6gc2lz3gq';
  
  // Test query - simplified version
  const query = `
    query ListEntitlements($dataPartition: String!, $filter: EntitlementFilterInput!, $pagination: PaginationInput) {
      listEntitlements(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
        items {
          id
          groupEmail
          actions
          conditions {
            attribute
            operator
            value
          }
          createdBy
          createdAt
        }
        pagination {
          nextToken
        }
      }
    }
  `;

  const variables = {
    dataPartition: 'osdu',
    filter: {},
    pagination: { limit: 10 }
  };

  const requestBody = JSON.stringify({
    query,
    variables
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'data-partition-id': 'osdu'
    }
  };

  try {
    console.log('🔍 Testing entitlements API...');
    console.log('Endpoint:', endpoint);
    console.log('Variables:', JSON.stringify(variables, null, 2));
    
    const response = await makeRequest(endpoint, options, requestBody);
    console.log('✅ Response received:', JSON.stringify(response, null, 2));
    
    if (response.errors) {
      console.error('❌ GraphQL Errors:', response.errors);
    }
    
    if (response.data) {
      console.log('📊 Data:', response.data);
      if (response.data.listEntitlements) {
        console.log('📋 Entitlements:', response.data.listEntitlements);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Helper function to make HTTP request
function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

// Run the test
testEntitlementsAPI();
