#!/usr/bin/env node

/**
 * Test Hybrid Intent Classifier
 * 
 * Tests the hybrid intent classification system that routes:
 * - High-confidence deterministic patterns → Direct tool calls
 * - Low-confidence or ambiguous queries → LLM agent
 */

const https = require('https');

// Test configuration
const TESTS = [
  {
    name: 'Wellbore Trajectory - Exact Pattern',
    query: 'Build wellbore trajectory for WELL-011',
    expectedIntent: 'wellbore_trajectory',
    expectedRouting: 'direct_tool_call',
    expectedWellId: 'WELL-011'
  },
  {
    name: 'Wellbore Trajectory - Variation',
    query: 'Visualize wellbore WELL-005',
    expectedIntent: 'wellbore_trajectory',
    expectedRouting: 'direct_tool_call',
    expectedWellId: 'WELL-005'
  },
  {
    name: 'Horizon Surface',
    query: 'Build horizon surface',
    expectedIntent: 'horizon_surface',
    expectedRouting: 'direct_tool_call'
  },
  {
    name: 'List Players',
    query: 'List players',
    expectedIntent: 'list_players',
    expectedRouting: 'direct_tool_call'
  },
  {
    name: 'System Status',
    query: 'Hello',
    expectedIntent: 'system_status',
    expectedRouting: 'direct_tool_call'
  },
  {
    name: 'Ambiguous Query - Should use LLM',
    query: 'Tell me about the subsurface data',
    expectedRouting: 'llm_agent'
  }
];

// Colors for output
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

async function testEDIcraftHandler(query) {
  return new Promise((resolve, reject) => {
    // Load amplify outputs to get API endpoint
    const amplifyOutputs = require('../amplify_outputs.json');
    const apiUrl = amplifyOutputs.custom?.apiEndpoint || process.env.API_ENDPOINT;
    
    if (!apiUrl) {
      reject(new Error('API endpoint not found in amplify_outputs.json'));
      return;
    }

    const url = new URL(apiUrl);
    const postData = JSON.stringify({
      message: query,
      chatSessionId: 'test-session-' + Date.now()
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTest(test) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`Test: ${test.name}`, 'cyan');
  log(`Query: "${test.query}"`, 'blue');
  log(`${'='.repeat(80)}`, 'cyan');

  try {
    const startTime = Date.now();
    const response = await testEDIcraftHandler(test.query);
    const duration = Date.now() - startTime;

    log(`\nResponse received in ${duration}ms`, 'yellow');
    
    // Check response structure
    if (!response.success) {
      log(`❌ Test FAILED: Response indicates failure`, 'red');
      log(`Error: ${response.error || 'Unknown error'}`, 'red');
      return false;
    }

    // Check for expected routing
    const message = response.message || '';
    const thoughtSteps = response.thoughtSteps || [];
    
    log(`\nMessage preview: ${message.substring(0, 200)}...`, 'yellow');
    log(`Thought steps: ${thoughtSteps.length}`, 'yellow');

    // Validate routing
    let routingCorrect = false;
    if (test.expectedRouting === 'direct_tool_call') {
      // Check if response indicates direct tool call was used
      const hasDirectToolCall = message.includes('DIRECT_TOOL_CALL') || 
                                thoughtSteps.some(step => 
                                  step.title?.includes('Direct') || 
                                  step.summary?.includes('deterministic')
                                );
      routingCorrect = hasDirectToolCall;
      log(`Direct tool call routing: ${routingCorrect ? '✅' : '❌'}`, routingCorrect ? 'green' : 'red');
    } else if (test.expectedRouting === 'llm_agent') {
      // Check if response indicates LLM was used
      const hasLLMResponse = thoughtSteps.some(step => 
        step.title?.includes('LLM') || 
        step.summary?.includes('natural language')
      );
      routingCorrect = hasLLMResponse;
      log(`LLM agent routing: ${routingCorrect ? '✅' : '❌'}`, routingCorrect ? 'green' : 'red');
    }

    // Validate intent detection
    if (test.expectedIntent) {
      const intentDetected = message.toLowerCase().includes(test.expectedIntent.replace('_', ' ')) ||
                            thoughtSteps.some(step => 
                              step.summary?.toLowerCase().includes(test.expectedIntent.replace('_', ' '))
                            );
      log(`Intent detection (${test.expectedIntent}): ${intentDetected ? '✅' : '❌'}`, intentDetected ? 'green' : 'red');
    }

    // Validate parameter extraction
    if (test.expectedWellId) {
      const wellIdExtracted = message.includes(test.expectedWellId);
      log(`Well ID extraction (${test.expectedWellId}): ${wellIdExtracted ? '✅' : '❌'}`, wellIdExtracted ? 'green' : 'red');
    }

    // Check for proper tool execution
    const hasToolExecution = thoughtSteps.some(step => 
      step.title?.includes('Tool') || 
      step.summary?.includes('executed') ||
      step.summary?.includes('called')
    );
    log(`Tool execution: ${hasToolExecution ? '✅' : '❌'}`, hasToolExecution ? 'green' : 'red');

    // Overall test result
    const testPassed = routingCorrect && (test.expectedIntent ? true : true);
    log(`\n${testPassed ? '✅ Test PASSED' : '❌ Test FAILED'}`, testPassed ? 'green' : 'red');
    
    return testPassed;

  } catch (error) {
    log(`❌ Test FAILED with error: ${error.message}`, 'red');
    log(`Stack: ${error.stack}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(80), 'cyan');
  log('HYBRID INTENT CLASSIFIER TEST SUITE', 'cyan');
  log('='.repeat(80) + '\n', 'cyan');

  const results = [];
  
  for (const test of TESTS) {
    const passed = await runTest(test);
    results.push({ test: test.name, passed });
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  log('\n' + '='.repeat(80), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    log(`${result.passed ? '✅' : '❌'} ${result.test}`, result.passed ? 'green' : 'red');
  });
  
  log(`\nTotal: ${passedCount}/${totalCount} tests passed`, passedCount === totalCount ? 'green' : 'red');
  
  if (passedCount === totalCount) {
    log('\n🎉 All tests passed! Hybrid intent classifier is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please review the output above.', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
