#!/usr/bin/env node

/**
 * Diagnose Layout Error Chain
 * 
 * Tests the layout optimization through the orchestrator to identify
 * where the infinite error chain is being generated.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testLayoutThroughOrchestrator() {
  console.log('🔍 Testing Layout Optimization through Orchestrator');
  console.log('=' .repeat(80));
  
  const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
  
  if (!orchestratorFunctionName) {
    console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME environment variable not set');
    process.exit(1);
  }
  
  console.log(`📍 Orchestrator: ${orchestratorFunctionName}`);
  console.log('');
  
  // Test payload - simple layout optimization request
  const payload = {
    query: 'Optimize turbine layout',
    chatSessionId: 'test-session-' + Date.now(),
    parameters: {
      latitude: 35.067482,
      longitude: -101.395466,
      num_turbines: 10
    }
  };
  
  console.log('📤 Sending request:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const command = new InvokeCommand({
      FunctionName: orchestratorFunctionName,
      Payload: JSON.stringify(payload)
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
    
    console.log('📥 Response Status:', result.statusCode);
    console.log('');
    
    if (result.body) {
      const body = JSON.parse(result.body);
      
      console.log('📊 Response Body:');
      console.log('  Success:', body.success);
      console.log('  Type:', body.type);
      console.log('  Has Data:', !!body.data);
      console.log('  Has Error:', !!body.error);
      console.log('  Has Artifacts:', !!body.artifacts);
      console.log('');
      
      if (body.error) {
        console.log('❌ ERROR DETECTED:');
        console.log('');
        
        // Check if this is the infinite error chain
        const errorString = typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
        const errorCount = (errorString.match(/Tool invocation failed/g) || []).length;
        
        console.log(`  Error mentions "Tool invocation failed" ${errorCount} times`);
        console.log('');
        
        if (errorCount > 10) {
          console.log('🚨 INFINITE ERROR CHAIN DETECTED!');
          console.log('');
          console.log('  First 500 characters of error:');
          console.log('  ' + errorString.substring(0, 500));
          console.log('  ...');
          console.log('');
          console.log('  Last 500 characters of error:');
          console.log('  ...');
          console.log('  ' + errorString.substring(errorString.length - 500));
        } else {
          console.log('  Error message:');
          console.log('  ' + errorString);
        }
        console.log('');
      }
      
      if (body.data) {
        console.log('✅ Data received:');
        console.log('  Keys:', Object.keys(body.data).join(', '));
        console.log('');
      }
      
      if (body.artifacts && body.artifacts.length > 0) {
        console.log(`✅ ${body.artifacts.length} artifact(s) generated`);
        body.artifacts.forEach((artifact, i) => {
          console.log(`  ${i + 1}. Type: ${artifact.type}`);
        });
        console.log('');
      }
      
      // Full response for debugging
      console.log('📄 Full Response (truncated):');
      const fullResponse = JSON.stringify(body, null, 2);
      if (fullResponse.length > 2000) {
        console.log(fullResponse.substring(0, 1000));
        console.log('  ... (truncated) ...');
        console.log(fullResponse.substring(fullResponse.length - 1000));
      } else {
        console.log(fullResponse);
      }
      
    } else {
      console.log('📄 Raw Response:');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testLayoutThroughOrchestrator()
  .then(() => {
    console.log('');
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
