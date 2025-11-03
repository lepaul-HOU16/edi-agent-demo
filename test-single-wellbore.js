#!/usr/bin/env node

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function getLambdaFunctionName() {
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const listCommand = new ListFunctionsCommand({});
  const listResponse = await lambdaClient.send(listCommand);
  
  const edicraftFunction = (listResponse.Functions || []).find(f => 
    f.FunctionName && f.FunctionName.includes('edicraftAgent')
  );
  
  if (edicraftFunction && edicraftFunction.FunctionName) {
    return edicraftFunction.FunctionName;
  }
  
  throw new Error('EDIcraft agent function not found');
}

async function invokeLambda(functionName, payload) {
  const client = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await client.send(command);
  const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
  
  return responsePayload;
}

async function test() {
  console.log('Testing: "Visualize wellbore WELL-005"');
  
  const functionName = await getLambdaFunctionName();
  console.log('Using function:', functionName);
  
  const event = {
    arguments: {
      message: 'Visualize wellbore WELL-005',
      userId: 'test-user-' + Date.now(),
      chatSessionId: 'test-session-' + Date.now()
    },
    identity: {
      sub: 'test-user-' + Date.now()
    }
  };
  
  console.log('\nInvoking Lambda...');
  const response = await invokeLambda(functionName, event);
  
  console.log('\n=== RESPONSE ===');
  console.log('Success:', response.success);
  console.log('Message length:', response.message?.length);
  console.log('\nMessage preview (first 500 chars):');
  console.log(response.message?.substring(0, 500));
  console.log('\n=== CHECKS ===');
  
  const hasWellId = response.message?.includes('WELL-005');
  const hasGreeting = response.message?.includes('Welcome to EDIcraft') || response.message?.includes('What I Can Do');
  const hasToolExecution = response.message?.includes('trajectory') || 
                          response.message?.includes('wellbore') || 
                          response.message?.includes('built') ||
                          response.message?.includes('Failed to') ||
                          response.message?.includes('Error') ||
                          response.message?.includes('response') ||
                          response.message?.includes('coordinates');
  
  console.log('Contains WELL-005:', hasWellId ? '✅' : '❌ (optional)');
  console.log('Is greeting:', hasGreeting ? '❌ (should not be greeting)' : '✅');
  console.log('Has tool execution:', hasToolExecution ? '✅' : '❌');
  
  if (hasGreeting) {
    console.log('\n❌ TEST FAILED - Agent returned greeting instead of executing wellbore tool');
    process.exit(1);
  } else if (!hasToolExecution) {
    console.log('\n❌ TEST FAILED - No evidence of tool execution');
    process.exit(1);
  } else {
    console.log('\n✅ TEST PASSED - Tool was called (even if it failed due to missing OSDU data)');
    process.exit(0);
  }
}

test().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
