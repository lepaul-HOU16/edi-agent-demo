const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });
const lambda = new AWS.Lambda();

async function testDebugArtifacts() {
  console.log('🔍 Testing artifact flow with detailed debugging...');
  
  const testPayload = {
    arguments: {
      chatSessionId: "debug-session-" + Date.now(),
      message: "Analyze the gamma ray logs from the wells and calculate shale volume using the Larionov method. Create interactive plots showing shale volume vs depth for the wells and identify the cleanest sand intervals. Focus on creating clear, engaging visualizations.",
      foundationModelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
      userId: "debug-user"
    },
    identity: {
      sub: "debug-user",
      username: "debug-user"
    }
  };

  console.log('📤 Invoking lambda with debug payload...');
  
  try {
    const result = await lambda.invoke({
      FunctionName: 'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY',
      Payload: JSON.stringify(testPayload),
      InvocationType: 'RequestResponse'
    }).promise();

    const response = JSON.parse(result.Payload);
    console.log('\n📊 Full Response Analysis:');
    console.log('Status Code:', result.StatusCode);
    
    if (response.errorMessage) {
      console.error('❌ Lambda Error:', response.errorMessage);
      console.error('Error Type:', response.errorType);
      console.error('Stack Trace:', response.stackTrace);
      return;
    }

    console.log('Response Keys:', Object.keys(response));
    console.log('Success:', response.success);
    console.log('Message Length:', response.message?.length || 0);
    console.log('Has Artifacts:', !!response.artifacts);
    console.log('Artifacts Type:', Array.isArray(response.artifacts) ? 'array' : typeof response.artifacts);
    console.log('Artifacts Length:', response.artifacts?.length || 0);
    
    // Check if there's any debug info
    if (response.debug) {
      console.log('\n🔍 Debug Information:');
      console.log(JSON.stringify(response.debug, null, 2));
    }
    
    // Try to parse the message to see if artifacts are embedded there
    try {
      const messageJson = JSON.parse(response.message);
      console.log('\n📝 Message is JSON with keys:', Object.keys(messageJson));
      if (messageJson.artifacts) {
        console.log('📦 Found artifacts in message:', messageJson.artifacts.length);
      }
    } catch (e) {
      console.log('\n📝 Message is plain text, not JSON');
    }
    
    console.log('\n📋 Full Response (truncated):');
    console.log(JSON.stringify(response, null, 2).substring(0, 1000) + '...');
    
    // Check for CloudWatch logs
    console.log('\n🔍 To see detailed logs, check CloudWatch for function:');
    console.log('amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY');
    console.log('Look for log entries with the timestamp around now');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDebugArtifacts();
