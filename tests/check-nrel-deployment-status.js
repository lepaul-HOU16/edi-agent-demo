#!/usr/bin/env node

/**
 * Quick NREL Deployment Status Check
 * 
 * Checks if NREL_API_KEY is deployed to Lambda functions
 */

const { LambdaClient, ListFunctionsCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function checkDeploymentStatus() {
  console.log('🔍 Checking NREL Deployment Status\n');

  try {
    // List all renewable Lambda functions
    const listCommand = new ListFunctionsCommand({});
    const listResponse = await client.send(listCommand);
    
    const renewableLambdas = (listResponse.Functions || []).filter(f => 
      f.FunctionName && f.FunctionName.includes('Renewable')
    );

    if (renewableLambdas.length === 0) {
      console.log('❌ No renewable Lambda functions found');
      console.log('   Sandbox may not be running or AWS credentials not configured');
      console.log('\n   Action: Start sandbox with: npx ampx sandbox\n');
      console.log('   Or check AWS credentials with: aws sts get-caller-identity\n');
      process.exit(1);
    }

    console.log(`Found ${renewableLambdas.length} renewable Lambda functions:\n`);

    let needsDeployment = false;
    const lambdasToCheck = ['Simulation', 'Terrain'];

    for (const lambdaType of lambdasToCheck) {
      const lambda = renewableLambdas.find(l => l.FunctionName.includes(lambdaType));
      
      if (!lambda) {
        console.log(`❌ ${lambdaType} Lambda not found`);
        needsDeployment = true;
        continue;
      }

      console.log(`📦 ${lambdaType} Lambda: ${lambda.FunctionName}`);

      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: lambda.FunctionName
      });
      const config = await client.send(configCommand);
      const envVars = config.Environment?.Variables || {};

      if (envVars.NREL_API_KEY) {
        const keyPreview = envVars.NREL_API_KEY.substring(0, 8) + '...';
        console.log(`   ✅ NREL_API_KEY: ${keyPreview}`);
      } else {
        console.log(`   ❌ NREL_API_KEY: NOT DEPLOYED`);
        needsDeployment = true;
      }

      console.log(`   ✅ S3_BUCKET: ${envVars.S3_BUCKET || envVars.RENEWABLE_S3_BUCKET || 'Not set'}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');

    if (needsDeployment) {
      console.log('❌ DEPLOYMENT REQUIRED\n');
      console.log('The NREL_API_KEY is configured in backend.ts but not deployed.\n');
      console.log('Required Actions:');
      console.log('  1. Stop the current sandbox (Ctrl+C in the terminal running sandbox)');
      console.log('  2. Restart sandbox: npx ampx sandbox');
      console.log('  3. Wait for "Deployed" message (5-10 minutes)');
      console.log('  4. Run this script again to verify\n');
      console.log('After deployment, run:');
      console.log('  bash tests/deploy-and-validate-nrel.sh\n');
      process.exit(1);
    } else {
      console.log('✅ DEPLOYMENT COMPLETE\n');
      console.log('NREL_API_KEY is deployed to all required Lambda functions.\n');
      console.log('Next Steps:');
      console.log('  1. Run full validation: bash tests/deploy-and-validate-nrel.sh');
      console.log('  2. Test in UI: Request wind rose analysis');
      console.log('  3. Verify "Data Source: NREL Wind Toolkit" displays\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error checking deployment status:', error.message);
    process.exit(1);
  }
}

checkDeploymentStatus();
