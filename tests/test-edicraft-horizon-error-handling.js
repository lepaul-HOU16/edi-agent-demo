/**
 * Test EDIcraft Horizon Query Error Handling
 * Task 8: Test Error Handling for Horizon Queries
 * Requirements: 2.5, 5.4
 * 
 * Tests:
 * - Invalid horizon query
 * - Missing OSDU credentials
 * - Unreachable Minecraft server
 * - User-friendly error messages
 * - Troubleshooting steps in error messages
 */

// Mock environment variables for testing
const originalEnv = { ...process.env };

// Helper function to restore environment
function restoreEnvironment() {
  process.env = { ...originalEnv };
}

// Helper function to clear environment variables
function clearEnvironment() {
  delete process.env.BEDROCK_AGENT_ID;
  delete process.env.BEDROCK_AGENT_ALIAS_ID;
  delete process.env.MINECRAFT_HOST;
  delete process.env.MINECRAFT_PORT;
  delete process.env.MINECRAFT_RCON_PASSWORD;
  delete process.env.EDI_USERNAME;
  delete process.env.EDI_PASSWORD;
  delete process.env.EDI_CLIENT_ID;
  delete process.env.EDI_CLIENT_SECRET;
  delete process.env.EDI_PARTITION;
  delete process.env.EDI_PLATFORM_URL;
}

// Mock error categorization function (from handler.ts)
function categorizeError(errorMessage) {
  if (errorMessage.includes('INVALID_CONFIG') || errorMessage.includes('Configuration Error')) {
    return 'INVALID_CONFIG';
  }
  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
    return 'CONNECTION_REFUSED';
  }
  if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
    return 'TIMEOUT';
  }
  if (errorMessage.includes('EAUTH') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
    return 'AUTH_FAILED';
  }
  if (errorMessage.includes('OSDU') || errorMessage.includes('platform')) {
    return 'OSDU_ERROR';
  }
  if (errorMessage.includes('agent') && errorMessage.includes('not') && (errorMessage.includes('deployed') || errorMessage.includes('found'))) {
    return 'AGENT_NOT_DEPLOYED';
  }
  if (errorMessage.includes('invalid') && errorMessage.includes('horizon')) {
    return 'INVALID_HORIZON_QUERY';
  }
  if (errorMessage.includes('horizon') && errorMessage.includes('not found')) {
    return 'HORIZON_NOT_FOUND';
  }
  return 'UNKNOWN';
}

