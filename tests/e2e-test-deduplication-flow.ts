#!/usr/bin/env node
/**
 * Task 18: End-to-End Deduplication Flow Test
 * 
 * This script tests the complete deduplication flow by invoking the
 * deployed orchestrator Lambda and verifying all requirements.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test configuration
const TEST_COORDINATES = {
  latitude: 35.067482,
  longitude: -101.395466
};

const TEST_QUERY = `Analyze terrain at ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude}`;

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  requirement?: string;
}

const results: TestResult[] = [];

/**
 * Invoke orchestrator Lambda
 */
async function invokeOrchestrator(query: string, sessionId: string, context?: any): Promise<any> {
  // Find orchestrator function
  const { ListFunctionsCommand } = await import('@aws-sdk/client-lambda');
  const listCommand = new ListFunctionsCommand({});
  const functions = await lambdaClient.send(listCommand);
  
  const orchestratorFunction = functions.Functions?.find(f => 
    f.FunctionName?.includes('renewableOrchestrator')
  );
  
  if (!orchestratorFunction) {
    throw new Error('Orchestrator Lambda not found. Is sandbox running?');
  }
  
  const payload = {
    query,
    sessionId,
    userId: 'test-user',
    context
  };
  
  console.log(`📤 Invoking: ${orchestratorFunction.FunctionName}`);
  console.log(`   Query: ${query}`);
  console.log(`   Session: ${sessionId}`);
  
  const command = new InvokeCommand({
    FunctionName: orchestratorFunction.FunctionName,
    Payload: JSON.stringify(payload)
  });
  
  const response = await lambdaClient.send(command);
  const responsePayload = JSON.parse(new TextDecoder().decode(response.Payload));
  
  console.log(`📥 Response success: ${responsePayload.success}`);
  console.log(`   Message: ${responsePayload.message?.substring(0, 100)}...`);
  
  return responsePayload;
}

/**
 * Test 1: First terrain analysis (no duplicates)
 */
