const https = require('https');

// Test the entitlements GraphQL API with proper Cognito authentication
const testEntitlementsAPIWithAuth = async () => {
  const endpoint = 'https://ucbxezqhn5gjdcfak4ffsn65da.appsync-api.us-east-1.amazonaws.com/graphql';
  
  // Cognito tokens from browser (refreshed tokens)
  const accessToken = 'eyJraWQiOiJUc2VEcW9hZGlEV1VSVllqK3pDYXR5RTYzVUFtNWtQNlwvWVdiRWUranZ2Yz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2NDY4ZDRhOC1kMDkxLTcwZTgtMGVhNy1iN2E4OTRkYmU0OWMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9lVk5mUUg0blciLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiI2dGZjZWdxc24xdWc1OTFsdGJyamVmbmExOSIsIm9yaWdpbl9qdGkiOiJkNzM5ZmE2YS0zZDBjLTRhNDYtODNlNy0xNGVjMjcyMDBiMTciLCJldmVudF9pZCI6ImQzZDYzOGM0LTk4NzctNDY1Zi1iMjczLTQ1MDNlYzRkN2Q5YiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE3NTQ0NjgyODYsImV4cCI6MTc1NDQ3MTg4NiwiaWF0IjoxNzU0NDY4Mjg2LCJqdGkiOiI2ZTc3ZTJiNy1jMTM2LTQ4ZjktOTkxZS04ODU3MWFmZmIwYTUiLCJ1c2VybmFtZSI6ImNtZ2FicmkifQ.TM_2isTUjYC88aKgWPs2xQd9EVr9Tk6vZPn5a2gErynNO2MYWjp8wLbh6VnK9ixym0oAJDf-ncjBo22ODou_KzRZ05tNhrXsA6e5MWmgR1SPuXGPWyVjTTNrwkgeSFxjD8f7almyExKhrscl8gcVQYCNG4Lg2WNE9iTGh4hhBlvX-7DgFhL5upJfn0YdHiIO8HLawF2ibrqi4iHr6e6F_1aRWk4bUqhASjTez0JAC9gTjUxZvIWoc_j0ZP3hqssO0paV-uA3uPRunUj7xs9RM0kpDEtrNGgPms6mqtVKGrvB1Cp36nRrP73-zTr4Kbboi8VRJS-nV6M-3avzNJPsHQ';
  const idToken = 'eyJraWQiOiJ1MjNcLytLR04wN3dFKzJkOXlwcUp1MEJUYm1LRzljamtrOGpOWG1KK3hcL1E9IiwiYWxnIjoiUlMyNTYifQ.eyJhdF9oYXNoIjoiSHNxOS10R2UyTUpVcFNJRVlKYUp5USIsInN1YiI6IjY0NjhkNGE4LWQwOTEtNzBlOC0wZWE3LWI3YTg5NGRiZTQ5YyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9lVk5mUUg0blciLCJjb2duaXRvOnVzZXJuYW1lIjoiY21nYWJyaSIsImdpdmVuX25hbWUiOiJDaHJpcyIsIm9yaWdpbl9qdGkiOiJkNzM5ZmE2YS0zZDBjLTRhNDYtODNlNy0xNGVjMjcyMDBiMTciLCJhdWQiOiI2dGZjZWdxc24xdWc1OTFsdGJyamVmbmExOSIsImV2ZW50X2lkIjoiZDNkNjM4YzQtOTg3Ny00NjVmLWIyNzMtNDUwM2VjNGQ3ZDliIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTQ0NjgyODYsImV4cCI6MTc1NDQ3MTg4NiwiaWF0IjoxNzU0NDY4Mjg2LCJmYW1pbHlfbmFtZSI6IkdhYnJpZWwiLCJqdGkiOiI2NzVhNTg2Ny02YTE3LTQ0ZjEtYjRmYS0zOGQ4MzkyNDZkMTciLCJlbWFpbCI6ImNtZ2FicmlAYW1hem9uLmNvbSJ9.jgy3xinmyzDtxJgPFg-H5T0IHigK1qKb8kfSffjrxi8AkW-QPoOslJWg6cVr06M0UnCpQscsZggtPJKvIAiFXQ1CyOn029RkIWmaJNUsq94kVKDajiXlRzVlIQ43seRmC-yHe54FLdf1qG3_APbR7M97YB58mQHfAgjOPNvTmYs0WlgaZC6vXN_5_TgxahW19jFjSqZZ6_NGx66YujLNk0LJOEFaPvGMsKyM_ORdkQKZETtX8Qtdi7nOiQdPHrp4fe9u7yjdSAYDy5cit-n_nVG_dVMGyZPX-lE-MATDqWWi6Bx7ocD2-dimfCGOdyD6XtXQwb7ytbzfAQvXPpgl3g';

  console.log('🔍 Testing entitlements API with Cognito authentication...');
  console.log('Endpoint:', endpoint);

  // Test 1: List Entitlements
  await testListEntitlements(endpoint, accessToken);
  
  // Test 2: Create Entitlement
  await testCreateEntitlement(endpoint, accessToken);
  
  // Test 3: List Entitlements again to verify creation
  await testListEntitlements(endpoint, accessToken);
};

async function testListEntitlements(endpoint, accessToken) {
  console.log('\n📋 Testing listEntitlements...');
  
  const query = `
    query ListEntitlements($dataPartition: String!, $filter: EntitlementFilterInput, $pagination: PaginationInput) {
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
          updatedBy
          updatedAt
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

  try {
    const response = await makeGraphQLRequest(endpoint, query, variables, accessToken);
    
    if (response.errors) {
      console.error('❌ GraphQL Errors:', response.errors);
      return;
    }
    
    if (response.data && response.data.listEntitlements) {
      const entitlements = response.data.listEntitlements;
      console.log('✅ listEntitlements successful!');
      console.log(`📊 Found ${entitlements.items.length} entitlements`);
      
      if (entitlements.items.length > 0) {
        console.log('📝 Sample entitlement:', JSON.stringify(entitlements.items[0], null, 2));
      } else {
        console.log('ℹ️  No entitlements found (this is normal for a new system)');
      }
    } else {
      console.log('⚠️  Unexpected response structure:', response);
    }
  } catch (error) {
    console.error('❌ listEntitlements failed:', error.message);
  }
}

async function testCreateEntitlement(endpoint, accessToken) {
  console.log('\n➕ Testing createEntitlement...');
  
  const mutation = `
    mutation CreateEntitlement($input: CreateEntitlementInput!) {
      createEntitlement(input: $input) {
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
    }
  `;

  const variables = {
    input: {
      dataPartition: 'osdu',
      groupEmail: 'test-group@example.com',
      actions: ['read', 'write'],
      conditions: [
        {
          attribute: 'data.kind',
          operator: 'EQUALS',
          value: 'osdu:wks:dataset--File.Generic:1.0.0'
        }
      ]
    }
  };

  try {
    const response = await makeGraphQLRequest(endpoint, mutation, variables, accessToken);
    
    if (response.errors) {
      console.error('❌ GraphQL Errors:', response.errors);
      return;
    }
    
    if (response.data && response.data.createEntitlement) {
      const entitlement = response.data.createEntitlement;
      console.log('✅ createEntitlement successful!');
      console.log('📝 Created entitlement:', JSON.stringify(entitlement, null, 2));
    } else {
      console.log('⚠️  Unexpected response structure:', response);
    }
  } catch (error) {
    console.error('❌ createEntitlement failed:', error.message);
  }
}

// Helper function to make GraphQL requests with Cognito authentication
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

// Run the test
testEntitlementsAPIWithAuth().catch(console.error);