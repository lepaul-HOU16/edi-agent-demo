#!/usr/bin/env node

/**
 * Test Renewable Energy Deployment
 * 
 * This script tests the renewable energy deployment to identify issues.
 * Run with: node scripts/test-renewable-deployment.js
 */

const { LambdaClient, ListFunctionsCommand, GetFunctionCommand, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testDeployment() {
  console.log('🔍 Testing Renewable Energy Deployment...\n');
  
  const lambdaClient = new LambdaClient({});
  
  try {
    // Step 1: List all Lambda functions
    console.log('📋 Step 1: Listing deployed Lambda functions...');
    const listResponse = await lambdaClient.send(new ListFunctionsCommand({}));
    const allFunctions = (listResponse.Functions || []).map(f => f.FunctionName).sort();
    
    console.log(`Found ${allFunctions.length} total Lambda functions`);
    
    // Filter renewable functions
    const renewableFunctions = allFunctions.filter(name => 
      name.toLowerCase().includes('renewable') || 
      name.toLowerCase().includes('lightweight')
    );
    
    console.log('🌱 Renewable-related functions:');
    renewableFunctions.forEach(name => console.log(`  - ${name}`));
    console.log('');
    
    // Step 2: Check specific functions
    console.log('🔍 Step 2: Checking specific function details...');
    
    const expectedFunctions = [
      'lightweightAgent',
      'renewableOrchestrator'
    ];
    
    for (const functionName of expectedFunctions) {
      try {
        // Try exact name first
        let actualFunctionName = functionName;
        let response;
        
        try {
          response = await lambdaClient.send(new GetFunctionCommand({ FunctionName: functionName }));
        } catch (error) {
          // Try to find function with similar name
          const similarFunction = allFunctions.find(name => name.includes(functionName));
          if (similarFunction) {
            actualFunctionName = similarFunction;
            response = await lambdaClient.send(new GetFunctionCommand({ FunctionName: similarFunction }));
          } else {
            throw error;
          }
        }
        
        console.log(`✅ ${actualFunctionName}:`);
        console.log(`   Runtime: ${response.Configuration?.Runtime}`);
        console.log(`   State: ${response.Configuration?.State}`);
        console.log(`   Timeout: ${response.Configuration?.Timeout}s`);
        console.log(`   Memory: ${response.Configuration?.MemorySize}MB`);
        
        // Check environment variables
        const envVars = response.Configuration?.Environment?.Variables || {};
        const relevantEnvVars = Object.keys(envVars).filter(key => 
          key.includes('RENEWABLE') || key.includes('ORCHESTRATOR')
        );
        
        if (relevantEnvVars.length > 0) {
          console.log('   Environment variables:');
          relevantEnvVars.forEach(key => {
            const value = envVars[key];
            const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
            console.log(`     ${key}: ${displayValue}`);
          });
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${functionName}: NOT FOUND`);
        console.log(`   Error: ${error.message}`);
        console.log('');
      }
    }
    
    // Step 3: Test orchestrator invocation
    console.log('🧪 Step 3: Testing orchestrator invocation...');
    
    const orchestratorFunction = allFunctions.find(name => name.includes('renewableOrchestrator'));
    
    if (orchestratorFunction) {
      console.log(`Found orchestrator: ${orchestratorFunction}`);
      
      try {
        const testPayload = {
          query: 'Analyze terrain at coordinates 35.067482, -101.395466',
          userId: 'test-user',
          sessionId: 'test-session',
          context: {}
        };
        
        console.log('Invoking with test payload...');
        const invokeResponse = await lambdaClient.send(new InvokeCommand({
          FunctionName: orchestratorFunction,
          Payload: JSON.stringify(testPayload)
        }));
        
        if (invokeResponse.Payload) {
          const result = JSON.parse(new TextDecoder().decode(invokeResponse.Payload));
          console.log('✅ Orchestrator invocation successful!');
          console.log(`   Success: ${result.success}`);
          console.log(`   Message: ${result.message?.substring(0, 100)}...`);
          console.log(`   Artifacts: ${result.artifacts?.length || 0}`);
          
          if (!result.success) {
            console.log('❌ Orchestrator returned failure:');
            console.log(`   Error: ${result.metadata?.error?.message || 'Unknown error'}`);
            if (result.metadata?.validationErrors) {
              console.log('   Validation errors:');
              result.metadata.validationErrors.forEach(error => console.log(`     - ${error}`));
            }
          }
        } else {
          console.log('❌ No payload in orchestrator response');
        }
        
      } catch (error) {
        console.log('❌ Orchestrator invocation failed:');
        console.log(`   Error: ${error.message}`);
        
        if (error.message.includes('ResourceNotFoundException')) {
          console.log('   → This means the tool Lambda functions are not deployed');
          console.log('   → Check if Python tool functions exist');
        } else if (error.message.includes('AccessDenied')) {
          console.log('   → This is a permissions issue');
          console.log('   → Check IAM roles and policies');
        }
      }
    } else {
      console.log('❌ Orchestrator function not found');
      console.log('   → Run: npx ampx sandbox to deploy');
    }
    
    console.log('');
    
    // Step 4: Recommendations
    console.log('💡 Recommendations:');
    
    if (renewableFunctions.length === 0) {
      console.log('   1. No renewable functions found - run: npx ampx sandbox');
      console.log('   2. Check if amplify/backend.ts includes renewable function imports');
    } else if (!orchestratorFunction) {
      console.log('   1. Orchestrator not found - check amplify/functions/renewableOrchestrator/');
      console.log('   2. Verify backend.ts imports renewableOrchestrator');
    } else {
      console.log('   1. Functions appear to be deployed');
      console.log('   2. If terrain analysis still fails, check CloudWatch logs');
      console.log('   3. Try the debug API: /api/renewable/debug');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check AWS credentials: aws sts get-caller-identity');
    console.log('   2. Verify region is correct');
    console.log('   3. Run: npx ampx sandbox to deploy functions');
  }
}

// Run the test
testDeployment().catch(console.error);