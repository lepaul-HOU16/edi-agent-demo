#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function testOrchestrator() {
  const payload = {
    query: 'Analyze terrain at coordinates 35.067482, -101.395466 with 5km radius',
    projectId: 'test-' + Date.now(),
    sessionId: 'session-' + Date.now()
  };
  
  console.log('Testing orchestrator with payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  try {
    const command = new InvokeCommand({
      FunctionName: 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE',
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    console.log('\nResponse:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.errorMessage) {
      console.error('\n❌ Error:', result.errorMessage);
      console.error('Stack:', result.errorType);
    }
  } catch (error) {
    console.error('❌ Failed to invoke:', error.message);
    console.error(error);
  }
}

testOrchestrator();