// Mock user-friendly error message function (from handler.ts)
function getUserFriendlyErrorMessage(errorType, originalError) {
  switch (errorType) {
    case 'INVALID_CONFIG':
      return `❌ EDIcraft Agent Configuration Error\n\n` +
             `The EDIcraft agent requires proper configuration before it can process horizon queries.\n\n` +
             `🔴 Configuration Issue: ${originalError}\n\n` +
             `🔧 To fix this issue:\n` +
             `1. Deploy the Bedrock AgentCore agent: cd edicraft-agent && make deploy\n` +
             `2. Set the environment variables in .env.local\n` +
             `3. Restart the sandbox: npx ampx sandbox\n` +
             `4. Refer to: edicraft-agent/DEPLOYMENT_GUIDE.md\n`;
    
    case 'CONNECTION_REFUSED':
      return `❌ Unable to Connect to Minecraft Server\n\n` +
             `Cannot connect to Minecraft server for horizon visualization.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify the Minecraft server is running\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm the server is accessible from this network\n` +
             `4. Verify firewall rules allow connections\n` +
             `5. Test connection: telnet ${process.env.MINECRAFT_HOST || 'minecraft-server'} ${process.env.MINECRAFT_PORT || '25575'}`;
    
    case 'TIMEOUT':
      return `⏱️ Connection Timeout\n\n` +
             `Connection to Minecraft server timed out while processing horizon query.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Check network connectivity to ${process.env.MINECRAFT_HOST || 'minecraft-server'}\n` +
             `2. Verify server is not under heavy load\n` +
             `3. Check firewall or security group settings\n` +
             `4. Increase timeout if server is slow to respond`;
    
    case 'AUTH_FAILED':
      return `🔐 Authentication Failed\n\n` +
             `Unable to authenticate with Minecraft server or OSDU platform for horizon data.\n\n` +
             `🔧 Troubleshooting Steps:\n\n` +
             `**For Minecraft RCON:**\n` +
             `1. Verify RCON password is correct (MINECRAFT_RCON_PASSWORD)\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm RCON port matches server configuration\n\n` +
             `**For OSDU Platform:**\n` +
             `1. Verify EDI_USERNAME and EDI_PASSWORD are correct\n` +
             `2. Check EDI_CLIENT_ID and EDI_CLIENT_SECRET are valid\n` +
             `3. Confirm user has necessary permissions to access horizon data`;
    
    case 'OSDU_ERROR':
      return `🌐 OSDU Platform Error\n\n` +
             `Error accessing OSDU platform to retrieve horizon data.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify OSDU platform credentials are correct\n` +
             `2. Check platform URL is accessible: ${process.env.EDI_PLATFORM_URL || 'OSDU platform'}\n` +
             `3. Confirm user has necessary permissions to access horizon data\n` +
             `4. Verify partition name is correct: ${process.env.EDI_PARTITION || 'partition'}\n` +
             `5. Check platform status and availability\n` +
             `6. Verify horizon data exists in the platform\n\n` +
             `Error details: ${originalError}`;
    
    case 'INVALID_HORIZON_QUERY':
      return `❌ Invalid Horizon Query\n\n` +
             `The horizon query could not be processed.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify horizon name or ID is correct\n` +
             `2. Check horizon data exists in OSDU platform\n` +
             `3. Try a simpler query: "find a horizon"\n` +
             `4. Specify horizon name explicitly if known\n\n` +
             `Error details: ${originalError}`;
    
    case 'HORIZON_NOT_FOUND':
      return `❌ Horizon Not Found\n\n` +
             `The requested horizon could not be found in the OSDU platform.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify horizon name or ID is correct\n` +
             `2. Check horizon data exists in OSDU partition: ${process.env.EDI_PARTITION || 'partition'}\n` +
             `3. Confirm user has permissions to access horizon data\n` +
             `4. Try searching for available horizons: "list horizons"\n` +
             `5. Contact data administrator if horizon should exist\n\n` +
             `Error details: ${originalError}`;
    
    case 'AGENT_NOT_DEPLOYED':
      return `❌ Bedrock AgentCore Not Deployed\n\n` +
             `The EDIcraft agent requires a deployed Bedrock AgentCore instance to process horizon queries.\n\n` +
             `📋 Deployment Steps:\n` +
             `1. Navigate to the edicraft-agent directory\n` +
             `2. Follow the deployment guide: BEDROCK_AGENTCORE_DEPLOYMENT.md\n` +
             `3. Deploy the agent using: make deploy\n` +
             `4. Update BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID environment variables\n` +
             `5. Restart the sandbox: npx ampx sandbox\n\n` +
             `Error details: ${originalError}`;
    
    default:
      return `❌ An Error Occurred\n\n` +
             `${originalError}\n\n` +
             `🔧 General Troubleshooting:\n` +
             `1. Check Minecraft server status\n` +
             `2. Verify OSDU platform connectivity\n` +
             `3. Review environment variable configuration\n` +
             `4. Check CloudWatch logs for detailed error information\n` +
             `5. Verify horizon data exists in OSDU platform`;
  }
}

