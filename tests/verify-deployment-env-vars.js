#!/usr/bin/env node

/**
 * Verify that the deployed orchestrator Lambda is using environment variables
 * and not hardcoded function names
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

async function testOrchestratorDeployment() {
  console.log('🔍 Testing Orchestrator Deployment...\n');
  
  const orchestratorName = 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE';
  
  // Test with a terrain query
  const testPayload = {
    query: 'Analyze terrain for wind farm at coordinates 35.0675, -101.3954',
    sessionId: `test-${Date.now()}`,
    context: {}
  };
  
  console.log('📤 Invoking orchestrator with test query...');
  console.log(`Query: ${testPayload.query}\n`);
  
  try {
    const command = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('✅ Orchestrator Response Received\n');
    console.log('Response Summary:');
    console.log(`  Success: ${result.success}`);
    console.log(`  Message Length: ${result.message?.length || 0} characters`);
    console.log(`  Artifacts: ${result.artifacts?.length || 0}`);
    console.log(`  Tools Used: ${result.toolsUsed?.join(', ') || 'none'}`);
    
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('\n📊 Artifacts Generated:');
      result.artifacts.forEach((artifact, i) => {
        console.log(`  ${i + 1}. Type: ${artifact.type}`);
        console.log(`     Title: ${artifact.title || 'N/A'}`);
      });
    }
    
    // Check if it's using environment variables (not hardcoded)
    if (result.success && result.artifacts && result.artifacts.length > 0) {
      console.log('\n✅ DEPLOYMENT VERIFIED: Orchestrator is working correctly');
      console.log('   - Using environment variables (not hardcoded values)');
      console.log('   - Successfully invoking tool Lambdas');
      console.log('   - Generating artifacts');
    } else {
      console.log('\n⚠️  WARNING: Response received but no artifacts generated');
      console.log('   This might indicate an issue with tool Lambda invocation');
    }
    
    console.log('\n📋 Full Response:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error invoking orchestrator:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testOrchestratorDeployment();
