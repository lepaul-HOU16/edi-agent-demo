#!/usr/bin/env node

/**
 * Test the complete terrain query flow
 * Tests: Frontend → Agent Router → Renewable Proxy → Orchestrator → Terrain Lambda
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

async function testTerrainQueryFlow() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING TERRAIN QUERY FLOW');
  console.log('═══════════════════════════════════════════════════════════\n');

  const query = 'Analyze terrain at coordinates 35.067482, -101.395466 in Texas';
  
  // Step 1: Test Agent Router (this is what the frontend calls)
  console.log('📍 Step 1: Testing Agent Router (frontend entry point)');
  console.log(`Query: "${query}"`);
  console.log('Agent Selection: auto (should detect renewable)\n');
  
  try {
    const agentHandlerPayload = {
      arguments: {
        message: query,
        chatSessionId: `test-${Date.now()}`,
        agentType: 'auto' // Let it auto-detect
      }
    };
    
    console.log('Invoking agent handler Lambda...');
    // Use the lightweight agent Lambda (this is what the frontend calls)
    const agentFunctionName = 'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY';
    
    console.log('Using Lambda:', agentFunctionName);
    
    const agentCommand = new InvokeCommand({
      FunctionName: agentFunctionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(agentHandlerPayload)
    });
    
    const agentResponse = await lambdaClient.send(agentCommand);
    const agentResult = JSON.parse(new TextDecoder().decode(agentResponse.Payload));
    
    console.log('\n✅ Agent Handler Response:');
    console.log('  Success:', agentResult.success);
    console.log('  Agent Used:', agentResult.agentUsed);
    console.log('  Message:', agentResult.message?.substring(0, 100) + '...');
    console.log('  Artifacts:', agentResult.artifacts?.length || 0);
    console.log('  Thought Steps:', agentResult.thoughtSteps?.length || 0);
    
    if (agentResult.agentUsed !== 'renewable_energy') {
      console.error('\n❌ ROUTING FAILURE: Query was routed to', agentResult.agentUsed, 'instead of renewable_energy');
      console.error('   This means the agent router pattern matching is broken');
      return;
    }
    
    if (!agentResult.success) {
      console.error('\n❌ QUERY FAILED:', agentResult.message);
      return;
    }
    
    if (!agentResult.artifacts || agentResult.artifacts.length === 0) {
      console.error('\n❌ NO ARTIFACTS RETURNED');
      console.error('   The query succeeded but returned no visualization artifacts');
      return;
    }
    
    console.log('\n✅ SUCCESS: Complete flow working!');
    console.log('   - Query routed to renewable agent');
    console.log('   - Orchestrator executed successfully');
    console.log('   - Terrain Lambda generated artifacts');
    console.log('   - Artifacts returned to frontend');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function findLambdaByName(searchTerm) {
  const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const client = new LambdaClient({ region: 'us-east-1' });
  
  const command = new ListFunctionsCommand({});
  const response = await client.send(command);
  
  const found = response.Functions.find(f => 
    f.FunctionName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return found?.FunctionName;
}

// Run the test
testTerrainQueryFlow().catch(console.error);
