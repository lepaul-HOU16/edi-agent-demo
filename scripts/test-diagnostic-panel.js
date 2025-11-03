#!/usr/bin/env node

/**
 * Automated Diagnostic Panel Test Script
 * 
 * Tests the orchestrator diagnostic panel functionality programmatically.
 * Complements manual UI testing for Task 18.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * Usage:
 *   node scripts/test-diagnostic-panel.js
 *   node scripts/test-diagnostic-panel.js --quick
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const QUICK_MODE = process.argv.includes('--quick');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName, status, details = '') {
  const statusSymbol = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○';
  const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${statusSymbol} ${testName}`, statusColor);
  if (details) {
    console.log(`  ${details}`);
  }
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test 1: API Endpoint Accessibility
 */
async function testApiAccessibility() {
  logSection('Test 1: API Endpoint Accessibility');
  
  try {
    const url = `${BASE_URL}/api/renewable/diagnostics`;
    log(`Testing: ${url}`, 'cyan');
    
    const response = await makeRequest(url);
    
    if (response.statusCode === 200 || response.statusCode === 401 || response.statusCode === 503) {
      logTest('API endpoint is accessible', 'pass', `Status: ${response.statusCode}`);
      return { success: true, response };
    } else {
      logTest('API endpoint returned unexpected status', 'fail', `Status: ${response.statusCode}`);
      return { success: false, response };
    }
  } catch (error) {
    logTest('API endpoint is not accessible', 'fail', error.message);
    return { success: false, error };
  }
}

/**
 * Test 2: Quick Check Functionality
 */
async function testQuickCheck() {
  logSection('Test 2: Quick Check Functionality');
  
  try {
    const url = `${BASE_URL}/api/renewable/diagnostics?quick=true`;
    log(`Testing: ${url}`, 'cyan');
    
    const startTime = Date.now();
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    // Check response structure
    if (!response.data) {
      logTest('Quick check failed - no data', 'fail');
      return { success: false };
    }
    
    const { status, diagnosticType, results, summary } = response.data;
    
    // Verify it's a quick check
    if (diagnosticType !== 'quick') {
      logTest('Diagnostic type is not "quick"', 'fail', `Got: ${diagnosticType}`);
      return { success: false };
    }
    logTest('Diagnostic type is "quick"', 'pass');
    
    // Verify only 1 check (environment variables)
    if (results.length !== 1) {
      logTest('Quick check should have exactly 1 result', 'fail', `Got: ${results.length}`);
      return { success: false };
    }
    logTest('Quick check has 1 result', 'pass');
    
    // Verify it's the environment check
    if (results[0].step !== 'Check Environment Variables') {
      logTest('Quick check should be environment variables', 'fail', `Got: ${results[0].step}`);
      return { success: false };
    }
    logTest('Quick check is environment variables', 'pass');
    
    // Verify response time
    if (duration > 3000) {
      logTest('Quick check took too long', 'fail', `Duration: ${duration}ms`);
    } else {
      logTest('Quick check completed quickly', 'pass', `Duration: ${duration}ms`);
    }
    
    log(`\nQuick Check Summary:`, 'bright');
    log(`  Status: ${status}`);
    log(`  Total Checks: ${summary.total}`);
    log(`  Passed: ${summary.passed}`);
    log(`  Failed: ${summary.failed}`);
    log(`  Duration: ${duration}ms`);
    
    return { success: true, response };
  } catch (error) {
    logTest('Quick check failed with error', 'fail', error.message);
    return { success: false, error };
  }
}

/**
 * Test 3: Full Diagnostics Functionality
 */
