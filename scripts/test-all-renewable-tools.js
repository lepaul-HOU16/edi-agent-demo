#!/usr/bin/env node

/**
 * Test script to verify all renewable energy tools are wired up
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });

// Get orchestrator function name from environment or use default pattern
const ORCHESTRATOR_FUNCTION = process.env.ORCHESTRATOR_FUNCTION || 
  'amplify-digitalassistant--renewableOrchestratorlam-jBcrYHDFlPXd';

const testQueries = [
  {
    name: 'Terrain Analysis',
    query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
    expectedIntent: 'terrain_analysis'
  },
  {
    name: 'Layout Optimization',
    query: 'Create a 30MW wind farm layout with 15 turbines at 35.067482, -101.395466',
    expectedIntent: 'layout_optimization'
  },
  {
    name: 'Wake Simulation',
    query: 'Run wake simulation for project test-project-123',
    expectedIntent: 'wake_simulation',
    context: {
      projectId: 'test-project-123',
      layout: {
        features: [
          { geometry: { coordinates: [-101.395466, 35.067482] }, properties: { turbine_id: 'T001', capacity_MW: 2.5 } }
        ]
      }
    }
  },
  {
    name: 'Wind Rose',
    query: 'Create wind rose diagram showing wind direction patterns at 35.067482, -101.395466',
    expectedIntent: 'wind_rose'
  },
  {
    name: 'Report Generation',
    query: 'Generate comprehensive project report for test-project-123',
    expectedIntent: 'report_generation',
    context: {
      projectId: 'test-project-123'
    }
  }
];

async function testOrchestrator(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${testCase.name}`);
  console.log(`Query: "${testCase.query}"`);
  console.log(`Expected Intent: ${testCase.expectedIntent}`);
  console.log('='.repeat(80));

  const payload = {
    query: testCase.query,
    userId: 'test-user',
    sessionId: 'test-session',
    context: testCase.context || {
      projectId: 'test-project-123'
    }
  };

  try {
    const command = new InvokeCommand({
      FunctionName: ORCHESTRATOR_FUNCTION,
      Payload: JSON.stringify(payload)
    });

    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());

    console.log('\n✅ Response received:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Tools Used: ${result.metadata?.toolsUsed?.join(', ') || 'none'}`);
    console.log(`   Artifacts: ${result.artifacts?.length || 0}`);
    
    if (result.metadata?.timings) {
      console.log(`   Execution Time: ${result.metadata.timings.total}ms`);
    }

    // Check if correct tool was invoked
    const toolsUsed = result.metadata?.toolsUsed || [];
    const correctToolInvoked = toolsUsed.some(tool => 
      tool.includes(testCase.expectedIntent) || 
      (testCase.expectedIntent === 'wind_rose' && tool.includes('simulation'))
    );

    if (correctToolInvoked) {
      console.log(`\n✅ PASS: Correct tool invoked`);
    } else {
      console.log(`\n❌ FAIL: Expected ${testCase.expectedIntent}, got ${toolsUsed.join(', ')}`);
    }

    return { success: true, result };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 Testing All Renewable Energy Tools');
  console.log(`Orchestrator Function: ${ORCHESTRATOR_FUNCTION}\n`);

  const results = [];

  for (const testCase of testQueries) {
    const result = await testOrchestrator(testCase);
    results.push({ testCase, result });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.result.success).length;
  const failed = results.filter(r => !r.result.success).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  results.forEach(({ testCase, result }) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testCase.name}`);
  });

  console.log('\n');
}

runAllTests().catch(console.error);
