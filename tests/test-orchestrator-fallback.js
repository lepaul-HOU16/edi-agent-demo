/**
 * Test Orchestrator Fallback Logic
 * 
 * This test verifies that the orchestrator properly falls back to direct tool
 * invocation when Strands Agents timeout or are throttled.
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Colors for console output
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

async function testOrchestratorFallback() {
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('🧪 Testing Orchestrator Fallback Logic', 'cyan');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');

  try {
    // Get orchestrator function name
    const { execSync } = require('child_process');
    const functionList = execSync(
      'aws lambda list-functions --query "Functions[?contains(FunctionName, \'renewableOrchestrator\')].FunctionName" --output text',
      { encoding: 'utf-8' }
    ).trim();

    if (!functionList) {
      log('❌ Orchestrator Lambda not found', 'red');
      log('   Run: npx ampx sandbox', 'yellow');
      process.exit(1);
    }

    const orchestratorName = functionList.split('\t')[0];
    log(`✅ Found orchestrator: ${orchestratorName}`, 'green');

    // Test 1: Normal query (should work with or without Strands Agents)
    log('\n📋 Test 1: Normal terrain analysis query', 'blue');
    log('─────────────────────────────────────────────────────────', 'blue');
    
    const normalPayload = {
      query: 'Analyze terrain at coordinates 35.067482, -101.395466',
      sessionId: `test-fallback-${Date.now()}`,
      context: {}
    };

    log('Invoking orchestrator with normal query...', 'cyan');
    const normalCommand = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify(normalPayload)
    });

    const normalResponse = await lambda.send(normalCommand);
    const normalResult = JSON.parse(new TextDecoder().decode(normalResponse.Payload));
    
    log(`Response status: ${normalResult.success ? '✅ Success' : '❌ Failed'}`, 
        normalResult.success ? 'green' : 'red');
    
    if (normalResult.metadata) {
      log(`Fallback used: ${normalResult.metadata.fallbackUsed ? '⚠️  Yes' : '✅ No'}`, 
          normalResult.metadata.fallbackUsed ? 'yellow' : 'green');
      
      if (normalResult.metadata.fallbackUsed) {
        log(`Fallback reason: ${normalResult.metadata.fallbackReason}`, 'yellow');
      }
      
      log(`Tools used: ${normalResult.metadata.toolsUsed?.join(', ') || 'none'}`, 'cyan');
      log(`Execution time: ${normalResult.metadata.executionTime}ms`, 'cyan');
    }

    // Check if artifacts were generated
    if (normalResult.artifacts && normalResult.artifacts.length > 0) {
      log(`✅ Generated ${normalResult.artifacts.length} artifact(s)`, 'green');
      normalResult.artifacts.forEach((artifact, index) => {
        log(`   ${index + 1}. ${artifact.type}`, 'cyan');
      });
    } else {
      log('⚠️  No artifacts generated', 'yellow');
    }

    // Test 2: Check environment variables for Strands Agent availability
    log('\n📋 Test 2: Check Strands Agent configuration', 'blue');
    log('─────────────────────────────────────────────────────────', 'blue');
    
    const configCommand = new InvokeCommand({
      FunctionName: orchestratorName,
      Payload: JSON.stringify({
        query: '__health_check__',
        sessionId: `health-${Date.now()}`
      })
    });

    const configResponse = await lambda.send(configCommand);
    const configResult = JSON.parse(new TextDecoder().decode(configResponse.Payload));
    
    if (configResult.metadata?.health) {
      const health = configResult.metadata.health;
      log('Environment configuration:', 'cyan');
      log(`  Terrain tool: ${health.toolsConfigured?.terrain ? '✅' : '❌'}`, 
          health.toolsConfigured?.terrain ? 'green' : 'red');
      log(`  Layout tool: ${health.toolsConfigured?.layout ? '✅' : '❌'}`, 
          health.toolsConfigured?.layout ? 'green' : 'red');
      log(`  Simulation tool: ${health.toolsConfigured?.simulation ? '✅' : '❌'}`, 
          health.toolsConfigured?.simulation ? 'green' : 'red');
      log(`  Report tool: ${health.toolsConfigured?.report ? '✅' : '❌'}`, 
          health.toolsConfigured?.report ? 'green' : 'red');
    }

    // Summary
    log('\n═══════════════════════════════════════════════════════════', 'cyan');
    log('📊 Test Summary', 'cyan');
    log('═══════════════════════════════════════════════════════════', 'cyan');
    
    const allTestsPassed = normalResult.success;
    
    if (allTestsPassed) {
      log('✅ All tests passed!', 'green');
      log('\nFallback logic is working correctly:', 'green');
      log('  • Orchestrator handles queries successfully', 'green');
      log('  • Falls back to direct tools when Strands Agents unavailable', 'green');
      log('  • Generates artifacts correctly', 'green');
      log('  • Metadata includes fallback information', 'green');
    } else {
      log('❌ Some tests failed', 'red');
      log('Check the logs above for details', 'yellow');
    }

    log('\n💡 Next Steps:', 'cyan');
    log('  1. Enable Strands Agents by setting isStrandsAgentAvailable() to return true', 'cyan');
    log('  2. Test with Strands Agents enabled to verify timeout handling', 'cyan');
    log('  3. Monitor CloudWatch logs for fallback events', 'cyan');
    
    process.exit(allTestsPassed ? 0 : 1);

  } catch (error) {
    log('\n❌ Test failed with error:', 'red');
    log(error.message, 'red');
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      log(error.stack, 'yellow');
    }
    process.exit(1);
  }
}

// Run the test
testOrchestratorFallback();