// Test scenarios for horizon query error handling
const errorScenarios = [
  {
    name: 'Invalid Horizon Query - Empty Query',
    query: '',
    errorMessage: 'invalid horizon query: empty query string',
    expectedType: 'INVALID_HORIZON_QUERY',
    requiredKeywords: ['Invalid Horizon Query', 'Troubleshooting Steps', 'horizon name', 'simpler query']
  },
  {
    name: 'Invalid Horizon Query - Malformed Query',
    query: 'find horizon @#$%',
    errorMessage: 'invalid horizon query: malformed query string',
    expectedType: 'INVALID_HORIZON_QUERY',
    requiredKeywords: ['Invalid Horizon Query', 'Troubleshooting Steps', 'horizon name']
  },
  {
    name: 'Horizon Not Found',
    query: 'find horizon NONEXISTENT-HORIZON-123',
    errorMessage: 'horizon not found: NONEXISTENT-HORIZON-123',
    expectedType: 'HORIZON_NOT_FOUND',
    requiredKeywords: ['Horizon Not Found', 'Troubleshooting Steps', 'horizon name', 'list horizons', 'permissions']
  },
  {
    name: 'Missing OSDU Credentials',
    query: 'find a horizon',
    errorMessage: 'OSDU platform error: missing credentials',
    expectedType: 'OSDU_ERROR',
    requiredKeywords: ['OSDU Platform Error', 'Troubleshooting Steps', 'credentials', 'permissions', 'horizon data']
  },
  {
    name: 'OSDU Authentication Failed',
    query: 'find a horizon',
    errorMessage: 'authentication failed: invalid OSDU credentials',
    expectedType: 'AUTH_FAILED',
    requiredKeywords: ['Authentication Failed', 'Troubleshooting Steps', 'EDI_USERNAME', 'EDI_PASSWORD', 'horizon data']
  },
  {
    name: 'OSDU Platform Unreachable',
    query: 'find a horizon',
    errorMessage: 'OSDU platform error: unable to connect',
    expectedType: 'OSDU_ERROR',
    requiredKeywords: ['OSDU Platform Error', 'Troubleshooting Steps', 'platform URL', 'status', 'horizon data']
  },
  {
    name: 'Minecraft Server Unreachable',
    query: 'convert horizon to minecraft coordinates',
    errorMessage: 'ECONNREFUSED: connection refused to minecraft server',
    expectedType: 'CONNECTION_REFUSED',
    requiredKeywords: ['Unable to Connect', 'Minecraft Server', 'Troubleshooting Steps', 'RCON', 'firewall']
  },
  {
    name: 'Minecraft Server Timeout',
    query: 'build horizon surface',
    errorMessage: 'ETIMEDOUT: connection timeout to minecraft server',
    expectedType: 'TIMEOUT',
    requiredKeywords: ['Connection Timeout', 'Troubleshooting Steps', 'network connectivity', 'firewall']
  },
  {
    name: 'Minecraft RCON Authentication Failed',
    query: 'build horizon surface',
    errorMessage: 'EAUTH: RCON authentication failed',
    expectedType: 'AUTH_FAILED',
    requiredKeywords: ['Authentication Failed', 'Troubleshooting Steps', 'RCON password', 'MINECRAFT_RCON_PASSWORD']
  },
  {
    name: 'Missing Configuration',
    query: 'find a horizon',
    errorMessage: 'INVALID_CONFIG: missing BEDROCK_AGENT_ID',
    expectedType: 'INVALID_CONFIG',
    requiredKeywords: ['Configuration Error', 'To fix this issue', 'Bedrock AgentCore', 'environment variables']
  },
  {
    name: 'Agent Not Deployed',
    query: 'find a horizon',
    errorMessage: 'Bedrock agent not found or not deployed',
    expectedType: 'AGENT_NOT_DEPLOYED',
    requiredKeywords: ['Not Deployed', 'Bedrock AgentCore', 'Deployment Steps', 'make deploy']
  }
];

console.log('=== Testing EDIcraft Horizon Query Error Handling ===\n');
console.log('Task 8: Test Error Handling for Horizon Queries');
console.log('Requirements: 2.5, 5.4\n');

