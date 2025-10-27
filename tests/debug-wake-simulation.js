#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function testWakeSimulation() {
  // First create terrain and layout
  const orchestrator = 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE';
  const projectId = 'test-wake-' + Date.now();
  const sessionId = 'session-' + Date.now();
  
  console.log('Step 1: Creating terrain analysis...');
  const terrainPayload = {
    query: 'Analyze terrain at coordinates 35.067482, -101.395466 with 5km radius',
    projectId,
    sessionId
  };
  
  const terrainCmd = new InvokeCommand({
    FunctionName: orchestrator,
    Payload: JSON.stringify(terrainPayload)
  });
  
  const terrainResponse = await lambda.send(terrainCmd);
  const terrainResult = JSON.parse(Buffer.from(terrainResponse.Payload).toString());
  
  console.log('Terrain result:', terrainResult.success ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!terrainResult.success) {
    console.error('Terrain failed:', terrainResult.message);
    return;
  }
  
  console.log('\nStep 2: Creating layout optimization...');
  const layoutPayload = {
    query: 'Optimize turbine layout at coordinates 35.067482, -101.395466',
    projectId,
    sessionId
  };
  
  const layoutCmd = new InvokeCommand({
    FunctionName: orchestrator,
    Payload: JSON.stringify(layoutPayload)
  });
  
  const layoutResponse = await lambda.send(layoutCmd);
  const layoutResult = JSON.parse(Buffer.from(layoutResponse.Payload).toString());
  
  console.log('Layout result:', layoutResult.success ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!layoutResult.success) {
    console.error('Layout failed:', layoutResult.message);
    return;
  }
  
  console.log('\nStep 3: Running wake simulation...');
  const wakePayload = {
    query: 'Run wake simulation at coordinates 35.067482, -101.395466',
    projectId,
    sessionId
  };
  
  const wakeCmd = new InvokeCommand({
    FunctionName: orchestrator,
    Payload: JSON.stringify(wakePayload)
  });
  
  const wakeResponse = await lambda.send(wakeCmd);
  const wakeResult = JSON.parse(Buffer.from(wakeResponse.Payload).toString());
  
  console.log('\n=== WAKE SIMULATION RESULT ===');
  console.log('Success:', wakeResult.success);
  console.log('Message:', wakeResult.message);
  console.log('Artifacts:', wakeResult.artifacts?.length || 0);
  console.log('\nFull response:');
  console.log(JSON.stringify(wakeResult, null, 2));
}

testWakeSimulation().catch(console.error);