async function testFullDiagnostics() {
  logSection('Test 3: Full Diagnostics Functionality');
  
  try {
    const url = `${BASE_URL}/api/renewable/diagnostics`;
    log(`Testing: ${url}`, 'cyan');
    
    const startTime = Date.now();
    const response = await makeRequest(url);
    const duration = Date.now() - startTime;
    
    if (!response.data) {
      logTest('Full diagnostics failed - no data', 'fail');
      return { success: false };
    }
    
    const { status, diagnosticType, results, summary, cloudWatchLinks, recommendations, nextSteps } = response.data;
    
    // Verify it's a full diagnostic
    if (diagnosticType !== 'full') {
      logTest('Diagnostic type is not "full"', 'fail', `Got: ${diagnosticType}`);
      return { success: false };
    }
    logTest('Diagnostic type is "full"', 'pass');
    
    // Verify multiple checks
    if (results.length < 1) {
      logTest('Full diagnostics should have at least 1 result', 'fail', `Got: ${results.length}`);
      return { success: false };
    }
    logTest(`Full diagnostics has ${results.length} result(s)`, 'pass');
    
    // Verify result structure
    results.forEach((result, index) => {
      const hasRequiredFields = result.step && typeof result.success === 'boolean' && result.details;
      if (hasRequiredFields) {
        logTest(`Result ${index + 1} has required fields`, 'pass', result.step);
      } else {
        logTest(`Result ${index + 1} missing required fields`, 'fail', result.step);
      }
    });
    
    // Verify summary
    if (summary && summary.total === results.length) {
      logTest('Summary matches result count', 'pass');
    } else {
      logTest('Summary does not match result count', 'fail');
    }
    
    // Verify CloudWatch links exist
    if (cloudWatchLinks && Object.keys(cloudWatchLinks).length > 0) {
      logTest('CloudWatch links are present', 'pass', `${Object.keys(cloudWatchLinks).length} link(s)`);
    } else {
      logTest('CloudWatch links are missing', 'warn', 'May be expected if functions not deployed');
    }
    
    // Verify recommendations (if any failures)
    if (summary.failed > 0) {
      if (recommendations && recommendations.length > 0) {
        logTest('Recommendations provided for failures', 'pass', `${recommendations.length} recommendation(s)`);
      } else {
        logTest('No recommendations for failures', 'fail');
      }
    }
    
    // Verify next steps
    if (nextSteps && nextSteps.length > 0) {
      logTest('Next steps are provided', 'pass', `${nextSteps.length} step(s)`);
    } else {
      logTest('Next steps are missing', 'fail');
    }
    
    log(`\nFull Diagnostics Summary:`, 'bright');
    log(`  Overall Status: ${status}`);
    log(`  Total Checks: ${summary.total}`);
    log(`  Passed: ${summary.passed}`);
    log(`  Failed: ${summary.failed}`);
    log(`  Duration: ${duration}ms`);
    log(`  Total Duration: ${summary.totalDuration}ms`);
    
    log(`\nDiagnostic Results:`, 'bright');
    results.forEach((result, index) => {
      const statusSymbol = result.success ? '✓' : '✗';
      const statusColor = result.success ? 'green' : 'red';
      log(`  ${statusSymbol} ${result.step}`, statusColor);
      if (!result.success && result.error) {
        log(`    Error: ${result.error}`, 'red');
      }
      if (result.duration) {
        log(`    Duration: ${result.duration}ms`);
      }
    });
    
    if (recommendations && recommendations.length > 0) {
      log(`\nRecommendations:`, 'yellow');
      recommendations.forEach((rec, index) => {
        log(`  ${index + 1}. ${rec}`, 'yellow');
      });
    }
    
    if (nextSteps && nextSteps.length > 0) {
      log(`\nNext Steps:`, 'cyan');
      nextSteps.forEach((step, index) => {
        log(`  ${step}`, 'cyan');
      });
    }
    
    return { success: true, response, overallHealthy: status === 'healthy' };
  } catch (error) {
    logTest('Full diagnostics failed with error', 'fail', error.message);
    return { success: false, error };
  }
}

/**
 * Test 4: Response Structure Validation
 */