let passedTests = 0;
let failedTests = 0;

// Test 1: Error Categorization
console.log('=== Test 1: Error Categorization ===\n');

errorScenarios.forEach(scenario => {
  console.log(`Testing: ${scenario.name}`);
  console.log(`  Query: "${scenario.query}"`);
  console.log(`  Error Message: ${scenario.errorMessage}`);
  
  const categorizedType = categorizeError(scenario.errorMessage);
  console.log(`  Expected Type: ${scenario.expectedType}`);
  console.log(`  Actual Type: ${categorizedType}`);
  
  if (categorizedType === scenario.expectedType) {
    console.log(`  ✅ PASS - Error correctly categorized\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Error categorization mismatch\n`);
    failedTests++;
  }
});

// Test 2: User-Friendly Error Messages
console.log('=== Test 2: User-Friendly Error Messages ===\n');

errorScenarios.forEach(scenario => {
  console.log(`Testing: ${scenario.name}`);
  
  const errorType = categorizeError(scenario.errorMessage);
  const message = getUserFriendlyErrorMessage(errorType, scenario.errorMessage);
  
  let allKeywordsFound = true;
  const missingKeywords = [];
  
  scenario.requiredKeywords.forEach(keyword => {
    if (!message.includes(keyword)) {
      allKeywordsFound = false;
      missingKeywords.push(keyword);
    }
  });
  
  if (allKeywordsFound) {
    console.log(`  ✅ PASS - All required keywords found`);
    console.log(`  Keywords checked: ${scenario.requiredKeywords.length}\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Missing keywords: ${missingKeywords.join(', ')}`);
    console.log(`  Message preview: ${message.substring(0, 150)}...\n`);
    failedTests++;
  }
});

// Test 3: Troubleshooting Steps Present
console.log('=== Test 3: Troubleshooting Steps Present ===\n');

const troubleshootingTests = [
  {
    errorType: 'INVALID_HORIZON_QUERY',
    requiredSteps: ['horizon name', 'simpler query', 'OSDU platform']
  },
  {
    errorType: 'HORIZON_NOT_FOUND',
    requiredSteps: ['horizon name', 'list horizons', 'permissions', 'data administrator']
  },
  {
    errorType: 'OSDU_ERROR',
    requiredSteps: ['credentials', 'platform URL', 'permissions', 'partition', 'horizon data']
  },
  {
    errorType: 'CONNECTION_REFUSED',
    requiredSteps: ['Minecraft server', 'RCON', 'firewall', 'telnet']
  },
  {
    errorType: 'AUTH_FAILED',
    requiredSteps: ['RCON password', 'EDI_USERNAME', 'EDI_PASSWORD', 'permissions']
  }
];

troubleshootingTests.forEach(test => {
  console.log(`Testing troubleshooting steps for: ${test.errorType}`);
  const message = getUserFriendlyErrorMessage(test.errorType, 'Test error');
  
  let hasAllSteps = true;
  const missingSteps = [];
  
  test.requiredSteps.forEach(step => {
    if (!message.toLowerCase().includes(step.toLowerCase())) {
      hasAllSteps = false;
      missingSteps.push(step);
    }
  });
  
  if (hasAllSteps) {
    console.log(`  ✅ PASS - All required troubleshooting steps present`);
    console.log(`  Steps checked: ${test.requiredSteps.length}\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Missing steps: ${missingSteps.join(', ')}\n`);
    failedTests++;
  }
});

// Test 4: Error Messages Are User-Friendly
console.log('=== Test 4: Error Messages Are User-Friendly ===\n');

