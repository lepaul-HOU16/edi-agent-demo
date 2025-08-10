const https = require('https');

// Debug the entitlements API response
const debugEntitlementsAPI = async () => {
  const endpoint = 'https://ucbxezqhn5gjdcfak4ffsn65da.appsync-api.us-east-1.amazonaws.com/graphql';
  const accessToken = 'eyJraWQiOiJUc2VEcW9hZGlEV1VSVllqK3pDYXR5RTYzVUFtNWtQNlwvWVdiRWUranZ2Yz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2NDY4ZDRhOC1kMDkxLTcwZTgtMGVhNy1iN2E4OTRkYmU0OWMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9lVk5mUUg0blciLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiI2dGZjZWdxc24xdWc1OTFsdGJyamVmbmExOSIsIm9yaWdpbl9qdGkiOiJkNzM5ZmE2YS0zZDBjLTRhNDYtODNlNy0xNGVjMjcyMDBiMTciLCJldmVudF9pZCI6ImQzZDYzOGM0LTk4NzctNDY1Zi1iMjczLTQ1MDNlYzRkN2Q5YiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3NTQ0NjgyODYsImV4cCI6MTc1NDQ3MTg4NiwiaWF0IjoxNzU0NDY4Mjg2LCJqdGkiOiI2ZTc3ZTJiNy1jMTM2LTQ4ZjktOTkxZS04ODU3MWFmZmIwYTUiLCJ1c2VybmFtZSI6ImNtZ2FicmkifQ.TM_2isTUjYC88aKgWPs2xQd9EVr9Tk6vZPn5a2gErynNO2MYWjp8wLbh6VnK9ixym0oAJDf-ncjBo22ODou_KzRZ05tNhrXsA6e5MWmgR1SPuXGPWyVjTTNrwkgeSFxjD8f7almyExKhrscl8gcVQYCNG4Lg2WNE9iTGh4hhBlvX-7DgFhL5upJfn0YdHiIO8HLawF2ibrqi4iHr6e6F_1aRWk4bUqhASjTez0JAC9gTjUxZvIWoc_j0ZP3hqssO0paV-uA3uPRunUj7xs9RM0kpDEtrNGgPms6mqtVKGrvB1Cp36nRrP73-zTr4Kbboi8VRJS-nV6M-3avzNJPsHQ';

  console.log('🔍 Debugging entitlements API response...');

  // Test with the exact query structure that matches the schema
  const simpleQuery = `
    query ListEntitlements($dataPartition: String!, $filter: EntitlementFilterInput, $pagination: PaginationInput) {
      listEntitlements(dataPartition: $dataPartition, filter: $filter, pagination: $pagination) {
        items {
          id
          groupEmail
        }
        pagination {
          nextToken
        }
      }
    }
  `;

  const variables = {
    dataPartition: "osdu",
    filter: {},
    pagination: { limit: 10 }
  };

  try {
    console.log('📋 Testing simple listEntitlements query...');
    const response = await makeGraphQLRequest(endpoint, simpleQuery, variables, accessToken);
    
    console.log('📊 Full Response:', JSON.stringify(response, null, 2));
    
    if (response.errors) {
      console.error('❌ GraphQL Errors:', response.errors);
    }
    
    if (response.data) {
      console.log('✅ Data received:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
};

// Helper function to make GraphQL requests
async function makeGraphQLRequest(endpoint, query, variables, accessToken) {
  const requestBody = JSON.stringify({
    query,
    variables
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': accessToken,
      'data-partition-id': 'osdu'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(endpoint, options, (res) => {
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
    
    req.write(requestBody);
    req.end();
  });
}

// Run the debug
debugEntitlementsAPI().catch(console.error);