async function testResponseStructure() {
  logSection('Test 4: Response Structure Validation');
  
  try {
    const url = `${BASE_URL}/api/renewable/diagnostics`;
    const response = await makeRequest(url);
    
    if (!response.data) {
      logTest('No response data', 'fail');
      return { success: false };
    }
    
    const requiredFields = ['status', 'timestamp', 'region', 'diagnosticType', 'results', 'summary', 'cloudWatchLinks', 'recommendations', 'nextSteps'];
    
    let allFieldsPresent = true;
    requiredFields.forEach(field => {
      if (response.data.hasOwnProperty(field)) {
        logTest(`Field "${field}" is present`, 'pass');
      } else {
        logTest(`Field "${field}" is missing`, 'fail');
        allFieldsPresent = false;
      }
    });
    
    // Validate summary structure
    if (response.data.summary) {
      const summaryFields = ['total', 'passed', 'failed', 'totalDuration'];
      summaryFields.forEach(field => {
        if (response.data.summary.hasOwnProperty(field)) {
          logTest(`Summary field "${field}" is present`, 'pass');
        } else {
          logTest(`Summary field "${field}" is missing`, 'fail');
          allFieldsPresent = false;
        }
      });
    }
    
    // Validate result structure
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const resultFields = ['step', 'success', 'details', 'duration', 'timestamp'];
      resultFields.forEach(field => {
        if (result.hasOwnProperty(field)) {
          logTest(`Result field "${field}" is present`, 'pass');
        } else {
          logTest(`Result field "${field}" is missing`, 'fail');
          allFieldsPresent = false;
        }
      });
    }
    
    return { success: allFieldsPresent };
  } catch (error) {
    logTest('Response structure validation failed', 'fail', error.message);
    return { success: false, error };
  }
}

/**
 * Test 5: Error Handling
 */
async function testErrorHandling() {
  logSection('Test 5: Error Handling');
  
  try {
    // Test with invalid endpoint
    const invalidUrl = `${BASE_URL}/api/renewable/diagnostics/invalid`;
    log(`Testing invalid endpoint: ${invalidUrl}`, 'cyan');
    
    const response = await makeRequest(invalidUrl);
    
    if (response.statusCode === 404 || response.statusCode === 405) {
      logTest('Invalid endpoint returns appropriate error', 'pass', `Status: ${response.statusCode}`);
    } else {
      logTest('Invalid endpoint handling unexpected', 'warn', `Status: ${response.statusCode}`);
    }
    
    return { success: true };
  } catch (error) {
    logTest('Error handling test failed', 'fail', error.message);
    return { success: false, error };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║     Orchestrator Diagnostic Panel - Automated Tests       ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');
  
  log(`\nTest Configuration:`, 'cyan');
  log(`  Base URL: ${BASE_URL}`);
  log(`  Mode: ${QUICK_MODE ? 'Quick' : 'Full'}`);
  log(`  Time: ${new Date().toISOString()}`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Run tests
  const test1 = await testApiAccessibility();
  results.tests.push({ name: 'API Accessibility', ...test1 });
  
  if (test1.success) {
    const test2 = await testQuickCheck();
    results.tests.push({ name: 'Quick Check', ...test2 });
    
    if (!QUICK_MODE) {
      const test3 = await testFullDiagnostics();
      results.tests.push({ name: 'Full Diagnostics', ...test3 });
      
      const test4 = await testResponseStructure();
      results.tests.push({ name: 'Response Structure', ...test4 });
      
      const test5 = await testErrorHandling();
      results.tests.push({ name: 'Error Handling', ...test5 });
    }
  }
  
  // Calculate results
  results.total = results.tests.length;
  results.passed = results.tests.filter(t => t.success).length;
  results.failed = results.total - results.passed;
  
  // Print summary
  logSection('Test Summary');
  log(`Total Tests: ${results.total}`, 'bright');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  log(`\nTest Results:`, 'bright');
  results.tests.forEach(test => {
    const status = test.success ? '✓ PASS' : '✗ FAIL';
    const color = test.success ? 'green' : 'red';
    log(`  ${status} - ${test.name}`, color);
  });
  
  // Check if orchestrator is healthy
  const fullDiagTest = results.tests.find(t => t.name === 'Full Diagnostics');
  if (fullDiagTest && fullDiagTest.overallHealthy) {
    log(`\n✓ Orchestrator is HEALTHY and ready to use`, 'green');
  } else if (fullDiagTest && !fullDiagTest.overallHealthy) {
    log(`\n✗ Orchestrator is UNHEALTHY - check diagnostics for details`, 'red');
  }
  
  log(`\n${'='.repeat(60)}\n`);
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
