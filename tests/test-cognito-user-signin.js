/**
 * Test Cognito User Sign-In
 * 
 * This script tests signing in with the test Cognito users
 * and verifies they can access the application.
 */

const { CognitoIdentityProviderClient, InitiateAuthCommand, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const USER_POOL_ID = 'us-east-1_sC6yswGji';
const CLIENT_ID = '18m99t0u39vi9614ssd8sf8vmb';
const REGION = 'us-east-1';

const client = new CognitoIdentityProviderClient({ region: REGION });

// Test users
const testUsers = [
  {
    email: 'testuser1@example.com',
    password: 'TestUser123!',
    name: 'Test User 1'
  },
  {
    email: 'testuser2@example.com',
    password: 'TestUser456!',
    name: 'Test User 2'
  }
];

async function testUserSignIn(email, password, name) {
  console.log(`\n🔐 Testing sign-in for ${name} (${email})...`);
  
  try {
    // Use AdminInitiateAuth for testing (requires admin credentials)
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await client.send(command);
    
    if (response.AuthenticationResult) {
      console.log(`✅ Sign-in successful for ${name}`);
      console.log(`   - Access Token: ${response.AuthenticationResult.AccessToken.substring(0, 50)}...`);
      console.log(`   - ID Token: ${response.AuthenticationResult.IdToken.substring(0, 50)}...`);
      console.log(`   - Token Type: ${response.AuthenticationResult.TokenType}`);
      console.log(`   - Expires In: ${response.AuthenticationResult.ExpiresIn} seconds`);
      
      // Decode ID token to show user info
      const idToken = response.AuthenticationResult.IdToken;
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      console.log(`   - User ID (sub): ${payload.sub}`);
      console.log(`   - Email: ${payload.email}`);
      console.log(`   - Email Verified: ${payload.email_verified}`);
      
      return {
        success: true,
        tokens: response.AuthenticationResult,
        userInfo: payload
      };
    } else {
      console.log(`❌ Sign-in failed for ${name}: No authentication result`);
      return { success: false, error: 'No authentication result' };
    }
  } catch (error) {
    console.log(`❌ Sign-in failed for ${name}:`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAPIAccess(idToken, userName) {
  console.log(`\n🌐 Testing API access for ${userName}...`);
  
  try {
    const API_URL = 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Test Session - ${userName} - ${new Date().toISOString()}`
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API access successful for ${userName}`);
      console.log(`   - Session created: ${data.id || data.sessionId || 'ID not returned'}`);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log(`❌ API access failed for ${userName}:`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorText}`);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.log(`❌ API access failed for ${userName}:`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Cognito Test User Sign-In Tests');
  console.log('='.repeat(60));
  console.log(`User Pool ID: ${USER_POOL_ID}`);
  console.log(`Client ID: ${CLIENT_ID}`);
  console.log(`Region: ${REGION}`);
  
  const results = [];
  
  for (const user of testUsers) {
    const signInResult = await testUserSignIn(user.email, user.password, user.name);
    
    if (signInResult.success) {
      // Test API access with the token
      const apiResult = await testAPIAccess(signInResult.tokens.IdToken, user.name);
      results.push({
        user: user.name,
        signIn: true,
        apiAccess: apiResult.success
      });
    } else {
      results.push({
        user: user.name,
        signIn: false,
        apiAccess: false
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.user}:`);
    console.log(`  Sign-In: ${result.signIn ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  API Access: ${result.apiAccess ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  const allPassed = results.every(r => r.signIn && r.apiAccess);
  
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('\nTest users are ready for use!');
    console.log('You can now sign in via the UI with these credentials.');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\nPlease review the errors above and fix any issues.');
  }
  console.log('='.repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
