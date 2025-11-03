/**
 * Test Simplified Thought Steps Implementation
 * Verifies that the orchestrator returns proper timing data and status
 */

const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ region: process.env.AWS_REGION || 'us-east-1' });

async function testThoughtSteps() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING SIMPLIFIED THOUGHT STEPS');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get orchestrator Lambda name
    const functions = await lambda.listFunctions().promise();
    const orchestratorFunction = functions.Functions.find(f => 
      f.FunctionName.includes('renewableOrchestrator')
    );

    if (!orchestratorFunction) {
      console.error('❌ Orchestrator Lambda not found');
      process.exit(1);
    }

    console.log(`✅ Found orchestrator: ${orchestratorFunction.FunctionName}\n`);

    // Test 1: Terrain analysis with thought steps
    console.log('Test 1: Terrain Analysis Thought Steps');
    console.log('─────────────────────────────────────────────────────────\n');

    const terrainPayload = {
      query: 'Analyze terrain at 35.067482, -101.395466',
      sessionId: `test-session-${Date.now()}`,
      context: {}
    };

    const terrainResponse = await lambda.invoke({
      FunctionName: orchestratorFunction.FunctionName,
      Payload: JSON.stringify(terrainPayload)
    }).promise();

    const terrainResult = JSON.parse(terrainResponse.Payload);

    console.log('Response received:');
    console.log(`  Success: ${terrainResult.success}`);
    console.log(`  Thought Steps: ${terrainResult.thoughtSteps?.length || 0}\n`);

    if (terrainResult.thoughtSteps && terrainResult.thoughtSteps.length > 0) {
      console.log('Thought Steps Details:');
      terrainResult.thoughtSteps.forEach((step, index) => {
        const stepData = typeof step === 'string' ? JSON.parse(step) : step;
        console.log(`\n  Step ${stepData.step}: ${stepData.action}`);
        console.log(`    Status: ${stepData.status}`);
        console.log(`    Duration: ${stepData.duration}ms`);
        console.log(`    Timestamp: ${stepData.timestamp}`);
        if (stepData.result) {
          console.log(`    Result: ${stepData.result}`);
        }
        if (stepData.error) {
          console.log(`    Error: ${stepData.error.message}`);
          if (stepData.error.suggestion) {
            console.log(`    Suggestion: ${stepData.error.suggestion}`);
          }
        }
      });
    }

    // Verify thought step structure
    console.log('\n\nVerification:');
    console.log('─────────────────────────────────────────────────────────');

    let allValid = true;

    if (!terrainResult.thoughtSteps || terrainResult.thoughtSteps.length === 0) {
      console.log('❌ No thought steps returned');
      allValid = false;
    } else {
      terrainResult.thoughtSteps.forEach((step, index) => {
        const stepData = typeof step === 'string' ? JSON.parse(step) : step;
        
        // Check required fields
        const requiredFields = ['step', 'action', 'reasoning', 'status', 'timestamp'];
        const missingFields = requiredFields.filter(field => !stepData[field]);
        
        if (missingFields.length > 0) {
          console.log(`❌ Step ${index + 1} missing fields: ${missingFields.join(', ')}`);
          allValid = false;
        } else {
          console.log(`✅ Step ${index + 1} has all required fields`);
        }

        // Check status values
        if (!['in_progress', 'complete', 'error'].includes(stepData.status)) {
          console.log(`❌ Step ${index + 1} has invalid status: ${stepData.status}`);
          allValid = false;
        }

        // Check duration for completed/error steps
        if ((stepData.status === 'complete' || stepData.status === 'error') && !stepData.duration) {
          console.log(`❌ Step ${index + 1} is ${stepData.status} but has no duration`);
          allValid = false;
        }
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    if (allValid) {
      console.log('✅ ALL TESTS PASSED');
      console.log('═══════════════════════════════════════════════════════════\n');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('═══════════════════════════════════════════════════════════\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testThoughtSteps();
