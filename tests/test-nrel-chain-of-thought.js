/**
 * Test NREL Chain of Thought Integration
 * 
 * Verifies that the orchestrator exposes sub-agent reasoning steps
 * for NREL Wind Toolkit API calls and data processing.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testNRELChainOfThought() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING NREL CHAIN OF THOUGHT INTEGRATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  const testCases = [
    {
      name: 'Wind Rose Analysis',
      query: 'Generate wind rose for coordinates 35.067482, -101.395466',
      expectedThoughtSteps: [
        'Fetching wind data from NREL Wind Toolkit API',
        'Processing wind data with Weibull distribution fitting',
        'Sub-agent: Parameter validation',
        'Sub-agent: Data source selection'
      ]
    },
    {
      name: 'Terrain Analysis with Wind Data',
      query: 'Analyze terrain at 35.067482, -101.395466 with 5km radius',
      expectedThoughtSteps: [
        'Fetching wind data from NREL Wind Toolkit API',
        'Processing wind data with Weibull distribution fitting',
        'Sub-agent: Parameter validation',
        'Sub-agent: Data source selection'
      ]
    },
    {
      name: 'Wake Simulation',
      query: 'Run wake simulation for project test-project',
      expectedThoughtSteps: [
        'Fetching wind data from NREL Wind Toolkit API',
        'Processing wind data with Weibull distribution fitting',
        'Sub-agent: Parameter validation',
        'Sub-agent: Data source selection'
      ]
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log('───────────────────────────────────────────────────────────');

    try {
      // Get orchestrator function name
      const orchestratorFunctionName = process.env.RENEWABLE_ORCHESTRATOR_FUNCTION_NAME;
      
      if (!orchestratorFunctionName) {
        console.error('❌ RENEWABLE_ORCHESTRATOR_FUNCTION_NAME not set');
        console.log('   Set environment variable or run: npx ampx sandbox\n');
        failedTests++;
        continue;
      }

      // Invoke orchestrator
      const payload = {
        query: testCase.query,
        context: {}
      };

      console.log(`🔧 Invoking: ${orchestratorFunctionName}`);
      
      const command = new InvokeCommand({
        FunctionName: orchestratorFunctionName,
        Payload: JSON.stringify(payload)
      });

      const response = await lambdaClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Payload));

      // Parse response body if it's a Lambda proxy response
      const orchestratorResponse = result.body ? JSON.parse(result.body) : result;

      console.log(`\n✅ Response received`);
      console.log(`   Success: ${orchestratorResponse.success}`);
      console.log(`   Thought Steps: ${orchestratorResponse.thoughtSteps?.length || 0}`);

      // Verify thought steps exist
      if (!orchestratorResponse.thoughtSteps || orchestratorResponse.thoughtSteps.length === 0) {
        console.error('❌ FAILED: No thought steps in response');
        failedTests++;
        continue;
      }

      // Extract thought step actions
      const thoughtStepActions = orchestratorResponse.thoughtSteps.map(step => step.action);
      
      console.log('\n📊 Thought Steps Found:');
      orchestratorResponse.thoughtSteps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.action}`);
        console.log(`      Status: ${step.status}`);
        console.log(`      Reasoning: ${step.reasoning}`);
        if (step.result) {
          console.log(`      Result: ${step.result}`);
        }
        if (step.duration) {
          console.log(`      Duration: ${step.duration}ms`);
        }
      });

      // Verify expected thought steps are present
      let allExpectedFound = true;
      const missingSteps = [];

      for (const expectedStep of testCase.expectedThoughtSteps) {
        const found = thoughtStepActions.some(action => action.includes(expectedStep));
        if (!found) {
          allExpectedFound = false;
          missingSteps.push(expectedStep);
        }
      }

      if (allExpectedFound) {
        console.log('\n✅ PASSED: All expected thought steps found');
        
        // Verify NREL-specific details
        const nrelFetchStep = orchestratorResponse.thoughtSteps.find(step => 
          step.action.includes('NREL Wind Toolkit API')
        );
        
        if (nrelFetchStep) {
          console.log('\n📋 NREL Fetch Step Details:');
          console.log(`   Action: ${nrelFetchStep.action}`);
          console.log(`   Reasoning: ${nrelFetchStep.reasoning}`);
          console.log(`   Status: ${nrelFetchStep.status}`);
          console.log(`   Result: ${nrelFetchStep.result || 'N/A'}`);
          
          if (nrelFetchStep.result && nrelFetchStep.result.includes('NREL Wind Toolkit')) {
            console.log('   ✅ Contains data source information');
          }
          if (nrelFetchStep.result && nrelFetchStep.result.includes('2023')) {
            console.log('   ✅ Contains data year');
          }
          if (nrelFetchStep.result && /\d+\s+data points/.test(nrelFetchStep.result)) {
            console.log('   ✅ Contains data point count');
          }
        }
        
        // Verify Weibull processing step
        const weibullStep = orchestratorResponse.thoughtSteps.find(step => 
          step.action.includes('Weibull distribution fitting')
        );
        
        if (weibullStep) {
          console.log('\n📋 Weibull Processing Step Details:');
          console.log(`   Action: ${weibullStep.action}`);
          console.log(`   Reasoning: ${weibullStep.reasoning}`);
          console.log(`   Status: ${weibullStep.status}`);
          console.log(`   Result: ${weibullStep.result || 'N/A'}`);
          
          if (weibullStep.result && /mean wind speed/.test(weibullStep.result)) {
            console.log('   ✅ Contains mean wind speed');
          }
        }
        
        // Verify sub-agent reasoning steps
        const subAgentSteps = orchestratorResponse.thoughtSteps.filter(step => 
          step.action.includes('Sub-agent')
        );
        
        if (subAgentSteps.length > 0) {
          console.log('\n📋 Sub-Agent Reasoning Steps:');
          subAgentSteps.forEach(step => {
            console.log(`   - ${step.action}`);
            console.log(`     Reasoning: ${step.reasoning}`);
            console.log(`     Result: ${step.result || 'N/A'}`);
          });
          console.log(`   ✅ Found ${subAgentSteps.length} sub-agent reasoning step(s)`);
        }
        
        passedTests++;
      } else {
        console.error('\n❌ FAILED: Missing expected thought steps:');
        missingSteps.forEach(step => console.error(`   - ${step}`));
        failedTests++;
      }

    } catch (error) {
      console.error(`\n❌ FAILED: ${error.message}`);
      console.error(`   ${error.stack}`);
      failedTests++;
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Passed: ${passedTests}/${testCases.length}`);
  console.log(`❌ Failed: ${failedTests}/${testCases.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    console.error('❌ Some tests failed. Review the output above for details.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
testNRELChainOfThought().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