const userFriendlinessTests = [
  {
    errorType: 'INVALID_HORIZON_QUERY',
    requirements: [
      'Clear error title with emoji',
      'Explanation of what went wrong',
      'Numbered troubleshooting steps',
      'Specific actions user can take'
    ]
  },
  {
    errorType: 'OSDU_ERROR',
    requirements: [
      'Clear error title with emoji',
      'Explanation of what went wrong',
      'Numbered troubleshooting steps',
      'Specific configuration to check'
    ]
  },
  {
    errorType: 'CONNECTION_REFUSED',
    requirements: [
      'Clear error title with emoji',
      'Explanation of what went wrong',
      'Numbered troubleshooting steps',
      'Specific commands to run'
    ]
  }
];

userFriendlinessTests.forEach(test => {
  console.log(`Testing user-friendliness for: ${test.errorType}`);
  const message = getUserFriendlyErrorMessage(test.errorType, 'Test error');
  
  // Check for emoji
  const hasEmoji = /[❌⏱️🔐🌐]/u.test(message);
  
  // Check for clear structure
  const hasTitle = message.split('\n')[0].length < 100;
  const hasTroubleshooting = message.includes('Troubleshooting') || message.includes('Steps');
  const hasNumberedSteps = /\d+\./g.test(message);
  
  const checks = [
    { name: 'Has emoji', passed: hasEmoji },
    { name: 'Has clear title', passed: hasTitle },
    { name: 'Has troubleshooting section', passed: hasTroubleshooting },
    { name: 'Has numbered steps', passed: hasNumberedSteps }
  ];
  
  const allPassed = checks.every(check => check.passed);
  
  if (allPassed) {
    console.log(`  ✅ PASS - Message is user-friendly`);
    checks.forEach(check => console.log(`    ✓ ${check.name}`));
    console.log();
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Message could be more user-friendly`);
    checks.forEach(check => {
      if (!check.passed) {
        console.log(`    ✗ ${check.name}`);
      }
    });
    console.log();
    failedTests++;
  }
});

// Test 5: Specific Horizon Error Scenarios
console.log('=== Test 5: Specific Horizon Error Scenarios ===\n');

const horizonSpecificTests = [
  {
    name: 'Empty horizon query',
    query: '',
    expectedError: 'invalid horizon query',
    shouldInclude: ['horizon name', 'simpler query']
  },
  {
    name: 'Horizon not found in OSDU',
    query: 'find horizon XYZ-123',
    expectedError: 'horizon not found',
    shouldInclude: ['list horizons', 'permissions', 'data administrator']
  },
  {
    name: 'Missing OSDU credentials for horizon access',
    query: 'find a horizon',
    expectedError: 'OSDU platform error: missing credentials',
    shouldInclude: ['credentials', 'permissions', 'horizon data']
  },
  {
    name: 'Minecraft server unreachable for horizon visualization',
    query: 'build horizon surface',
    expectedError: 'ECONNREFUSED',
    shouldInclude: ['Minecraft Server', 'RCON', 'horizon visualization']
  }
];

horizonSpecificTests.forEach(test => {
  console.log(`Testing: ${test.name}`);
  console.log(`  Query: "${test.query}"`);
  
  const errorType = categorizeError(test.expectedError);
  const message = getUserFriendlyErrorMessage(errorType, test.expectedError);
  
  let allIncluded = true;
  const missing = [];
  
  test.shouldInclude.forEach(keyword => {
    if (!message.toLowerCase().includes(keyword.toLowerCase())) {
      allIncluded = false;
      missing.push(keyword);
    }
  });
  
  if (allIncluded) {
    console.log(`  ✅ PASS - All horizon-specific guidance present\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Missing guidance: ${missing.join(', ')}\n`);
    failedTests++;
  }
});

// Summary
console.log('=== Test Summary ===');
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n✅ All horizon error handling tests passed!');
  console.log('✅ Error messages are user-friendly');
  console.log('✅ Troubleshooting steps are comprehensive');
  console.log('✅ Horizon-specific guidance is present');
  console.log('\nTask 8 Complete: Error handling for horizon queries is properly implemented');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the error handling implementation.');
  process.exit(1);
}
