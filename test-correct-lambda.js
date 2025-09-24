/**
 * Test the correct lightweightAgent Lambda function
 */

const AWS = require('aws-sdk');

const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testCorrectLambda() {
  console.log('🔍 === TESTING CORRECT LIGHTWEIGHT AGENT LAMBDA ===');
  
  // Test the actual lightweight agent function from the deployment
  const lightweightAgentFunctions = [
    'amplify-digitalassistant--lightweightAgentlambda3D-YHBgjx1rRMbY',
    'amplify-digitalassistant--lightweightAgentlambda3D-bsDyPJZEdW4w'
  ];
  
  for (const functionName of lightweightAgentFunctions) {
    console.log(`\n🎯 Testing function: ${functionName}`);
    
    try {
      const testPayload = {
        arguments: {
          chatSessionId: 'lambda-test-' + Date.now(),
          message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
          foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
          userId: 'test-user'
        },
        identity: {
          sub: 'test-user',
          username: 'test-user'
        }
      };
      
      const invokeParams = {
        FunctionName: functionName,
        Payload: JSON.stringify(testPayload),
        InvocationType: 'RequestResponse'
      };
      
      const startTime = Date.now();
      const response = await lambda.invoke(invokeParams).promise();
      const duration = Date.now() - startTime;
      
      console.log(`⏰ Execution time: ${duration}ms`);
      console.log(`📊 Status code: ${response.StatusCode}`);
      
      if (response.Payload) {
        const payloadStr = response.Payload.toString();
        console.log(`📄 Payload length: ${payloadStr.length} bytes`);
        
        try {
          const parsed = JSON.parse(payloadStr);
          console.log('📊 Response structure:', {
            success: parsed.success,
            messageLength: parsed.message?.length || 0,
            hasArtifacts: Array.isArray(parsed.artifacts),
            artifactCount: parsed.artifacts?.length || 0
          });
          
          console.log('📝 Message preview:', (parsed.message || '').substring(0, 150) + '...');
          
          // Check response type
          if (parsed.message && parsed.message.includes("I'd be happy to help you with your analysis!")) {
            console.log('❌ STILL GETTING GENERIC FALLBACK - Intent detection not working');
          } else if (parsed.message && parsed.message.includes('Comprehensive Production Well Data Analysis Complete')) {
            console.log('✅ Intent detection working - proper response message');
            
            if (parsed.artifacts && parsed.artifacts.length > 0) {
              console.log('🎉 ARTIFACTS FOUND!');
              console.log('📦 First artifact:', {
                messageContentType: parsed.artifacts[0]?.messageContentType,
                hasLogCurveAnalysis: !!parsed.artifacts[0]?.logCurveAnalysis,
                logCurveTypes: parsed.artifacts[0]?.logCurveAnalysis?.availableLogTypes?.length || 0
              });
              
              if (parsed.artifacts[0]?.logCurveAnalysis?.availableLogTypes) {
                console.log('📊 Log curves:', parsed.artifacts[0].logCurveAnalysis.availableLogTypes);
              }
            } else {
              console.log('❌ No artifacts - this explains missing visualization components');
            }
          } else {
            console.log('⚠️ Different response type - analyzing...');
            console.log('📄 Full message:', parsed.message);
          }
          
          // If this function worked, we found the right one
          if (parsed.success !== undefined) {
            console.log(`✅ Function ${functionName} is responding correctly`);
            break;
          }
          
        } catch (parseError) {
          console.log('❌ Failed to parse payload');
          console.log('📄 Raw payload preview:', payloadStr.substring(0, 200));
        }
      }
      
    } catch (error) {
      console.log(`❌ Function ${functionName} failed:`, error.message);
    }
  }
}

testCorrectLambda().catch(console.error);
