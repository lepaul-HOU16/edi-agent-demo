#!/usr/bin/env node

/**
 * Lambda Existence Checker
 * 
 * Checks if renewable energy Lambda functions exist in AWS
 * 
 * Usage: node scripts/check-lambda-exists.js
 */

import { LambdaClient, GetFunctionCommand, ListFunctionsCommand } from '@aws-sdk/client-lambda';

const LAMBDA_FUNCTIONS = [
  'lightweightAgent',
  'renewableOrchestrator',
  'renewableTerrain',
  'renewableLayout',
  'renewableSimulation',
  'renewableReport',
  'renewableAgentCoreProxy'
];

async function checkLambdaExists() {
  console.log('🔍 Lambda Function Existence Checker\n');
  console.log('=' .repeat(80));
  
  const client = new LambdaClient({});
  const results = [];
  
  console.log('\n📋 Checking Lambda functions...\n');
  
  for (const functionName of LAMBDA_FUNCTIONS) {
    try {
      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      
      const response = await client.send(command);
      
      results.push({
        name: functionName,
        exists: true,
        arn: response.Configuration?.FunctionArn,
        runtime: response.Configuration?.Runtime,
        lastModified: response.Configuration?.LastModified,
        memorySize: response.Configuration?.MemorySize,
        timeout: response.Configuration?.Timeout
      });
      
      console.log(`✅ ${functionName}`);
      console.log(`   ARN: ${response.Configuration?.FunctionArn}`);
      console.log(`   Runtime: ${response.Configuration?.Runtime}`);
      console.log(`   Last Modified: ${response.Configuration?.LastModified}`);
      console.log('');
      
    } catch (error) {
      results.push({
        name: functionName,
        exists: false,
        error: error.message
      });
      
      console.log(`❌ ${functionName}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
  
  // Summary
  console.log('=' .repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  const existingFunctions = results.filter(r => r.exists);
  const missingFunctions = results.filter(r => !r.exists);
  
  console.log(`✅ Existing Functions: ${existingFunctions.length}/${LAMBDA_FUNCTIONS.length}`);
  console.log(`❌ Missing Functions: ${missingFunctions.length}/${LAMBDA_FUNCTIONS.length}`);
  
  if (missingFunctions.length > 0) {
    console.log('\n⚠️  MISSING FUNCTIONS:\n');
    missingFunctions.forEach(func => {
      console.log(`   - ${func.name}`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:\n');
    console.log('1. Deploy the missing Lambda functions:');
    console.log('   npx ampx sandbox --stream-function-logs');
    console.log('');
    console.log('2. Verify amplify/backend.ts includes all functions');
    console.log('');
    console.log('3. Check for deployment errors in the Amplify console');
    console.log('');
    
    // Check if ALL renewable functions are missing
    const renewableFunctions = LAMBDA_FUNCTIONS.filter(f => f.includes('renewable'));
    const missingRenewable = missingFunctions.filter(f => renewableFunctions.includes(f.name));
    
    if (missingRenewable.length === renewableFunctions.length) {
      console.log('⚠️  ALL renewable energy functions are missing!');
      console.log('   This explains the "access issue" error.');
      console.log('');
      console.log('   ROOT CAUSE: Renewable energy backend is not deployed');
      console.log('');
    }
  } else {
    console.log('\n✅ All Lambda functions exist!');
    console.log('\n💡 Next steps:');
    console.log('   - Check environment variables: node scripts/check-env-vars.js');
    console.log('   - Test direct invocation: node scripts/test-invoke-orchestrator.js');
  }
  
  // List all Lambda functions to see what's actually deployed
  console.log('\n' + '=' .repeat(80));
  console.log('\n📋 ALL DEPLOYED LAMBDA FUNCTIONS:\n');
  
  try {
    const listCommand = new ListFunctionsCommand({});
    const listResponse = await client.send(listCommand);
    
    if (listResponse.Functions && listResponse.Functions.length > 0) {
      console.log(`Found ${listResponse.Functions.length} Lambda functions in your account:\n`);
      listResponse.Functions.forEach(func => {
        const isRenewable = func.FunctionName.toLowerCase().includes('renewable');
        const prefix = isRenewable ? '🌱' : '  ';
        console.log(`${prefix} ${func.FunctionName}`);
      });
    } else {
      console.log('⚠️  No Lambda functions found in your account');
    }
  } catch (error) {
    console.log(`⚠️  Could not list Lambda functions: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(80));
  
  // Save report
  const fs = await import('fs');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: LAMBDA_FUNCTIONS.length,
      existing: existingFunctions.length,
      missing: missingFunctions.length
    },
    results
  };
  
  fs.writeFileSync('docs/LAMBDA_EXISTENCE_CHECK.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Report saved to: docs/LAMBDA_EXISTENCE_CHECK.json\n');
  
  // Exit with error code if functions are missing
  if (missingFunctions.length > 0) {
    process.exit(1);
  }
}

checkLambdaExists().catch(console.error);
