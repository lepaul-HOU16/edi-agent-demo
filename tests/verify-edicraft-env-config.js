#!/usr/bin/env node

/**
 * Verification script for EDIcraft Agent environment variable configuration
 * 
 * This script checks that all required environment variables are properly
 * configured in the deployed Lambda function.
 * 
 * Usage:
 *   node tests/verify-edicraft-env-config.js
 */

const { LambdaClient, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const REQUIRED_ENV_VARS = [
  // Bedrock AgentCore
  'BEDROCK_AGENT_ID',
  'BEDROCK_AGENT_ALIAS_ID',
  'BEDROCK_REGION',
  
  // Minecraft Server
  'MINECRAFT_HOST',
  'MINECRAFT_PORT',
  'MINECRAFT_RCON_PORT',
  'MINECRAFT_RCON_PASSWORD',
  
  // OSDU Platform
  'EDI_USERNAME',
  'EDI_PASSWORD',
  'EDI_CLIENT_ID',
  'EDI_CLIENT_SECRET',
  'EDI_PARTITION',
  'EDI_PLATFORM_URL'
];

async function verifyEnvironmentVariables() {
  console.log('🔍 Verifying EDIcraft Agent Environment Variables\n');
  
  try {
    // Initialize Lambda client
    const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    // Get list of Lambda functions to find the EDIcraft agent
    const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
    const listCommand = new ListFunctionsCommand({});
    const listResponse = await lambda.send(listCommand);
    
    // Find the EDIcraft agent function
    const edicraftFunction = listResponse.Functions.find(fn => 
      fn.FunctionName.includes('edicraftAgent') || 
      fn.FunctionName.includes('EDIcraftAgent')
    );
    
    if (!edicraftFunction) {
      console.error('❌ EDIcraft agent Lambda function not found');
      console.log('\nAvailable functions:');
      listResponse.Functions.forEach(fn => console.log(`  - ${fn.FunctionName}`));
      process.exit(1);
    }
    
    console.log(`✅ Found EDIcraft agent: ${edicraftFunction.FunctionName}\n`);
    
    // Get function configuration
    const getConfigCommand = new GetFunctionConfigurationCommand({
      FunctionName: edicraftFunction.FunctionName
    });
    
    const config = await lambda.send(getConfigCommand);
    const envVars = config.Environment?.Variables || {};
    
    // Check each required variable
    console.log('📋 Environment Variable Status:\n');
    
    let missingVars = [];
    let emptyVars = [];
    let configuredVars = [];
    
    REQUIRED_ENV_VARS.forEach(varName => {
      if (!(varName in envVars)) {
        console.log(`❌ ${varName}: NOT SET`);
        missingVars.push(varName);
      } else if (envVars[varName] === '' || envVars[varName] === 'undefined') {
        console.log(`⚠️  ${varName}: EMPTY`);
        emptyVars.push(varName);
      } else {
        // Mask sensitive values
        const isSensitive = varName.includes('PASSWORD') || 
                           varName.includes('SECRET') || 
                           varName.includes('CLIENT_ID');
        const displayValue = isSensitive ? '***' : envVars[varName];
        console.log(`✅ ${varName}: ${displayValue}`);
        configuredVars.push(varName);
      }
    });
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:\n');
    console.log(`✅ Configured: ${configuredVars.length}/${REQUIRED_ENV_VARS.length}`);
    console.log(`⚠️  Empty: ${emptyVars.length}`);
    console.log(`❌ Missing: ${missingVars.length}`);
    
    if (missingVars.length > 0) {
      console.log('\n❌ Missing variables:');
      missingVars.forEach(v => console.log(`   - ${v}`));
    }
    
    if (emptyVars.length > 0) {
      console.log('\n⚠️  Empty variables (need values):');
      emptyVars.forEach(v => console.log(`   - ${v}`));
    }
    
    // Recommendations
    console.log('\n' + '='.repeat(60));
    console.log('💡 Recommendations:\n');
    
    if (missingVars.length > 0 || emptyVars.length > 0) {
      console.log('1. Update your .env.local file with the missing/empty values');
      console.log('2. Redeploy the backend: npx ampx sandbox');
      console.log('3. Run this script again to verify');
      console.log('\nSee edicraft-agent/DEPLOYMENT_GUIDE.md for configuration details');
      process.exit(1);
    } else {
      console.log('✅ All environment variables are properly configured!');
      console.log('✅ EDIcraft agent is ready to use');
      console.log('\nNext steps:');
      console.log('1. Test the agent with a Minecraft query');
      console.log('2. Monitor CloudWatch logs for any issues');
      console.log('3. Verify Minecraft server connectivity');
    }
    
  } catch (error) {
    console.error('❌ Error verifying environment variables:', error.message);
    console.error('\nMake sure:');
    console.error('1. AWS credentials are configured');
    console.error('2. You have permissions to access Lambda');
    console.error('3. The backend has been deployed');
    process.exit(1);
  }
}

// Run verification
verifyEnvironmentVariables();
