#!/usr/bin/env node

/**
 * Verify NREL API Key Configuration
 * 
 * This script verifies that the NREL_API_KEY environment variable
 * is properly configured in the simulation and terrain Lambda functions.
 * 
 * Usage: node tests/verify-nrel-api-key-config.js
 */

const { LambdaClient, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function verifyNRELApiKey() {
  console.log('🔍 Verifying NREL API Key Configuration...\n');

  const lambdasToCheck = [
    { name: 'RenewableSimulationTool', description: 'Simulation Tool' },
    { name: 'RenewableTerrainTool', description: 'Terrain Tool' }
  ];

  let allConfigured = true;

  for (const lambda of lambdasToCheck) {
    try {
      // Find the Lambda function by partial name match
      const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
      const listClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const listCommand = new ListFunctionsCommand({});
      const listResponse = await listClient.send(listCommand);
      
      const matchingFunction = listResponse.Functions.find(f => 
        f.FunctionName.includes(lambda.name)
      );

      if (!matchingFunction) {
        console.log(`❌ ${lambda.description}: Lambda function not found`);
        console.log(`   Expected name pattern: *${lambda.name}*`);
        allConfigured = false;
        continue;
      }

      const functionName = matchingFunction.FunctionName;
      console.log(`📦 ${lambda.description}: ${functionName}`);

      // Get function configuration
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });

      const response = await client.send(command);
      const envVars = response.Environment?.Variables || {};

      // Check for NREL_API_KEY
      if (envVars.NREL_API_KEY) {
        const keyPreview = envVars.NREL_API_KEY.substring(0, 8) + '...';
        console.log(`   ✅ NREL_API_KEY: ${keyPreview} (configured)`);
      } else {
        console.log(`   ❌ NREL_API_KEY: NOT CONFIGURED`);
        allConfigured = false;
      }

      // Also check for S3_BUCKET (should be configured)
      if (envVars.S3_BUCKET || envVars.RENEWABLE_S3_BUCKET) {
        console.log(`   ✅ S3 Bucket: ${envVars.S3_BUCKET || envVars.RENEWABLE_S3_BUCKET}`);
      } else {
        console.log(`   ⚠️  S3 Bucket: Not configured`);
      }

      console.log('');

    } catch (error) {
      console.log(`❌ ${lambda.description}: Error checking configuration`);
      console.log(`   Error: ${error.message}`);
      allConfigured = false;
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  if (allConfigured) {
    console.log('✅ SUCCESS: NREL API Key is configured for all required Lambdas');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Test wind data fetching: node tests/test-nrel-wind-client.py');
    console.log('2. Test simulation integration: node tests/test-simulation-nrel-integration.js');
    console.log('3. Test terrain integration: node tests/test-terrain-nrel-integration.js');
  } else {
    console.log('❌ FAILURE: NREL API Key configuration is incomplete');
    console.log('');
    console.log('Required Actions:');
    console.log('1. Verify amplify/backend.ts has NREL_API_KEY configuration');
    console.log('2. Restart sandbox: npx ampx sandbox');
    console.log('3. Wait for deployment to complete');
    console.log('4. Run this script again to verify');
  }
  console.log('═══════════════════════════════════════════════════════════');

  process.exit(allConfigured ? 0 : 1);
}

// Run verification
verifyNRELApiKey().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
