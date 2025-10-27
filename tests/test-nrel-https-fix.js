#!/usr/bin/env node

/**
 * Test NREL HTTPS Fix
 * Verifies that simulation tool can now access NREL API with HTTPS
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-west-2' });

async function testNRELHTTPSFix() {
  console.log('🧪 Testing NREL HTTPS Fix...\n');

  try {
    // Get simulation Lambda function name
    const { execSync } = require('child_process');
    const functionName = execSync(
      `aws lambda list-functions --query "Functions[?contains(FunctionName, 'RenewableSimulationTool')].FunctionName" --output text`,
      { encoding: 'utf-8' }
    ).trim();

    if (!functionName) {
      console.error('❌ Simulation Lambda not found');
      process.exit(1);
    }

    console.log(`📍 Testing Lambda: ${functionName}\n`);

    // Test payload
    const payload = {
      latitude: 35.067482,
      longitude: -101.395466,
      project_name: 'NREL HTTPS Test',
      turbine_model: 'Vestas V90-2.0MW',
      num_turbines: 10,
      hub_height: 80
    };

    console.log('📤 Invoking simulation with test coordinates...');
    console.log(`   Location: ${payload.latitude}, ${payload.longitude}\n`);

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });

    const response = await lambda.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    console.log('📥 Response received:\n');

    if (result.errorMessage) {
      console.error('❌ Lambda Error:', result.errorMessage);
      
      // Check if it's still a 403 error
      if (result.errorMessage.includes('403')) {
        console.error('\n🔍 Still getting 403 Forbidden error');
        console.error('   This means the HTTPS fix may not be deployed yet');
        console.error('   OR the API key is invalid');
        process.exit(1);
      }
      
      process.exit(1);
    }

    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      
      console.log('✅ SUCCESS! Simulation completed');
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Has artifacts: ${body.artifacts ? 'Yes' : 'No'}`);
      
      if (body.artifacts && body.artifacts.length > 0) {
        console.log(`   Artifact count: ${body.artifacts.length}`);
        console.log(`   Artifact types: ${body.artifacts.map(a => a.type).join(', ')}`);
      }
      
      if (body.chain_of_thought) {
        console.log(`\n📊 Chain of Thought:`);
        body.chain_of_thought.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step.step}: ${step.status}`);
        });
      }
      
      console.log('\n✅ NREL HTTPS fix is working!');
      process.exit(0);
    } else {
      console.error(`❌ Unexpected status code: ${result.statusCode}`);
      console.error('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNRELHTTPSFix();
