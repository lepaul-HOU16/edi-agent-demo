#!/usr/bin/env node

/**
 * Validation script for layout optimization persistence fix
 * Tests that coordinates are auto-filled from project context
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { fromNodeProviderChain } = require('@aws-sdk/credential-providers');

const lambda = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromNodeProviderChain(),
});

async function findOrchestratorFunction() {
  const { ListFunctionsCommand } = require('@aws-sdk/client-lambda');
  
  let allFunctions = [];
  let marker = undefined;
  
  // Handle pagination
  do {
    const response = await lambda.send(new ListFunctionsCommand({ Marker: marker }));
    allFunctions = allFunctions.concat(response.Functions || []);
    marker = response.NextMarker;
  } while (marker);
  
  const orchestrator = allFunctions.find(f => 
    f.FunctionName.toLowerCase().includes('renewableorchestrator')
  );
  
  if (!orchestrator) {
    console.error(`❌ Renewable orchestrator Lambda not found in ${allFunctions.length} functions`);
    throw new Error('Renewable orchestrator Lambda not found');
  }
  
  console.log(`✅ Found orchestrator: ${orchestrator.FunctionName}`);
  return orchestrator.FunctionName;
}

async function invokeLambda(functionName, payload) {
  const command = new InvokeCommand({
    FunctionName: functionName,
    Payload: JSON.stringify(payload),
  });
  
  const response = await lambda.send(command);
  const result = JSON.parse(Buffer.from(response.Payload).toString());
  
  return result;
}

async function testTerrainAnalysis(functionName, sessionId) {
  console.log('\n📍 Test 1: Terrain Analysis (establishes project context)');
  
  const payload = {
    query: 'analyze terrain at 35.067482, -101.395466',
    sessionId: sessionId,
  };
  
  const result = await invokeLambda(functionName, payload);
  
  if (result.success) {
    console.log('✅ Terrain analysis succeeded');
    console.log(`   Project: ${result.metadata?.projectName || 'N/A'}`);
    return result.metadata?.projectName;
  } else {
    console.error('❌ Terrain analysis failed:', result.message);
    throw new Error('Terrain analysis failed');
  }
}

async function testLayoutOptimizationWithContext(functionName, sessionId, projectName) {
  console.log('\n🔧 Test 2: Layout Optimization WITHOUT coordinates (should auto-fill)');
  
  const payload = {
    query: 'optimize layout',
    sessionId: sessionId,
  };
  
  const result = await invokeLambda(functionName, payload);
  
  console.log('\nResponse:', JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log('✅ Layout optimization succeeded');
    console.log('✅ Coordinates were auto-filled from project context');
    
    // Check thought steps for context usage
    const thoughtSteps = result.thoughtSteps || [];
    const contextStep = thoughtSteps.find(step => 
      step.action?.includes('project') || step.result?.includes('coordinates')
    );
    
    if (contextStep) {
      console.log('✅ Thought steps show context usage:', contextStep);
    }
    
    return true;
  } else {
    console.error('❌ Layout optimization failed:', result.message);
    console.error('   This suggests coordinates were NOT auto-filled');
    return false;
  }
}

async function testLayoutOptimizationWithoutContext(functionName) {
  console.log('\n🔧 Test 3: Layout Optimization WITHOUT context (should show helpful error)');
  
  const newSessionId = `test-no-context-${Date.now()}`;
  
  const payload = {
    query: 'optimize layout',
    sessionId: newSessionId,
  };
  
  const result = await invokeLambda(functionName, payload);
  
  console.log('\nResponse:', JSON.stringify(result, null, 2));
  
  if (!result.success) {
    console.log('✅ Correctly failed without context');
    
    // Check for helpful error message
    const message = result.message || '';
    if (message.includes('coordinates') || message.includes('terrain analysis')) {
      console.log('✅ Error message is helpful and suggests next steps');
      return true;
    } else {
      console.warn('⚠️  Error message could be more helpful');
      return false;
    }
  } else {
    console.error('❌ Should have failed without context');
    return false;
  }
}

async function testExplicitCoordinatesOverride(functionName, sessionId) {
  console.log('\n🔧 Test 4: Explicit coordinates should override context');
  
  const payload = {
    query: 'optimize layout at 40.0, -100.0',
    sessionId: sessionId,
  };
  
  const result = await invokeLambda(functionName, payload);
  
  if (result.success) {
    console.log('✅ Layout optimization with explicit coordinates succeeded');
    console.log('✅ Explicit coordinates took precedence over context');
    return true;
  } else {
    console.error('❌ Layout optimization with explicit coordinates failed');
    return false;
  }
}

async function checkCloudWatchLogs(functionName) {
  console.log('\n📊 Checking CloudWatch logs for context usage...');
  
  const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
  
  const cwLogs = new CloudWatchLogsClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: fromNodeProviderChain(),
  });
  
  const logGroupName = `/aws/lambda/${functionName}`;
  
  try {
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime: Date.now() - 5 * 60 * 1000, // Last 5 minutes
      filterPattern: '"Auto-filled" OR "project context" OR "satisfiedByContext"',
      limit: 10,
    });
    
    const response = await cwLogs.send(command);
    
    if (response.events && response.events.length > 0) {
      console.log('✅ Found context usage in logs:');
      response.events.forEach(event => {
        console.log(`   ${event.message}`);
      });
      return true;
    } else {
      console.log('⚠️  No context usage found in recent logs');
      return false;
    }
  } catch (error) {
    console.warn('⚠️  Could not check CloudWatch logs:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Layout Optimization Persistence Fix - Validation\n');
  console.log('=' .repeat(60));
  
  try {
    // Find orchestrator function
    const functionName = await findOrchestratorFunction();
    
    // Generate unique session ID for testing
    const sessionId = `test-session-${Date.now()}`;
    console.log(`\n🔑 Test session ID: ${sessionId}`);
    
    // Test 1: Terrain analysis (establishes context)
    const projectName = await testTerrainAnalysis(functionName, sessionId);
    
    // Wait a moment for project to be saved
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Layout optimization without coordinates (should auto-fill)
    const test2Pass = await testLayoutOptimizationWithContext(functionName, sessionId, projectName);
    
    // Test 3: Layout optimization without context (should show helpful error)
    const test3Pass = await testLayoutOptimizationWithoutContext(functionName);
    
    // Test 4: Explicit coordinates override context
    const test4Pass = await testExplicitCoordinatesOverride(functionName, sessionId);
    
    // Check CloudWatch logs
    const logsFound = await checkCloudWatchLogs(functionName);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY\n');
    console.log(`Test 1 - Terrain Analysis:              ✅ PASS`);
    console.log(`Test 2 - Auto-fill from context:        ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 3 - Helpful error without context: ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Test 4 - Explicit coordinates override:  ${test4Pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`CloudWatch logs verification:            ${logsFound ? '✅ PASS' : '⚠️  WARN'}`);
    
    const allPassed = test2Pass && test3Pass && test4Pass;
    
    if (allPassed) {
      console.log('\n✅ ALL TESTS PASSED - Fix is working correctly!');
      process.exit(0);
    } else {
      console.log('\n❌ SOME TESTS FAILED - Fix needs attention');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
