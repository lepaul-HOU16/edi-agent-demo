const AWS = require('aws-sdk');

async function testReportLambda() {
  const lambda = new AWS.Lambda({ region: 'us-east-1' });
  
  const payload = {
    query: "Perform financial analysis and ROI calculation",
    chatSessionId: "test-session-" + Date.now(),
    requestId: "test-request-" + Date.now()
  };
  
  console.log('🧪 Testing orchestrator with financial analysis query...');
  console.log('Query:', payload.query);
  console.log('');
  
  try {
    const result = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE',
      Payload: JSON.stringify(payload)
    }).promise();
    
    const response = JSON.parse(result.Payload);
    
    console.log('✅ Orchestrator Response:');
    console.log('Status Code:', result.StatusCode);
    console.log('');
    
    if (response.statusCode === 200 && response.body) {
      const body = response.body;
      console.log('Success:', body.success);
      console.log('Message:', body.message);
      console.log('Artifacts:', body.artifacts ? body.artifacts.length : 0);
      console.log('');
      
      if (body.thoughtSteps && body.thoughtSteps.length > 0) {
        console.log('Thought Steps:');
        body.thoughtSteps.forEach((step, i) => {
          console.log(`  ${i + 1}. ${step.action} - ${step.status}`);
          if (step.error) {
            console.log(`     Error: ${step.error.message}`);
          }
        });
      }
      
      // Check for specific issues
      const responseStr = JSON.stringify(response);
      if (responseStr.includes('Mock data') || responseStr.includes('mock data')) {
        console.log('');
        console.log('❌ STILL RETURNING MOCK DATA!');
      } else {
        console.log('');
        console.log('✅ No mock data detected');
      }
      
      if (responseStr.includes('timeout') || responseStr.includes('Timeout') || responseStr.includes('timed out')) {
        console.log('❌ Still getting timeout errors');
      } else {
        console.log('✅ No timeout errors');
      }
      
      if (body.artifacts && body.artifacts.length > 0) {
        console.log('✅ Artifacts generated successfully!');
        console.log('');
        console.log('Artifact details:');
        body.artifacts.forEach((artifact, i) => {
          console.log(`  ${i + 1}. Type: ${artifact.type}`);
          if (artifact.data) {
            console.log(`     Title: ${artifact.data.title || 'N/A'}`);
            console.log(`     Report Type: ${artifact.data.reportType || 'N/A'}`);
          }
        });
      } else {
        console.log('⚠️  No artifacts generated');
      }
    } else {
      console.log('❌ Error response:', JSON.stringify(response, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error calling orchestrator:', error.message);
    if (error.message.includes('timeout')) {
      console.log('❌ Lambda invocation timed out');
    }
  }
}

testReportLambda().catch(console.error);
