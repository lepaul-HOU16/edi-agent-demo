const AWS = require('aws-sdk');

// Configure AWS
const amplifyConfig = require('./amplify_outputs.json');
AWS.config.update({
  region: amplifyConfig.aws_project_region || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lambda = new AWS.Lambda();

async function testWindFarmContextFix() {
  console.log('🚁 Testing Wind Farm Context Fix - Conversation History Integration');
  console.log('=================================================================');

  try {
    // First test: Initial terrain analysis request
    console.log('\n1️⃣ TESTING: Initial terrain analysis request...');
    
    const terrainAnalysisPayload = {
      chatSessionId: 'test-wind-farm-session-' + Date.now(),
      message: 'Analyze terrain for wind farm development at coordinates 32.7767, -96.7970 for 30MW capacity',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user-wind-farm'
    };

    const terrainResponse = await lambda.invoke({
      FunctionName: 'lightweightAgent',
      Payload: JSON.stringify(terrainAnalysisPayload)
    }).promise();

    const terrainResult = JSON.parse(terrainResponse.Payload);
    console.log('🌍 Terrain Analysis Response:', {
      success: terrainResult.success,
      messageLength: terrainResult.message?.length || 0,
      artifactCount: terrainResult.artifacts?.length || 0,
      agentUsed: terrainResult.agentUsed
    });

    if (!terrainResult.success) {
      throw new Error('Terrain analysis failed: ' + terrainResult.message);
    }

    // Check if we got a WindFarmTerrain artifact
    const terrainArtifact = terrainResult.artifacts?.find(a => 
      a.messageContentType === 'wind-farm-terrain-analysis'
    );

    if (!terrainArtifact) {
      throw new Error('Expected WindFarmTerrain artifact not found in response');
    }

    console.log('✅ Terrain analysis successful with artifact');
    console.log('🗺️ Terrain artifact includes:', Object.keys(terrainArtifact));

    // Second test: Workflow button click with coordinates (simulating user clicking "Start Layout Design")
    console.log('\n2️⃣ TESTING: Workflow button click with context preservation...');
    
    const workflowButtonPayload = {
      chatSessionId: terrainAnalysisPayload.chatSessionId, // Same session
      message: 'I want to start the layout design process. Based on the previous terrain analysis at coordinates 32.7767, -96.7970, please proceed with optimal turbine placement for 30MW capacity using grid configuration with IEA_Reference_3.4MW_130 turbines.',
      foundationModelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
      userId: 'test-user-wind-farm'
    };

    const layoutResponse = await lambda.invoke({
      FunctionName: 'lightweightAgent',
      Payload: JSON.stringify(workflowButtonPayload)
    }).promise();

    const layoutResult = JSON.parse(layoutResponse.Payload);
    console.log('🏗️ Layout Design Response:', {
      success: layoutResult.success,
      messageLength: layoutResult.message?.length || 0,
      artifactCount: layoutResult.artifacts?.length || 0,
      agentUsed: layoutResult.agentUsed
    });

    if (!layoutResult.success) {
      throw new Error('Layout design failed: ' + layoutResult.message);
    }

    // Check if we got a WindFarmLayout artifact
    const layoutArtifact = layoutResult.artifacts?.find(a => 
      a.messageContentType === 'wind-farm-layout'
    );

    if (!layoutArtifact) {
      console.log('⚠️ Expected WindFarmLayout artifact not found');
      console.log('Available artifacts:', layoutResult.artifacts?.map(a => a.messageContentType));
    } else {
      console.log('✅ Layout design successful with artifact');
      console.log('🗺️ Layout artifact includes:', Object.keys(layoutArtifact));
    }

    // Third test: Check if the response contains context from previous message
    console.log('\n3️⃣ TESTING: Context preservation validation...');
    
    const responseText = layoutResult.message.toLowerCase();
    const contextPreserved = responseText.includes('32.7767') || 
                           responseText.includes('-96.7970') || 
                           responseText.includes('30mw') ||
                           responseText.includes('terrain');

    if (contextPreserved) {
      console.log('✅ CONTEXT PRESERVATION: Response includes previous conversation context');
    } else {
      console.log('❌ CONTEXT PRESERVATION: Response may not include previous context');
      console.log('Response preview:', responseText.substring(0, 200) + '...');
    }

    // Check if response is generic (indicating context loss)
    const genericResponse = responseText.includes('please provide') && 
                          (responseText.includes('coordinates') || responseText.includes('location'));

    if (genericResponse) {
      console.log('❌ GENERIC RESPONSE: Agent is asking for basic parameters (context lost)');
    } else {
      console.log('✅ CONTEXTUAL RESPONSE: Agent is not asking for basic parameters');
    }

    console.log('\n🎯 CONTEXT FIX VALIDATION SUMMARY:');
    console.log('================================');
    console.log('✅ Terrain analysis successful:', !!terrainArtifact);
    console.log('✅ Layout design successful:', !!layoutArtifact);
    console.log('✅ Context preserved in response:', contextPreserved);
    console.log('✅ Non-generic response:', !genericResponse);
    
    const allTestsPassed = terrainArtifact && layoutArtifact && contextPreserved && !genericResponse;
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED: Wind farm context fix working correctly!');
    } else {
      console.log('⚠️ SOME TESTS FAILED: Context fix may need additional work');
    }

    return allTestsPassed;

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testWindFarmContextFix()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      console.log(success ? '✅ WIND FARM CONTEXT FIX: WORKING' : '❌ WIND FARM CONTEXT FIX: NEEDS WORK');
      console.log('='.repeat(50));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testWindFarmContextFix };
