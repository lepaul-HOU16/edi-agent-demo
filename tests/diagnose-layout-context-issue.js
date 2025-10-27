#!/usr/bin/env node

/**
 * Diagnose Layout Context Issue
 * 
 * Tests the layout optimization with proper query format
 * to identify why coordinates aren't being passed from context.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testLayoutWithQuery() {
  console.log('🔍 Testing Layout Optimization with Query Format');
  console.log('=' .repeat(80));
  
  const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  
  if (!orchestratorFunctionName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable not set');
    process.exit(1);
  }
  
  console.log(`📍 Orchestrator: ${orchestratorFunctionName}`);
  console.log('');
  
  // Test 1: Layout with explicit coordinates in query
  console.log('TEST 1: Layout with coordinates in query');
  console.log('-'.repeat(80));
  
  const payload1 = {
    query: 'Optimize turbine layout at 35.067482, -101.395466 with 10 turbines',
    chatSessionId: 'test-session-' + Date.now()
  };
  
  console.log('📤 Query:', payload1.query);
  console.log('');
  
  try {
    const command = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify(payload1)
    });
    
    console.log('⏳ Invoking orchestrator...');
    const startTime = Date.now();
    
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms`);
    console.log('');
    
    if (!response.Payload) {
      console.error('❌ No payload in response');
      return;
    }
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.body) {
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      
      console.log('📊 Response:');
      console.log('  Success:', body.success);
      console.log('  Message:', body.message);
      console.log('  Has Artifacts:', body.artifacts?.length > 0);
      console.log('  Has Error:', !!body.error);
      console.log('');
      
      if (body.error) {
        console.log('❌ ERROR:');
        const errorString = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
        const errorCount = (errorString.match(/Tool invocation failed/g) || []).length;
        
        if (errorCount > 10) {
          console.log(`  🚨 INFINITE ERROR CHAIN (${errorCount} occurrences)`);
          console.log('  First 300 chars:', errorString.substring(0, 300));
        } else {
          console.log('  ', errorString.substring(0, 500));
        }
        console.log('');
      }
      
      if (body.artifacts && body.artifacts.length > 0) {
        console.log(`✅ ${body.artifacts.length} artifact(s):`);
        body.artifacts.forEach((artifact, i) => {
          console.log(`  ${i + 1}. ${artifact.type}`);
        });
        console.log('');
      }
      
      if (body.thoughtSteps) {
        console.log('💭 Thought Steps:');
        body.thoughtSteps.forEach(step => {
          const status = step.status === 'complete' ? '✅' : step.status === 'error' ? '❌' : '⏳';
          console.log(`  ${status} Step ${step.step}: ${step.action}`);
          if (step.error) {
            console.log(`     Error: ${step.error.message}`);
          }
        });
        console.log('');
      }
      
    } else {
      console.log('📄 Raw Response:');
      console.log(JSON.stringify(result, null, 2).substring(0, 1000));
    }
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    console.error(error.stack);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  
  // Test 2: Layout without coordinates (should fail gracefully)
  console.log('TEST 2: Layout without coordinates');
  console.log('-'.repeat(80));
  
  const payload2 = {
    query: 'Optimize turbine layout',
    chatSessionId: 'test-session-' + Date.now()
  };
  
  console.log('📤 Query:', payload2.query);
  console.log('');
  
  try {
    const command = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify(payload2)
    });
    
    console.log('⏳ Invoking orchestrator...');
    const startTime = Date.now();
    
    const response = await lambdaClient.send(command);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Response received in ${duration}ms`);
    console.log('');
    
    if (!response.Payload) {
      console.error('❌ No payload in response');
      return;
    }
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.body) {
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      
      console.log('📊 Response:');
      console.log('  Success:', body.success);
      console.log('  Message:', body.message);
      console.log('');
      
      if (!body.success) {
        console.log('✅ Correctly rejected request without coordinates');
      }
      
    } else {
      console.log('📄 Raw Response:');
      console.log(JSON.stringify(result, null, 2).substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
}

// Run the test
testLayoutWithQuery()
  .then(() => {
    console.log('');
    console.log('✅ Diagnostic complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