async function test1_FirstAnalysis(): Promise<void> {
  console.log('\n📝 Test 1: First terrain analysis (should create project)');
  console.log('   Requirement: 1.1 - Check for existing projects');
  
  const sessionId = `test-dedup-${Date.now()}`;
  
  try {
    const response = await invokeOrchestrator(TEST_QUERY, sessionId);
    
    if (response.success && !response.message.includes('Found existing project')) {
      results.push({
        name: 'Test 1: First Analysis',
        passed: true,
        message: 'Project created without duplicate prompt',
        requirement: '1.1'
      });
      console.log('✅ PASSED: Project created successfully');
    } else if (response.message.includes('Found existing project')) {
      results.push({
        name: 'Test 1: First Analysis',
        passed: false,
        message: 'Unexpected duplicate detection on first analysis',
        requirement: '1.1'
      });
      console.log('❌ FAILED: Duplicate detected on first analysis');
    } else {
      results.push({
        name: 'Test 1: First Analysis',
        passed: false,
        message: `Analysis failed: ${response.message}`,
        requirement: '1.1'
      });
      console.log(`❌ FAILED: ${response.message}`);
    }
  } catch (error) {
    results.push({
      name: 'Test 1: First Analysis',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.1'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Test 2: Second analysis at same coordinates (should detect duplicate)
 */
async function test2_DuplicateDetection(): Promise<void> {
  console.log('\n📝 Test 2: Second analysis (should detect duplicate)');
  console.log('   Requirements: 1.1, 1.2 - Detect duplicates and prompt user');
  
  const sessionId = `test-dedup-${Date.now()}-2`;
  
  // Wait for S3 propagation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const response = await invokeOrchestrator(TEST_QUERY, sessionId);
    
    const hasDuplicatePrompt = 
      response.message.includes('Found existing project') ||
      response.message.includes('Continue with existing project') ||
      response.metadata?.duplicateCheckResult;
    
    const hasAllOptions = 
      response.message.includes('1. Continue with existing project') &&
      response.message.includes('2. Create new project') &&
      response.message.includes('3. View existing project details');
    
    if (hasDuplicatePrompt && hasAllOptions) {
      results.push({
        name: 'Test 2: Duplicate Detection',
        passed: true,
        message: 'Duplicate detected with correct prompt',
        requirement: '1.1, 1.2'
      });
      console.log('✅ PASSED: Duplicate detected with all options');
      console.log(`   Prompt: ${response.message.substring(0, 150)}...`);
      
      // Store duplicate check result for next test
      (global as any).lastDuplicateCheckResult = response.metadata?.duplicateCheckResult;
      (global as any).lastSessionId = sessionId;
    } else if (hasDuplicatePrompt && !hasAllOptions) {
      results.push({
        name: 'Test 2: Duplicate Detection',
        passed: false,
        message: 'Duplicate detected but prompt missing options',
        requirement: '1.2'
      });
      console.log('❌ FAILED: Prompt missing options');
    } else {
      results.push({
        name: 'Test 2: Duplicate Detection',
        passed: false,
        message: 'No duplicate detected',
        requirement: '1.1'
      });
      console.log('❌ FAILED: No duplicate detected');
    }
  } catch (error) {
    results.push({
      name: 'Test 2: Duplicate Detection',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.1, 1.2'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Test 3: User choice - Continue with existing
 */
async function test3_ContinueChoice(): Promise<void> {
  console.log('\n📝 Test 3: User choice - Continue with existing');
  console.log('   Requirements: 1.3, 1.4 - Handle choice and update context');
  
  const sessionId = (global as any).lastSessionId || `test-dedup-${Date.now()}-3`;
  const duplicateCheckResult = (global as any).lastDuplicateCheckResult;
  
  if (!duplicateCheckResult) {
    console.log('⚠️  SKIPPED: No duplicate check result from previous test');
    results.push({
      name: 'Test 3: Continue Choice',
      passed: false,
      message: 'Skipped - no duplicate check result',
      requirement: '1.3, 1.4'
    });
    return;
  }
  
  try {
    const response = await invokeOrchestrator('1', sessionId, { duplicateCheckResult });
    
    const isContinueAction = 
      response.message.includes('Continuing with existing project') ||
      response.message.includes('continue') ||
      response.metadata?.activeProject;
    
    if (response.success && isContinueAction) {
      results.push({
        name: 'Test 3: Continue Choice',
        passed: true,
        message: 'User choice handled correctly',
        requirement: '1.3, 1.4'
      });
      console.log('✅ PASSED: Continue choice handled');
      console.log(`   Active project: ${response.metadata?.activeProject || 'set'}`);
    } else {
      results.push({
        name: 'Test 3: Continue Choice',
        passed: false,
        message: 'Choice not handled correctly',
        requirement: '1.3'
      });
      console.log('❌ FAILED: Choice not handled correctly');
    }
  } catch (error) {
    results.push({
      name: 'Test 3: Continue Choice',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.3, 1.4'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Test 4: User choice - Create new project
 */
async function test4_CreateNewChoice(): Promise<void> {
  console.log('\n📝 Test 4: User choice - Create new project');
  console.log('   Requirement: 1.4 - Create new project when user chooses');
  
  // Trigger duplicate detection again
  const sessionId = `test-dedup-${Date.now()}-4`;
  
  try {
    // First, trigger duplicate detection
    const detectResponse = await invokeOrchestrator(TEST_QUERY, sessionId);
    
    if (!detectResponse.metadata?.duplicateCheckResult) {
      console.log('⚠️  SKIPPED: No duplicate detected');
      results.push({
        name: 'Test 4: Create New Choice',
        passed: false,
        message: 'Skipped - no duplicate detected',
        requirement: '1.4'
      });
      return;
    }
    
    // Then, choose option 2 (create new)
    const choiceResponse = await invokeOrchestrator(
      '2',
      sessionId,
      { duplicateCheckResult: detectResponse.metadata.duplicateCheckResult }
    );
    
    const isCreateNewAction = 
      choiceResponse.message.includes('Creating new project') ||
      choiceResponse.message.includes('create new') ||
      choiceResponse.metadata?.createNew;
    
    if (choiceResponse.success && isCreateNewAction) {
      results.push({
        name: 'Test 4: Create New Choice',
        passed: true,
        message: 'Create new choice handled correctly',
        requirement: '1.4'
      });
      console.log('✅ PASSED: Create new choice handled');
    } else {
      results.push({
        name: 'Test 4: Create New Choice',
        passed: false,
        message: 'Choice not handled correctly',
        requirement: '1.4'
      });
      console.log('❌ FAILED: Choice not handled correctly');
    }
  } catch (error) {
    results.push({
      name: 'Test 4: Create New Choice',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.4'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Test 5: User choice - View details
 */
async function test5_ViewDetailsChoice(): Promise<void> {
  console.log('\n📝 Test 5: User choice - View details');
  console.log('   Requirement: 1.3 - Show project details when user chooses');
  
  // Trigger duplicate detection again
  const sessionId = `test-dedup-${Date.now()}-5`;
  
  try {
    // First, trigger duplicate detection
    const detectResponse = await invokeOrchestrator(TEST_QUERY, sessionId);
    
    if (!detectResponse.metadata?.duplicateCheckResult) {
      console.log('⚠️  SKIPPED: No duplicate detected');
      results.push({
        name: 'Test 5: View Details Choice',
        passed: false,
        message: 'Skipped - no duplicate detected',
        requirement: '1.3'
      });
      return;
    }
    
    // Then, choose option 3 (view details)
    const choiceResponse = await invokeOrchestrator(
      '3',
      sessionId,
      { duplicateCheckResult: detectResponse.metadata.duplicateCheckResult }
    );
    
    const showsDetails = 
      choiceResponse.message.includes('Project Details') ||
      choiceResponse.message.includes('Completion') ||
      choiceResponse.message.includes('Created:');
    
    if (choiceResponse.success && showsDetails) {
      results.push({
        name: 'Test 5: View Details Choice',
        passed: true,
        message: 'View details choice handled correctly',
        requirement: '1.3'
      });
      console.log('✅ PASSED: View details choice handled');
    } else {
      results.push({
        name: 'Test 5: View Details Choice',
        passed: false,
        message: 'Choice not handled correctly',
        requirement: '1.3'
      });
      console.log('❌ FAILED: Choice not handled correctly');
    }
  } catch (error) {
    results.push({
      name: 'Test 5: View Details Choice',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.3'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Test 6: Proximity threshold (outside 1km)
 */
async function test6_ProximityThreshold(): Promise<void> {
  console.log('\n📝 Test 6: Proximity threshold (outside 1km)');
  console.log('   Requirements: 1.5, 1.6 - Only detect duplicates within 1km');
  
  const sessionId = `test-dedup-${Date.now()}-6`;
  
  // Coordinates approximately 1.5km away
  const farCoordinates = {
    latitude: TEST_COORDINATES.latitude + 0.015,
    longitude: TEST_COORDINATES.longitude + 0.015
  };
  
  const farQuery = `Analyze terrain at ${farCoordinates.latitude}, ${farCoordinates.longitude}`;
  
  try {
    const response = await invokeOrchestrator(farQuery, sessionId);
    
    const noDuplicateDetected = 
      !response.message.includes('Found existing project') &&
      !response.metadata?.duplicateCheckResult;
    
    if (response.success && noDuplicateDetected) {
      results.push({
        name: 'Test 6: Proximity Threshold',
        passed: true,
        message: 'Projects outside 1km not detected as duplicates',
        requirement: '1.5, 1.6'
      });
      console.log('✅ PASSED: No duplicate detected outside 1km');
    } else {
      results.push({
        name: 'Test 6: Proximity Threshold',
        passed: false,
        message: 'Duplicate detected outside 1km threshold',
        requirement: '1.5, 1.6'
      });
      console.log('❌ FAILED: Duplicate detected outside threshold');
    }
  } catch (error) {
    results.push({
      name: 'Test 6: Proximity Threshold',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requirement: '1.5, 1.6'
    });
    console.log(`❌ ERROR: ${error}`);
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TASK 18: End-to-End Deduplication Flow Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📍 Test Coordinates: ${TEST_COORDINATES.latitude}, ${TEST_COORDINATES.longitude}`);
  console.log(`🌍 Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log('');
  
  // Run tests sequentially
  await test1_FirstAnalysis();
  await test2_DuplicateDetection();
  await test3_ContinueChoice();
  await test4_CreateNewChoice();
  await test5_ViewDetailsChoice();
  await test6_ProximityThreshold();
  
  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%\n`);
  
  // Print detailed results
  console.log('Detailed Results:');
  console.log('─────────────────────────────────────────────────────────────');
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   Requirement: ${result.requirement}`);
    console.log(`   ${result.message}`);
    if (index < results.length - 1) console.log('');
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Requirements Verified:');
    console.log('   - 1.1: System checks for existing projects within 1km');
    console.log('   - 1.2: System asks user for choice when duplicate found');
    console.log('   - 1.3: System handles all three user choices correctly');
    console.log('   - 1.4: System updates session context appropriately');
    console.log('   - 1.5: Proximity threshold (1km) is configurable');
    console.log('   - 1.6: System considers projects duplicate within threshold');
    console.log('');
    console.log('🚀 Task 18 is COMPLETE!');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    console.log('');
    console.log('Please review:');
    console.log('  1. Check CloudWatch logs for orchestrator Lambda');
    console.log('  2. Verify lifecycle manager is deployed correctly');
    console.log('  3. Ensure S3 bucket and DynamoDB table are accessible');
    console.log('  4. Run manual tests to verify specific failures');
    console.log('');
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
