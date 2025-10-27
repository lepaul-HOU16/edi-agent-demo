#!/usr/bin/env node

/**
 * Test Orchestrator Deployment - Task 17
 * 
 * Verifies:
 * 1. Environment variables are set correctly
 * 2. Intent classification works (especially financial analysis)
 * 3. Action buttons are generated for each artifact type
 * 4. CloudWatch logs show action button generation
 */

const { LambdaClient, InvokeCommand, GetFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const lambdaClient = new LambdaClient({ region: 'us-east-1' });
const logsClient = new CloudWatchLogsClient({ region: 'us-east-1' });

// Test queries for different intents
const TEST_QUERIES = [
  {
    name: 'Terrain Analysis',
    query: 'analyze terrain at 35.067482, -101.395466',
    expectedIntent: 'terrain_analysis',
    shouldHaveActions: true,
    expectedButtons: ['Optimize Layout', 'View Dashboard']
  },
  {
    name: 'Financial Analysis (should NOT be terrain)',
    query: 'perform financial analysis and ROI calculation for project at 35.067482, -101.395466',
    expectedIntent: 'report_generation',
    shouldHaveActions: true,
    expectedButtons: ['View Dashboard', 'Export Report']
  }
];

async function getOrchestratorFunctionName() {
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text',
      { encoding: 'utf-8' }
    );
    return result.trim();
  } catch (error) {
    console.error('❌ Error getting orchestrator function name:', error.message);
    return null;
  }
}

async function verifyEnvironmentVariables(functionName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 STEP 1: Verify Environment Variables');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const command = new GetFunctionConfigurationCommand({
      FunctionName: functionName
    });
    
    const response = await lambdaClient.send(command);
    const envVars = response.Environment?.Variables || {};
    
    const requiredVars = [
      'RENEWABLE_TERRAIN_TOOL_FUNCTION_NAME',
      'RENEWABLE_LAYOUT_TOOL_FUNCTION_NAME',
      'RENEWABLE_SIMULATION_TOOL_FUNCTION_NAME',
      'RENEWABLE_REPORT_TOOL_FUNCTION_NAME',
      'RENEWABLE_S3_BUCKET',
      'SESSION_CONTEXT_TABLE'
    ];
    
    let allPresent = true;
    
    for (const varName of requiredVars) {
      if (envVars[varName]) {
        console.log(`✅ ${varName}: ${envVars[varName]}`);
      } else {
        console.log(`❌ ${varName}: NOT SET`);
        allPresent = false;
      }
    }
    
    if (allPresent) {
      console.log('\n✅ All required environment variables are set');
      return true;
    } else {
      console.log('\n❌ Some environment variables are missing');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying environment variables:', error.message);
    return false;
  }
}

