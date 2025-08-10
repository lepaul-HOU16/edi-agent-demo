const https = require('https');

// Test the entitlements GraphQL API with real Cognito tokens
const testEntitlementsAPI = async () => {
  const endpoint = 'https://lmcmnthgenbpdeyc2txmqxjkjm.appsync-api.us-east-1.amazonaws.com/graphql';
  
  // Your actual tokens
  const accessToken = 'eyJraWQiOiJUc2VEcW9hZGlEV1VSVllqK3pDYXR5RTYzVUFtNWtQNlwvWVdiRWUranZ2Yz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI2NDY4ZDRhOC1kMDkxLTcwZTgtMGVhNy1iN2E4OTRkYmU0OWMiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9lVk5mUUg0blciLCJjbGllbnRfaWQiOiI2dGZjZWdxc24xdWc1OTFsdGJyamVmbmExOSIsIm9yaWdpbl9qdGkiOiI5NjkwODc2Yy04Y2I2LTQ1MzctYmYxMS05NGE5NDUwZDAzMmUiLCJldmVudF9pZCI6ImFkMDA5MWRmLWI2MjUtNDA0OS1hMGI2LTc5OTRhNWM4YWVmYiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3NTQ0MDQ2NDQsImV4cCI6MTc1NDQyNzgxMywiaWF0IjoxNzU0NDI0MjEzLCJqdGkiOiI1ZWEwZDBlOC1kMjZhLTRmYTYtOTczYS05Y2M0ZGZkNDUyNmUiLCJ1c2VybmFtZSI6ImNtZ2FicmkifQ.IphROd0eGUL2Dm-Gatr6L0om5mZ3DCnI-keGRs3tyilk6LfjqBGGoaNaGia8dLbsYieCiGxHHzkVujU5ehMXHcH4AJjoFIX3sRrk5KMWolI8LNBWe-rtFujcfghoBB8z5wl-tSCV9wTd152LCgsLUYMQd9KXHaGtLIYrd475u9chQPd3AS-wXlOlz_1LupRhZ9RBsbEtq6ZpYInIBAOBN9LbU9haJCEsTVCC0kRiAFMV_dYoeN2hbbxbE7OPDBiE6lnQLomv_JkmM8NmTWAHD6OcK9yrh5DEmiu94GeWVGrmpT_xu1VjXFbXjZqfo9wG1MvDV4mpOKy2eWkXBVMnwQ';
  
  const idToken = 'eyJraWQiOiJ1MjNcLytLR04wN3dFKzJkOXlwcUp1MEJUYm1LRzljamtrOGpOWG1KK3hcL1E9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiI2NDY4ZDRhOC1kMDkxLTcwZTgtMGVhNy1iN2E4OTRkYmU0OWMiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfZVZOZlFING5XIiwiY29nbml0bzp1c2VybmFtZSI6ImNtZ2FicmkiLCJnaXZlbl9uYW1lIjoiQ2hyaXMiLCJvcmlnaW5fanRpIjoiOTY5MDg3NmMtOGNiNi00NTM3LWJmMTEtOTRhOTQ1MGQwMzJlIiwiYXVkIjoiNnRmY2VncXNuMXVnNTkxbHRicmplZm5hMTkiLCJldmVudF9pZCI6ImFkMDA5MWRmLWI2MjUtNDA0OS1hMGI2LTc5OTRhNWM4YWVmYiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzU0NDA0NjQ0LCJleHAiOjE3NTQ0Mjc4MTMsImlhdCI6MTc1NDQyNDIxMywiZmFtaWx5X25hbWUiOiJHYWJyaWVsIiwianRpIjoiOWFhZTQ2YWUtOWMzZi00YWViLTgxYjItNWJmOWFkMzQxOTNhIiwiZW1haWwiOiJjbWdhYnJpQGFtYXpvbi5jb20ifQ.OB7rniGQ0nvmRnpyvzh-vIk5s8gqntdiu0NkgzY2CZDbKsAFTZaSNjcpQPOqmMbL1DYV7-rQd_G97fTuCzNGgDv-W9gsYfujLzVtuOMw9_1FqY8boAba4eHuzDB3Jf_1ZGb3Y2l-A9DKuefHk6jENMFenqJcJIr6kD5px1oLF9o39EfZVp3E88dBE7w5iTd8QQDU-QDC7n4n6z7HODKRXc1awtGIEDVyDIBfl0HoiC5ky5JqzOH41v7eDY6xglmfX096gVyjsSiGk05-jQR0sd2mdXN1fc8MAdRHlbFUJXniFcDYtKC8kI45GrIbWgPIi2Xt395pzc5S3feTqlUqNA';

  // Test query
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

  // Test with access token
  console.log('🔍 Testing with Access Token...');
  await testWithToken(endpoint, requestBody, accessToken, 'Access Token');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test with ID token
  console.log('🔍 Testing with ID Token...');
  await testWithToken(endpoint, requestBody, idToken, 'ID Token');
};

async function testWithToken(endpoint, requestBody, token, tokenType) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'data-partition-id': 'osdu'
    }
  };

  try {
    console.log(`📡 Making request with ${tokenType}...`);
    
    const response = await makeRequest(endpoint, options, requestBody);
    console.log(`✅ Response received:`, JSON.stringify(response, null, 2));
    
    if (response.errors) {
      console.error(`❌ GraphQL Errors with ${tokenType}:`, response.errors);
    } else if (response.data) {
      console.log(`📊 Data with ${tokenType}:`, response.data);
      if (response.data.listEntitlements) {
        const items = response.data.listEntitlements.items || [];
        console.log(`📋 Found ${items.length} entitlements`);
        if (items.length === 0) {
          console.log('ℹ️  No entitlements exist yet - ready to create the first one!');
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Request failed with ${tokenType}:`, error.message);
  }
}

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
