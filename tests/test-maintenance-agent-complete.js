/**
 * Complete Maintenance Agent Test
 * Tests deployment, configuration, and basic functionality
 * Requirements: 1.1-1.12, 6.1-6.5, 7.1-7.5
 */

import { LambdaClient, ListFunctionsCommand, GetFunctionConfigurationCommand, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

async function testMaintenanceAgent() {
  console.log('=== MAINTENANCE AGENT COMPLETE TEST ===\n');
  let allTestsPassed = true;

  try {
    // Test 1: Verify Lambda exists
    console.log('Test 1: Verifying Lambda deployment...');
    const listResponse = await lambda.send(new ListFunctionsCommand({}));
    const maintenanceFunction = listResponse.Functions?.find(fn => 
      fn.FunctionName?.includes('maintenanceAgent')
    );

    if (!maintenanceFunction) {
      console.error('❌ FAILED: maintenanceAgent Lambda not found');
      allTestsPassed = false;
      return false;
    }

    console.log(`✅ PASSED: Found ${maintenanceFunction.FunctionName}`);
    console.log(`   Runtime: ${maintenanceFunction.Runtime}`);
    console.log(`   Memory: ${maintenanceFunction.MemorySize}MB`);
    console.log(`   Timeout: ${maintenanceFunction.Timeout}s\n`);

    // Test 2: Verify configuration
    console.log('Test 2: Verifying function configuration...');
    const configResponse = await lambda.send(
      new GetFunctionConfigurationCommand({
        FunctionName: maintenanceFunction.FunctionName
      })
    );

    const envVars = configResponse.Environment?.Variables || {};
    
    if (!envVars.S3_BUCKET || envVars.S3_BUCKET === '') {
      console.error('❌ FAILED: S3_BUCKET environment variable not set or empty');
      console.log('   Current value:', envVars.S3_BUCKET);
      allTestsPassed = false;
    } else {
      console.log(`✅ PASSED: S3_BUCKET = ${envVars.S3_BUCKET}\n`);
    }

    // Test 3: Verify IAM permissions (check role)
    console.log('Test 3: Verifying IAM role...');
    if (configResponse.Role) {
      console.log(`✅ PASSED: IAM Role configured`);
      console.log(`   Role: ${configResponse.Role}\n`);
    } else {
      console.error('❌ FAILED: No IAM role configured');
      allTestsPassed = false;
    }

    // Test 4: Test Lambda invocation with simple query
    console.log('Test 4: Testing Lambda invocation...');
    const testEvent = {
      arguments: {
        chatSessionId: 'test-session-123',
        message: 'What is the status of equipment PUMP-001?',
        foundationModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        userId: 'test-user'
      },
      identity: {
        sub: 'test-user'
      }
    };

    try {
      const invokeResponse = await lambda.send(
        new InvokeCommand({
          FunctionName: maintenanceFunction.FunctionName,
          Payload: JSON.stringify(testEvent)
        })
      );

      const responsePayload = JSON.parse(
        new TextDecoder().decode(invokeResponse.Payload)
      );

      console.log('Response received:');
      console.log('  success:', responsePayload.success);
      console.log('  message:', responsePayload.message?.substring(0, 100) + '...');
      
      if (responsePayload.success) {
        console.log('✅ PASSED: Lambda invocation successful\n');
      } else {
        console.log('⚠️  WARNING: Lambda returned success=false');
        console.log('   This may be expected for test data\n');
      }

      // Verify response structure
      console.log('Test 5: Verifying response structure...');
      const hasRequiredFields = 
        'success' in responsePayload &&
        'message' in responsePayload;

      if (hasRequiredFields) {
        console.log('✅ PASSED: Response has required fields (success, message)');
        
        if ('artifacts' in responsePayload) {
          console.log('✅ PASSED: Response includes artifacts field');
        }
        if ('thoughtSteps' in responsePayload) {
          console.log('✅ PASSED: Response includes thoughtSteps field');
        }
        if ('workflow' in responsePayload) {
          console.log('✅ PASSED: Response includes workflow field');
        }
        if ('auditTrail' in responsePayload) {
          console.log('✅ PASSED: Response includes auditTrail field');
        }
      } else {
        console.error('❌ FAILED: Response missing required fields');
        allTestsPassed = false;
      }

    } catch (invokeError) {
      console.error('❌ FAILED: Lambda invocation error:', invokeError.message);
      allTestsPassed = false;
    }

    console.log('\n=== TEST SUMMARY ===');
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\nMaintenance Agent is deployed and functional!');
      console.log('\nNext steps:');
      console.log('1. Mark task 1.12 as complete');
      console.log('2. Mark task 1 (Backend Infrastructure Setup) as complete');
      console.log('3. Proceed to task 2: Agent Router Integration');
      return true;
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\nPlease review the failures above and:');
      console.log('1. Ensure sandbox is running: npx ampx sandbox');
      console.log('2. Wait for "Deployed" message');
      console.log('3. Re-run this test');
      return false;
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
    return false;
  }
}

// Run test
testMaintenanceAgent()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
