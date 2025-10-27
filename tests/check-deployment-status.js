#!/usr/bin/env node

/**
 * Quick check to see if the orchestrator is deployed and has the latest code
 */

const { LambdaClient, GetFunctionCommand, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { fromNodeProviderChain } = require('@aws-sdk/credential-providers');

const lambda = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromNodeProviderChain(),
});

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');
  
  try {
    // Find orchestrator function
    const listResponse = await lambda.send(new ListFunctionsCommand({}));
    const orchestrator = listResponse.Functions.find(f => 
      f.FunctionName.toLowerCase().includes('renewableorchestrator')
    );
    
    if (!orchestrator) {
      console.log('❌ Renewable orchestrator Lambda not found');
      console.log('   Sandbox may not be deployed yet');
      return false;
    }
    
    console.log('✅ Found orchestrator:', orchestrator.FunctionName);
    console.log('   Runtime:', orchestrator.Runtime);
    console.log('   Last Modified:', orchestrator.LastModified);
    console.log('   Memory:', orchestrator.MemorySize, 'MB');
    console.log('   Timeout:', orchestrator.Timeout, 'seconds');
    
    // Get detailed configuration
    const getResponse = await lambda.send(new GetFunctionCommand({
      FunctionName: orchestrator.FunctionName,
    }));
    
    const envVars = getResponse.Configuration.Environment?.Variables || {};
    
    console.log('\n📋 Environment Variables:');
    const relevantVars = [
      'RENEWABLE_S3_BUCKET',
      'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
      'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
      'RENEWABLE_WINDROSE_TOOL_FUNCTION_NAME',
    ];
    
    let allSet = true;
    relevantVars.forEach(varName => {
      const value = envVars[varName];
      if (value) {
        console.log(`   ✅ ${varName}: ${value}`);
      } else {
        console.log(`   ❌ ${varName}: NOT SET`);
        allSet = false;
      }
    });
    
    if (!allSet) {
      console.log('\n⚠️  Some environment variables are missing');
      console.log('   This may indicate deployment is incomplete');
    }
    
    // Check code size
    const codeSize = getResponse.Configuration.CodeSize;
    const codeSizeMB = (codeSize / 1024 / 1024).toFixed(2);
    console.log(`\n📦 Code Size: ${codeSizeMB} MB`);
    
    // Check last update time
    const lastModified = new Date(getResponse.Configuration.LastModified);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastModified) / 1000 / 60);
    
    console.log(`⏰ Last Updated: ${minutesAgo} minutes ago`);
    
    if (minutesAgo > 30) {
      console.log('   ⚠️  Code may be stale (updated more than 30 minutes ago)');
      console.log('   Consider redeploying if you made recent changes');
    } else {
      console.log('   ✅ Code is recent');
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allSet && minutesAgo < 30) {
      console.log('✅ Deployment looks good - ready for testing');
      return true;
    } else {
      console.log('⚠️  Deployment may need attention');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
    return false;
  }
}

checkDeployment().then(success => {
  process.exit(success ? 0 : 1);
});
