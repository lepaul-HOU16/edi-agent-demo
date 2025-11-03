#!/usr/bin/env node

/**
 * End-to-End Horizon Query Validation
 * 
 * Tests the complete workflow for horizon queries:
 * 1. Query routing to EDIcraft agent
 * 2. EDIcraft handler processing
 * 3. Response quality and content
 * 4. Thought steps execution
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
require('dotenv').config({ path: '.env.local' });

// Lambda client
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Test configuration
const TEST_QUERY = "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft";
const TEST_SESSION_ID = `test-horizon-e2e-${Date.now()}`;

// Validation criteria
const VALIDATION_CHECKS = {
  routing: {
    name: 'Query Routes to EDIcraft Agent',
    required: true,
    check: (response) => response.agentUsed === 'edicraft'
  },
  notPetrophysics: {
    name: 'Response is NOT Petrophysics Welcome Message',
    required: true,
    check: (response) => {
      const message = response.message?.toLowerCase() || '';
      const petrophysicsIndicators = [
        'petrophysical analysis',
        'well log analysis',
        'porosity calculation',
        'shale volume',
        'water saturation'
      ];
      return !petrophysicsIndicators.some(indicator => message.includes(indicator));
    }
  },
  horizonContent: {
    name: 'Response Includes Horizon-Related Content',
    required: true,
    check: (response) => {
      const message = response.message?.toLowerCase() || '';
      const horizonIndicators = [
        'horizon',
        'geological',
        'formation',
        'subsurface',
        'minecraft',
        'coordinates'
      ];
      return horizonIndicators.some(indicator => message.includes(indicator));
    }
  },
  thoughtSteps: {
    name: 'Thought Steps Show Proper Execution',
    required: true,
    check: (response) => {
      return response.thoughtSteps && 
             Array.isArray(response.thoughtSteps) && 
             response.thoughtSteps.length > 0;
    }
  },
  success: {
    name: 'Response Indicates Success',
    required: true,
    check: (response) => response.success === true
  },
  hasMessage: {
    name: 'Response Contains Message Content',
    required: true,
    check: (response) => {
      return response.message && 
             typeof response.message === 'string' && 
             response.message.length > 50;
    }
  },
  coordinateInfo: {
    name: 'Response Includes Coordinate Information',
    required: false,
    check: (response) => {
      const message = response.message?.toLowerCase() || '';
      return message.includes('coordinate') || 
             message.includes('position') ||
             message.includes('location');
    }
  },
  minecraftReference: {
    name: 'Response References Minecraft',
    required: false,
    check: (response) => {
      const message = response.message?.toLowerCase() || '';
      return message.includes('minecraft');
    }
  }
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logCheck(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function sendHorizonQuery() {
  logSection('STEP 1: Sending Horizon Query');
  
  log(`Query: "${TEST_QUERY}"`, 'cyan');
  log(`Session ID: ${TEST_SESSION_ID}`, 'cyan');
  
  try {
    const startTime = Date.now();
    
    // Get the agent router Lambda function name
    const functionName = process.env.AGENT_ROUTER_FUNCTION_NAME || 
                        'amplify-digitalassistant-agentRouter';
    
    log(`\nInvoking Lambda: ${functionName}`, 'cyan');
    
    // Prepare the payload
    const payload = {
      message: TEST_QUERY,
      chatSessionId: TEST_SESSION_ID,
      userId: 'test-user',
      selectedAgent: undefined // Let router decide
    };
    
    // Invoke the Lambda
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload)
    });
    
    const lambdaResponse = await lambdaClient.send(command);
    
    // Parse the response
    const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
    
    const duration = Date.now() - startTime;
    
    log(`\n✅ Query completed in ${duration}ms`, 'green');
    
    return responsePayload;
  } catch (error) {
    log(`\n❌ Query failed: ${error.message}`, 'red');
    console.error(error);
    throw error;
  }
}

function validateResponse(response) {
  logSection('STEP 2: Validating Response');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Run all validation checks
  for (const [key, check] of Object.entries(VALIDATION_CHECKS)) {
    try {
      const passed = check.check(response);
      
      if (passed) {
        results.passed.push(check.name);
        logCheck(check.name, true);
      } else {
        if (check.required) {
          results.failed.push(check.name);
          logCheck(check.name, false, 'REQUIRED CHECK FAILED');
        } else {
          results.warnings.push(check.name);
          logCheck(check.name, false, 'Optional check failed');
        }
      }
    } catch (error) {
      results.failed.push(check.name);
      logCheck(check.name, false, `Error: ${error.message}`);
    }
  }
  
  return results;
}

function analyzeResponse(response) {
  logSection('STEP 3: Response Analysis');
  
  // Agent routing
  log('Agent Used:', 'bright');
  log(`  ${response.agentUsed || 'UNKNOWN'}`, response.agentUsed === 'edicraft' ? 'green' : 'red');
  
  // Message content
  log('\nMessage Content:', 'bright');
  const messagePreview = response.message?.substring(0, 200) || 'NO MESSAGE';
  log(`  ${messagePreview}${response.message?.length > 200 ? '...' : ''}`, 'cyan');
  log(`  Length: ${response.message?.length || 0} characters`, 'cyan');
  
  // Thought steps
  log('\nThought Steps:', 'bright');
  if (response.thoughtSteps && response.thoughtSteps.length > 0) {
    log(`  Count: ${response.thoughtSteps.length}`, 'green');
    response.thoughtSteps.forEach((step, index) => {
      log(`  ${index + 1}. ${step.title || step.type || 'Unknown'}`, 'cyan');
      if (step.summary) {
        log(`     ${step.summary.substring(0, 100)}`, 'cyan');
      }
    });
  } else {
    log('  No thought steps found', 'yellow');
  }
  
  // Artifacts
  log('\nArtifacts:', 'bright');
  if (response.artifacts && response.artifacts.length > 0) {
    log(`  Count: ${response.artifacts.length}`, 'green');
    response.artifacts.forEach((artifact, index) => {
      log(`  ${index + 1}. Type: ${artifact.type || 'unknown'}`, 'cyan');
    });
  } else {
    log('  No artifacts (expected for EDIcraft - visualization in Minecraft)', 'cyan');
  }
  
  // Success status
  log('\nSuccess Status:', 'bright');
  log(`  ${response.success ? '✅ Success' : '❌ Failed'}`, response.success ? 'green' : 'red');
}

function checkForPetrophysicsContent(response) {
  logSection('STEP 4: Petrophysics Content Check');
  
  const message = response.message?.toLowerCase() || '';
  
  const petrophysicsTerms = [
    'petrophysical',
    'porosity',
    'permeability',
    'shale volume',
    'water saturation',
    'well log',
    'gamma ray',
    'resistivity',
    'neutron',
    'density log'
  ];
  
  const foundTerms = petrophysicsTerms.filter(term => message.includes(term));
  
  if (foundTerms.length === 0) {
    log('✅ No petrophysics content detected', 'green');
    log('   Response correctly routed to EDIcraft', 'green');
    return true;
  } else {
    log('❌ Petrophysics content detected!', 'red');
    log(`   Found terms: ${foundTerms.join(', ')}`, 'red');
    log('   This indicates incorrect routing to petrophysics agent', 'red');
    return false;
  }
}

function checkForHorizonContent(response) {
  logSection('STEP 5: Horizon Content Check');
  
  const message = response.message?.toLowerCase() || '';
  
  const horizonTerms = [
    'horizon',
    'geological',
    'formation',
    'subsurface',
    'minecraft',
    'coordinate',
    'utm',
    'easting',
    'northing',
    'elevation',
    'wellbore',
    'trajectory'
  ];
  
  const foundTerms = horizonTerms.filter(term => message.includes(term));
  
  if (foundTerms.length > 0) {
    log(`✅ Horizon-related content found (${foundTerms.length} terms)`, 'green');
    log(`   Terms: ${foundTerms.join(', ')}`, 'green');
    return true;
  } else {
    log('⚠️  No horizon-related content detected', 'yellow');
    log('   Response may be generic or error message', 'yellow');
    return false;
  }
}

function generateReport(results, response, noPetrophysics, hasHorizon) {
  logSection('VALIDATION REPORT');
  
  const totalChecks = results.passed.length + results.failed.length + results.warnings.length;
  const requiredPassed = results.passed.filter(name => {
    const check = Object.values(VALIDATION_CHECKS).find(c => c.name === name);
    return check?.required;
  }).length;
  const requiredTotal = Object.values(VALIDATION_CHECKS).filter(c => c.required).length;
  
  log('Summary:', 'bright');
  log(`  Total Checks: ${totalChecks}`, 'cyan');
  log(`  Passed: ${results.passed.length}`, 'green');
  log(`  Failed: ${results.failed.length}`, results.failed.length === 0 ? 'green' : 'red');
  log(`  Warnings: ${results.warnings.length}`, results.warnings.length === 0 ? 'green' : 'yellow');
  log(`  Required Checks: ${requiredPassed}/${requiredTotal}`, requiredPassed === requiredTotal ? 'green' : 'red');
  
  log('\nContent Validation:', 'bright');
  log(`  No Petrophysics Content: ${noPetrophysics ? '✅' : '❌'}`, noPetrophysics ? 'green' : 'red');
  log(`  Has Horizon Content: ${hasHorizon ? '✅' : '⚠️'}`, hasHorizon ? 'green' : 'yellow');
  
  const overallPass = results.failed.length === 0 && noPetrophysics;
  
  log('\nOverall Result:', 'bright');
  if (overallPass) {
    log('  ✅ VALIDATION PASSED', 'green');
    log('  All required checks passed', 'green');
    log('  Query correctly routed to EDIcraft', 'green');
    log('  Response contains appropriate content', 'green');
  } else {
    log('  ❌ VALIDATION FAILED', 'red');
    if (results.failed.length > 0) {
      log(`  Failed checks: ${results.failed.join(', ')}`, 'red');
    }
    if (!noPetrophysics) {
      log('  Response contains petrophysics content (incorrect routing)', 'red');
    }
  }
  
  return overallPass;
}

async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║         END-TO-END HORIZON QUERY VALIDATION TEST                           ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'bright');
  
  try {
    // Step 1: Send query
    const response = await sendHorizonQuery();
    
    // Step 2: Validate response structure
    const validationResults = validateResponse(response);
    
    // Step 3: Analyze response details
    analyzeResponse(response);
    
    // Step 4: Check for petrophysics content
    const noPetrophysics = checkForPetrophysicsContent(response);
    
    // Step 5: Check for horizon content
    const hasHorizon = checkForHorizonContent(response);
    
    // Generate final report
    const passed = generateReport(validationResults, response, noPetrophysics, hasHorizon);
    
    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
    
  } catch (error) {
    logSection('ERROR');
    log('Test execution failed:', 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
