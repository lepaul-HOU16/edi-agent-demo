/**
 * Test script for wellbore trajectory building
 * Tests the complete workflow from query to Minecraft visualization
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: 'us-east-1' });

async function testWellboreTrajectory() {
  console.log('=== Testing Wellbore Trajectory Building ===\n');
  
  // Get the EDIcraft Lambda function name
  const lambdaClient = new AWS.Lambda({ region: 'us-east-1' });
  const functions = await lambdaClient.listFunctions().promise();
  const edicraftFunction = functions.Functions.find(f => 
    f.FunctionName.includes('edicraftAgent') && !f.FunctionName.includes('resource')
  );
  
  if (!edicraftFunction) {
    console.error('❌ EDIcraft Lambda function not found');
    return;
  }
  
  console.log(`✅ Found EDIcraft Lambda: ${edicraftFunction.FunctionName}\n`);
  
  // Test query
  const testQuery = 'Build wellbore trajectory for WELL-011';
  console.log(`📝 Test Query: "${testQuery}"\n`);
  
  // Invoke the Lambda
  console.log('🚀 Invoking Lambda...\n');
  
  const payload = {
    arguments: {
      message: testQuery,
      userId: 'test-user-123'
    },
    identity: {
      sub: 'test-user-123'
    }
  };
  
  try {
    const result = await lambda.invoke({
      FunctionName: edicraftFunction.FunctionName,
      Payload: JSON.stringify(payload)
    }).promise();
    
    const response = JSON.parse(result.Payload);
    
    console.log('📊 Lambda Response:');
    console.log('Success:', response.success);
    console.log('Connection Status:', response.connectionStatus);
    console.log('\n📝 Message:');
    console.log(response.message);
    
    if (response.thoughtSteps && response.thoughtSteps.length > 0) {
      console.log('\n🧠 Thought Steps:');
      response.thoughtSteps.forEach((step, i) => {
        console.log(`  ${i + 1}. ${step}`);
      });
    }
    
    if (response.error) {
      console.log('\n❌ Error:', response.error);
    }
    
    // Check if the response indicates trajectory was built
    const messageText = response.message.toLowerCase();
    const isPlayerStatus = messageText.includes('player') && 
                          (messageText.includes('online') || messageText.includes('status'));
    const isTrajectoryBuilt = messageText.includes('wellbore') && 
                             (messageText.includes('built') || messageText.includes('trajectory'));
    
    console.log('\n🔍 Analysis:');
    console.log('  Is Player Status Response:', isPlayerStatus ? '❌ YES (WRONG)' : '✅ NO');
    console.log('  Is Trajectory Built:', isTrajectoryBuilt ? '✅ YES (CORRECT)' : '❌ NO (WRONG)');
    
    if (isPlayerStatus) {
      console.log('\n⚠️  ISSUE DETECTED: Agent returned player status instead of building trajectory');
      console.log('   This means the agent called list_players() or get_player_positions()');
      console.log('   instead of the trajectory building tools.');
    } else if (isTrajectoryBuilt) {
      console.log('\n✅ SUCCESS: Agent correctly built the wellbore trajectory!');
    } else {
      console.log('\n⚠️  UNCLEAR: Response does not clearly indicate trajectory building or player status');
    }
    
  } catch (error) {
    console.error('❌ Error invoking Lambda:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testWellboreTrajectory().catch(console.error);
