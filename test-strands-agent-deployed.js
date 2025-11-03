#!/usr/bin/env node

/**
 * Test Strands Agent Lambda Deployment
 * Verifies the Strands Agent Lambda is deployed and callable
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const STRANDS_AGENT_FUNCTION = 'amplify-digitalassistant--RenewableAgentsFunction0-6JliJjYdH7pm';

async function testStrandsAgent() {
  console.log('🧪 Testing Strands Agent Lambda Deployment');
  console.log('==========================================\n');

  const lambda = new LambdaClient({ region: 'us-east-1' });

  try {
    console.log('📞 Invoking Strands Agent Lambda...');
    console.log(`   Function: ${STRANDS_AGENT_FUNCTION}`);
    
    const payload = {
      agent: 'terrain',
      query: 'Test connection',
      parameters: {
        latitude: 35.067482,
        longitude: -101.395466,
        radius_km: 2.0
      }
    };

    const command = new InvokeCommand({
      FunctionName: STRANDS_AGENT_FUNCTION,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    });

    const startTime = Date.now();
    const response = await lambda.send(command);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Lambda invoked successfully in ${duration}ms`);
    console.log(`   Status Code: ${response.StatusCode}`);

    if (response.Payload) {
      const result = JSON.parse(new TextDecoder().decode(response.Payload));
      console.log(`\n📦 Response:`);
      console.log(JSON.stringify(result, null, 2));

      if (result.statusCode === 200) {
        console.log('\n✅ STRANDS AGENT IS WORKING!');
        return true;
      } else {
        console.log('\n⚠️  Lambda returned error status');
        return false;
      }
    }

  } catch (error) {
    console.error('\n❌ Error testing Strands Agent:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    return false;
  }
}

testStrandsAgent()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
