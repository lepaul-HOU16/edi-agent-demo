/**
 * Direct Lambda function test to debug why artifacts aren't reaching the frontend
 */

const AWS = require('aws-sdk');

// Configure AWS Lambda client
const lambda = new AWS.Lambda({
  region: 'us-east-1'
});

console.log('🔍 === DIRECT LAMBDA DEBUG TEST ===');
console.log('🎯 Testing actual deployed Lambda function to see artifact flow');

async function testDirectLambda() {
  try {
    // Find the actual Lambda function name from the deployment
    console.log('📋 Step 1: Listing Lambda functions...');
    
    const listFunctionsResponse = await lambda.listFunctions({
      MaxItems: 50
    }).promise();
    
    const functions = listFunctionsResponse.Functions || [];
    console.log('🔧 Available Lambda functions:');
    
    // Look for functions with "agent" in the name
    const agentFunctions = functions.filter(func => 
      func.FunctionName?.toLowerCase().includes('agent') ||
      func.FunctionName?.toLowerCase().includes('lightweight')
    );
    
    agentFunctions.forEach((func, i) => {
      console.log(`  ${i + 1}. ${func.FunctionName} (${func.Runtime}, ${func.Handler})`);
    });
    
    if (agentFunctions.length === 0) {
      console.log('❌ No agent-related Lambda functions found');
      return;
    }
    
    // Use the first agent function found
    const targetFunction = agentFunctions[0];
    console.log('🎯 Testing function:', targetFunction.FunctionName);
    
    // Test with prompt #1 (well data discovery) to see if artifacts are generated
    const testPayload = {
      arguments: {
        chatSessionId: 'direct-lambda-test-' + Date.now(),
        message: 'Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics.',
        foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user'
      },
      identity: {
        sub: 'test-user',
        username: 'test-user'
      }
    };
    
    console.log('\n📋 Step 2: Invoking Lambda function directly...');
    console.log('💬 Test message preview:', testPayload.arguments.message.substring(0, 100) + '...');
    
    const invokeParams = {
      FunctionName: targetFunction.FunctionName,
      Payload: JSON.stringify(testPayload),
      InvocationType: 'RequestResponse'
    };
    
    const startTime = Date.now();
    const invokeResponse = await lambda.invoke(invokeParams).promise();
    const duration = Date.now() - startTime;
    
    console.log(`⏰ Lambda execution time: ${duration}ms`);
    console.log('📊 Lambda response status:', invokeResponse.StatusCode);
    
    if (invokeResponse.Payload) {
      const payloadStr = invokeResponse.Payload.toString();
      console.log('📄 Raw payload length:', payloadStr.length);
      
      try {
        const parsedPayload = JSON.parse(payloadStr);
        console.log('✅ Lambda response parsed successfully');
        console.log('📊 Lambda response structure:', {
          success: parsedPayload.success,
          messageLength: parsedPayload.message?.length || 0,
          hasArtifacts: Array.isArray(parsedPayload.artifacts),
          artifactCount: parsedPayload.artifacts?.length || 0,
          errorMessage: parsedPayload.error || 'No error'
        });
        
        console.log('📝 Response message preview:', (parsedPayload.message || '').substring(0, 200) + '...');
        
        // Check for specific response patterns
        if (parsedPayload.message && parsedPayload.message.includes("I'd be happy to help you with your analysis!")) {
          console.log('❌ CRITICAL: Lambda is still returning generic fallback response');
          console.log('💡 This means intent detection is NOT working in Lambda');
          console.log('🔧 Possible causes:');
          console.log('  1. Lambda code wasn\'t actually updated');
          console.log('  2. Different Lambda function being used');
          console.log('  3. Import/caching issues in Lambda');
        } else if (parsedPayload.message && parsedPayload.message.includes('Comprehensive Production Well Data Analysis Complete')) {
          console.log('✅ Intent detection working - getting proper response message');
          
          if (parsedPayload.artifacts && parsedPayload.artifacts.length > 0) {
            console.log('✅ ARTIFACTS FOUND in Lambda response!');
            console.log('🎯 Artifact details:', parsedPayload.artifacts.map((a, i) => ({
              index: i,
              messageContentType: a?.messageContentType,
              hasLogCurveAnalysis: !!a?.logCurveAnalysis,
              logCurveCount: a?.logCurveAnalysis?.availableLogTypes?.length || 0,
              keys: Object.keys(a || {})
            })));
            
            // Check for real log curves in artifacts
            const firstArtifact = parsedPayload.artifacts[0];
            if (firstArtifact?.logCurveAnalysis?.availableLogTypes) {
              console.log('📊 Log curves in artifact:', firstArtifact.logCurveAnalysis.availableLogTypes);
              
              const realCurves = ['DEPT', 'DEEPRESISTIVITY', 'SHALLOWRESISTIVITY', 'LITHOLOGY'];
              const hasRealCurves = realCurves.some(curve => 
                firstArtifact.logCurveAnalysis.availableLogTypes.includes(curve)
              );
              
              if (hasRealCurves) {
                console.log('✅ REAL S3 log curves found in artifact!');
              } else {
                console.log('❌ Only generic fallback curves in artifact');
              }
            }
          } else {
            console.log('❌ CRITICAL: No artifacts in Lambda response');
            console.log('💡 This explains why no visualization components appear');
            console.log('🔧 Issue is in MCP tool artifact generation or response processing');
          }
        } else {
          console.log('⚠️ Unexpected response message - check content');
        }
        
      } catch (parseError) {
        console.error('❌ Failed to parse Lambda payload:', parseError);
        console.log('📄 Raw payload preview:', payloadStr.substring(0, 500));
      }
    } else {
      console.log('❌ No payload in Lambda response');
    }
    
    console.log('\n🎯 === LAMBDA DEBUG DIAGNOSIS ===');
    
  } catch (error) {
    console.error('💥 Direct Lambda test failed:', error.message);
    
    if (error.code === 'ResourceNotFoundException') {
      console.log('❌ Lambda function not found - check function name');
    } else if (error.code === 'AccessDenied') {
      console.log('❌ No permission to invoke Lambda - check IAM permissions');
    } else {
      console.log('❌ Unknown Lambda invocation error');
    }
  }
}

testDirectLambda().catch(console.error);