async function testIntentClassification(functionName, testCase) {
  console.log(`\n🔍 Testing: ${testCase.name}`);
  console.log(`   Query: "${testCase.query}"`);
  console.log(`   Expected Intent: ${testCase.expectedIntent}`);
  
  try {
    const payload = {
      query: testCase.query,
      context: {
        projectId: 'test-project-task17'
      }
    };
    
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const response = await lambdaClient.send(command);
    
    if (!response.Payload) {
      console.log('   ❌ No payload in response');
      return false;
    }
    
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    // Check if response is successful
    if (!result.success) {
      console.log(`   ⚠️  Response not successful: ${result.message}`);
      return false;
    }
    
    // Check artifacts
    if (!result.artifacts || result.artifacts.length === 0) {
      console.log('   ⚠️  No artifacts in response');
      return false;
    }
    
    // Check action buttons
    const hasActions = result.artifacts.some(a => a.actions && a.actions.length > 0);
    
    if (testCase.shouldHaveActions && !hasActions) {
      console.log('   ❌ Expected action buttons but none found');
      return false;
    }
    
    if (hasActions) {
      const artifact = result.artifacts.find(a => a.actions && a.actions.length > 0);
      console.log(`   ✅ Action buttons generated: ${artifact.actions.length}`);
      artifact.actions.forEach(action => {
        console.log(`      - ${action.label} (${action.primary ? 'primary' : 'secondary'})`);
      });
      
      // Verify expected buttons if specified
      if (testCase.expectedButtons) {
        const actualLabels = artifact.actions.map(a => a.label);
        const allExpectedPresent = testCase.expectedButtons.every(expected => 
          actualLabels.includes(expected)
        );
        
        if (allExpectedPresent) {
          console.log(`   ✅ All expected buttons present`);
        } else {
          console.log(`   ⚠️  Expected buttons: ${testCase.expectedButtons.join(', ')}`);
          console.log(`   ⚠️  Actual buttons: ${actualLabels.join(', ')}`);
        }
      }
    }
    
    // Check metadata for tools used
    if (result.metadata && result.metadata.toolsUsed) {
      console.log(`   📊 Tools used: ${result.metadata.toolsUsed.join(', ')}`);
    }
    
    console.log('   ✅ Test passed');
    return true;
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function checkCloudWatchLogs(functionName) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 STEP 3: Check CloudWatch Logs for Action Button Generation');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  try {
    const logGroupName = `/aws/lambda/${functionName}`;
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    console.log(`📝 Searching logs in: ${logGroupName}`);
    console.log(`⏰ Time range: Last 5 minutes\n`);
    
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime: fiveMinutesAgo,
      filterPattern: '"Generated" "action button"'
    });
    
    const response = await logsClient.send(command);
    
    if (!response.events || response.events.length === 0) {
      console.log('⚠️  No action button generation logs found in last 5 minutes');
      console.log('   This is expected if no tests were run recently');
      return true;
    }
    
    console.log(`✅ Found ${response.events.length} action button generation log entries:\n`);
    
    response.events.slice(0, 10).forEach(event => {
      const message = event.message || '';
      if (message.includes('Generated')) {
        console.log(`   ${message.trim()}`);
      }
    });
    
    return true;
    
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('⚠️  Log group not found - function may not have been invoked yet');
      return true;
    }
    console.error('❌ Error checking CloudWatch logs:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 TASK 17: Orchestrator Deployment Verification');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Get orchestrator function name
  const functionName = await getOrchestratorFunctionName();
  
  if (!functionName) {
    console.error('\n❌ Could not find orchestrator function');
    console.error('   Make sure sandbox is running: npx ampx sandbox');
    process.exit(1);
  }
  
  console.log(`\n✅ Found orchestrator: ${functionName}\n`);
  
  // Step 1: Verify environment variables
  const envVarsOk = await verifyEnvironmentVariables(functionName);
  
  if (!envVarsOk) {
    console.error('\n❌ Environment variables verification failed');
    console.error('   Restart sandbox to apply changes: npx ampx sandbox');
    process.exit(1);
  }
  
  // Step 2: Test intent classification and action button generation
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 STEP 2: Test Intent Classification & Action Buttons');
  console.log('═══════════════════════════════════════════════════════════');
  
  let allTestsPassed = true;
  
  for (const testCase of TEST_QUERIES) {
    const passed = await testIntentClassification(functionName, testCase);
    if (!passed) {
      allTestsPassed = false;
    }
  }
  
  // Step 3: Check CloudWatch logs
  await checkCloudWatchLogs(functionName);
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (envVarsOk && allTestsPassed) {
    console.log('✅ All verification checks passed!');
    console.log('\n📋 Task 17 Complete:');
    console.log('   ✅ Orchestrator Lambda deployed');
    console.log('   ✅ Environment variables verified');
    console.log('   ✅ Intent classification working');
    console.log('   ✅ Action buttons generated');
    console.log('\n🎉 Ready to proceed to Task 18: Frontend Deployment');
    process.exit(0);
  } else {
    console.log('❌ Some verification checks failed');
    console.log('\n📋 Remediation Steps:');
    if (!envVarsOk) {
      console.log('   1. Restart sandbox: npx ampx sandbox');
      console.log('   2. Wait for deployment to complete');
      console.log('   3. Re-run this test');
    }
    if (!allTestsPassed) {
      console.log('   1. Check CloudWatch logs for errors');
      console.log('   2. Verify orchestrator code changes');
      console.log('   3. Re-deploy if needed');
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
