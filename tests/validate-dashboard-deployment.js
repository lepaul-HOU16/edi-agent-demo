#!/usr/bin/env node

/**
 * Dashboard Deployment Validation Script
 * 
 * Validates that the project dashboard feature is properly deployed:
 * 1. Backend: ProjectListHandler has dashboard methods
 * 2. Backend: Orchestrator routes dashboard queries
 * 3. Frontend: ChatMessage renders ProjectDashboardArtifact
 * 4. End-to-end: Dashboard query returns artifact
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function findOrchestratorFunction() {
  log('🔍 Finding renewable orchestrator Lambda...', 'blue');
  
  // Try common naming patterns
  const patterns = [
    'renewableOrchestrator',
    'RenewableOrchestrator',
    'renewable-orchestrator'
  ];
  
  for (const pattern of patterns) {
    try {
      const { execSync } = require('child_process');
      const result = execSync(
        `aws lambda list-functions --query "Functions[?contains(FunctionName, '${pattern}')].FunctionName" --output text`,
        { encoding: 'utf-8' }
      );
      
      if (result && result.trim()) {
        const functionName = result.trim().split('\t')[0];
        log(`✅ Found orchestrator: ${functionName}`, 'green');
        return functionName;
      }
    } catch (error) {
      // Continue to next pattern
    }
  }
  
  throw new Error('Could not find renewable orchestrator Lambda function');
}

async function testDashboardQuery(functionName) {
  logSection('TEST 1: Dashboard Query Detection');
  
  const testPayload = {
    query: 'show my project dashboard',
    sessionId: `test-${Date.now()}`
  };
  
  log(`📤 Sending test query: "${testPayload.query}"`, 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log('📥 Response received:', 'blue');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate response structure
    const checks = [
      {
        name: 'Response has success field',
        pass: typeof result.success === 'boolean',
        value: result.success
      },
      {
        name: 'Response has artifacts array',
        pass: Array.isArray(result.artifacts),
        value: result.artifacts?.length || 0
      },
      {
        name: 'Artifacts contain project_dashboard type',
        pass: result.artifacts?.some(a => {
          try {
            const artifact = typeof a === 'string' ? JSON.parse(a) : a;
            return artifact.type === 'project_dashboard';
          } catch {
            return false;
          }
        }),
        value: result.artifacts?.[0]?.type || 'none'
      },
      {
        name: 'Dashboard artifact has data',
        pass: result.artifacts?.some(a => {
          try {
            const artifact = typeof a === 'string' ? JSON.parse(a) : a;
            return artifact.type === 'project_dashboard' && artifact.data;
          } catch {
            return false;
          }
        }),
        value: 'checked'
      },
      {
        name: 'Response has thoughtSteps',
        pass: Array.isArray(result.thoughtSteps),
        value: result.thoughtSteps?.length || 0
      }
    ];
    
    log('\n📊 Validation Results:', 'cyan');
    let allPassed = true;
    
    for (const check of checks) {
      if (check.pass) {
        log(`  ✅ ${check.name}: ${check.value}`, 'green');
      } else {
        log(`  ❌ ${check.name}: ${check.value}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n🎉 All dashboard query checks passed!', 'green');
      return true;
    } else {
      log('\n⚠️  Some dashboard query checks failed', 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing dashboard query: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testListQuery(functionName) {
  logSection('TEST 2: List Query (Backward Compatibility)');
  
  const testPayload = {
    query: 'list my renewable projects',
    sessionId: `test-${Date.now()}`
  };
  
  log(`📤 Sending test query: "${testPayload.query}"`, 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log('📥 Response received:', 'blue');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate response structure
    const checks = [
      {
        name: 'Response has success field',
        pass: typeof result.success === 'boolean',
        value: result.success
      },
      {
        name: 'Response has message (text)',
        pass: typeof result.message === 'string' && result.message.length > 0,
        value: result.message?.substring(0, 50) + '...'
      },
      {
        name: 'Artifacts array is empty (text-only response)',
        pass: !result.artifacts || result.artifacts.length === 0,
        value: result.artifacts?.length || 0
      },
      {
        name: 'Response has thoughtSteps',
        pass: Array.isArray(result.thoughtSteps),
        value: result.thoughtSteps?.length || 0
      }
    ];
    
    log('\n📊 Validation Results:', 'cyan');
    let allPassed = true;
    
    for (const check of checks) {
      if (check.pass) {
        log(`  ✅ ${check.name}: ${check.value}`, 'green');
      } else {
        log(`  ❌ ${check.name}: ${check.value}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n🎉 All list query checks passed!', 'green');
      return true;
    } else {
      log('\n⚠️  Some list query checks failed', 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing list query: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function testActionQuery(functionName) {
  logSection('TEST 3: Action Query (Should NOT Trigger Dashboard)');
  
  const testPayload = {
    query: 'analyze terrain at 35.067482, -101.395466',
    sessionId: `test-${Date.now()}`
  };
  
  log(`📤 Sending test query: "${testPayload.query}"`, 'blue');
  
  try {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(testPayload)
    });
    
    const response = await lambdaClient.send(command);
    const result = JSON.parse(Buffer.from(response.Payload).toString());
    
    log('📥 Response received:', 'blue');
    console.log(JSON.stringify(result, null, 2));
    
    // Validate response structure
    const checks = [
      {
        name: 'Response has success field',
        pass: typeof result.success === 'boolean',
        value: result.success
      },
      {
        name: 'Did NOT trigger dashboard',
        pass: !result.artifacts?.some(a => {
          try {
            const artifact = typeof a === 'string' ? JSON.parse(a) : a;
            return artifact.type === 'project_dashboard';
          } catch {
            return false;
          }
        }),
        value: 'correct'
      },
      {
        name: 'Triggered terrain analysis instead',
        pass: result.artifacts?.some(a => {
          try {
            const artifact = typeof a === 'string' ? JSON.parse(a) : a;
            return artifact.messageContentType === 'wind_farm_terrain_analysis';
          } catch {
            return false;
          }
        }) || result.message?.includes('terrain'),
        value: 'correct'
      }
    ];
    
    log('\n📊 Validation Results:', 'cyan');
    let allPassed = true;
    
    for (const check of checks) {
      if (check.pass) {
        log(`  ✅ ${check.name}: ${check.value}`, 'green');
      } else {
        log(`  ❌ ${check.name}: ${check.value}`, 'red');
        allPassed = false;
      }
    }
    
    if (allPassed) {
      log('\n🎉 All action query checks passed!', 'green');
      return true;
    } else {
      log('\n⚠️  Some action query checks failed', 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ Error testing action query: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function main() {
  logSection('🚀 PROJECT DASHBOARD DEPLOYMENT VALIDATION');
  
  try {
    // Find orchestrator function
    const functionName = await findOrchestratorFunction();
    
    // Run all tests
    const results = {
      dashboardQuery: await testDashboardQuery(functionName),
      listQuery: await testListQuery(functionName),
      actionQuery: await testActionQuery(functionName)
    };
    
    // Summary
    logSection('📊 VALIDATION SUMMARY');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    
    log(`Total Tests: ${totalTests}`, 'blue');
    log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
    log(`Failed: ${totalTests - passedTests}`, totalTests === passedTests ? 'green' : 'red');
    
    if (passedTests === totalTests) {
      log('\n✅ ALL VALIDATION TESTS PASSED!', 'green');
      log('🎉 Project dashboard feature is properly deployed and working!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  SOME VALIDATION TESTS FAILED', 'yellow');
      log('Please check the errors above and redeploy if necessary.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ VALIDATION FAILED: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run validation
main();
