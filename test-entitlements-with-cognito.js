const { Amplify } = require('aws-amplify');
const { fetchAuthSession } = require('aws-amplify/auth');

// Configure Amplify (same as frontend)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_eVNfQH4nW',
      userPoolClientId: '6tfcegqsn1ug591ltbrjefna19',
      loginWith: {
        oauth: {
          domain: 'osdu.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:3000/callback'],
          redirectSignOut: ['http://localhost:3000/logout'],
          responseType: 'code'
        }
      }
    }
  }
});

const testEntitlementsWithCognito = async () => {
  try {
    console.log('🔍 Testing entitlements API with Cognito authentication...');
    
    // Get the current auth session
    const session = await fetchAuthSession();
    
    if (!session.tokens) {
      console.log('❌ No authentication tokens found. Please log in first.');
      return;
    }
    
    console.log('✅ Authentication tokens found');
    
    const endpoint = 'https://lmcmnthgenbpdeyc2txmqxjkjm.appsync-api.us-east-1.amazonaws.com/graphql';
    
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

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.tokens.accessToken.toString()}`,
      'data-partition-id': 'osdu'
    };

    console.log('📡 Making request with Cognito token...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    });

    const result = await response.json();
    
    console.log('✅ Response received:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('❌ GraphQL Errors:', result.errors);
    } else if (result.data && result.data.listEntitlements) {
      console.log('📋 Entitlements found:', result.data.listEntitlements.items?.length || 0);
      if (result.data.listEntitlements.items?.length === 0) {
        console.log('ℹ️  No entitlements exist yet - this is expected for a new system');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testEntitlementsWithCognito();
