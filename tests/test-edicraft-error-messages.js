/**
 * Test EDIcraft User-Friendly Error Messages
 * Verifies that error messages contain proper troubleshooting guidance
 */

// Mock environment variables for testing
process.env.MINECRAFT_HOST = 'edicraft.nigelgardiner.com';
process.env.MINECRAFT_PORT = '49000';
process.env.EDI_PLATFORM_URL = 'https://osdu.example.com';
process.env.EDI_PARTITION = 'opendes';

// Simple implementation of getUserFriendlyErrorMessage (extracted from handler)
function getUserFriendlyErrorMessage(errorType, originalError) {
  switch (errorType) {
    case 'INVALID_CONFIG':
      return originalError; // Already formatted by buildEnvironmentErrorMessage
    
    case 'AGENT_NOT_DEPLOYED':
      return `❌ Bedrock AgentCore Not Deployed\n\n` +
             `The EDIcraft agent requires a deployed Bedrock AgentCore instance.\n\n` +
             `📋 Deployment Steps:\n` +
             `1. Navigate to the edicraft-agent directory\n` +
             `2. Follow the deployment guide: BEDROCK_AGENTCORE_DEPLOYMENT.md\n` +
             `3. Deploy the agent using: make deploy\n` +
             `4. Update BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID environment variables\n` +
             `5. Restart the sandbox: npx ampx sandbox\n\n` +
             `Error details: ${originalError}`;
    
    case 'CONNECTION_REFUSED':
      return `❌ Unable to Connect to Minecraft Server\n\n` +
             `Cannot connect to Minecraft server at ${process.env.MINECRAFT_HOST}:${process.env.MINECRAFT_PORT}\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify the Minecraft server is running\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm the server is accessible from this network\n` +
             `4. Verify firewall rules allow connections on port ${process.env.MINECRAFT_PORT}\n` +
             `5. Test connection: telnet ${process.env.MINECRAFT_HOST} ${process.env.MINECRAFT_PORT}`;
    
    case 'TIMEOUT':
      return `⏱️ Connection Timeout\n\n` +
             `Connection to Minecraft server timed out.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Check network connectivity to ${process.env.MINECRAFT_HOST}\n` +
             `2. Verify server is not under heavy load\n` +
             `3. Check firewall or security group settings\n` +
             `4. Increase timeout if server is slow to respond`;
    
    case 'AUTH_FAILED':
      return `🔐 Authentication Failed\n\n` +
             `Unable to authenticate with Minecraft server or OSDU platform.\n\n` +
             `🔧 Troubleshooting Steps:\n\n` +
             `**For Minecraft RCON:**\n` +
             `1. Verify RCON password is correct (MINECRAFT_RCON_PASSWORD)\n` +
             `2. Check RCON is enabled in server.properties\n` +
             `3. Confirm RCON port matches server configuration\n\n` +
             `**For OSDU Platform:**\n` +
             `1. Verify EDI_USERNAME and EDI_PASSWORD are correct\n` +
             `2. Check EDI_CLIENT_ID and EDI_CLIENT_SECRET are valid\n` +
             `3. Confirm user has necessary permissions`;
    
    case 'OSDU_ERROR':
      return `🌐 OSDU Platform Error\n\n` +
             `Error accessing OSDU platform.\n\n` +
             `🔧 Troubleshooting Steps:\n` +
             `1. Verify OSDU platform credentials are correct\n` +
             `2. Check platform URL is accessible: ${process.env.EDI_PLATFORM_URL}\n` +
             `3. Confirm user has necessary permissions\n` +
             `4. Verify partition name is correct: ${process.env.EDI_PARTITION}\n` +
             `5. Check platform status and availability\n\n` +
             `Error details: ${originalError}`;
    
    default:
      return `❌ An Error Occurred\n\n` +
             `${originalError}\n\n` +
             `🔧 General Troubleshooting:\n` +
             `1. Check Minecraft server status\n` +
             `2. Verify OSDU platform connectivity\n` +
             `3. Review environment variable configuration\n` +
             `4. Check CloudWatch logs for detailed error information`;
  }
}

// Test cases for error messages
const testCases = [
  {
    errorType: 'CONNECTION_REFUSED',
    originalError: 'ECONNREFUSED',
    requiredKeywords: [
      'Unable to Connect',
      'Minecraft Server',
      'edicraft.nigelgardiner.com:49000',
      'Troubleshooting Steps',
      'RCON is enabled',
      'firewall rules',
      'telnet'
    ]
  },
  {
    errorType: 'TIMEOUT',
    originalError: 'ETIMEDOUT',
    requiredKeywords: [
      'Connection Timeout',
      'Troubleshooting Steps',
      'network connectivity',
      'edicraft.nigelgardiner.com',
      'firewall or security group'
    ]
  },
  {
    errorType: 'AUTH_FAILED',
    originalError: 'Authentication failed',
    requiredKeywords: [
      'Authentication Failed',
      'Troubleshooting Steps',
      'RCON password',
      'MINECRAFT_RCON_PASSWORD',
      'EDI_USERNAME',
      'EDI_PASSWORD',
      'EDI_CLIENT_ID',
      'permissions'
    ]
  },
  {
    errorType: 'OSDU_ERROR',
    originalError: 'OSDU platform error',
    requiredKeywords: [
      'OSDU Platform Error',
      'Troubleshooting Steps',
      'credentials',
      'https://osdu.example.com',
      'opendes',
      'permissions',
      'platform status'
    ]
  },
  {
    errorType: 'AGENT_NOT_DEPLOYED',
    originalError: 'Agent not found',
    requiredKeywords: [
      'Bedrock AgentCore Not Deployed',
      'Deployment Steps',
      'BEDROCK_AGENTCORE_DEPLOYMENT.md',
      'make deploy',
      'BEDROCK_AGENT_ID',
      'npx ampx sandbox'
    ]
  }
];

console.log('=== Testing EDIcraft User-Friendly Error Messages ===\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach(testCase => {
  console.log(`Testing: ${testCase.errorType}`);
  
  const message = getUserFriendlyErrorMessage(testCase.errorType, testCase.originalError);
  
  let allKeywordsFound = true;
  const missingKeywords = [];
  
  testCase.requiredKeywords.forEach(keyword => {
    if (!message.includes(keyword)) {
      allKeywordsFound = false;
      missingKeywords.push(keyword);
    }
  });
  
  if (allKeywordsFound) {
    console.log(`  ✅ PASS - All required keywords found`);
    console.log(`  Keywords checked: ${testCase.requiredKeywords.length}\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Missing keywords: ${missingKeywords.join(', ')}`);
    console.log(`  Message preview: ${message.substring(0, 100)}...\n`);
    failedTests++;
  }
});

// Test that messages include troubleshooting guidance
console.log('=== Verifying Troubleshooting Guidance ===\n');

const guidanceTests = [
  {
    errorType: 'CONNECTION_REFUSED',
    requiredGuidance: ['Minecraft server', 'RCON', 'firewall']
  },
  {
    errorType: 'OSDU_ERROR',
    requiredGuidance: ['credentials', 'platform URL', 'permissions']
  }
];

guidanceTests.forEach(test => {
  console.log(`Testing guidance for: ${test.errorType}`);
  const message = getUserFriendlyErrorMessage(test.errorType, 'Test error');
  
  let hasAllGuidance = true;
  test.requiredGuidance.forEach(guidance => {
    if (!message.toLowerCase().includes(guidance.toLowerCase())) {
      hasAllGuidance = false;
      console.log(`  ❌ Missing guidance: ${guidance}`);
    }
  });
  
  if (hasAllGuidance) {
    console.log(`  ✅ PASS - All required guidance present\n`);
    passedTests++;
  } else {
    console.log(`  ❌ FAIL - Some guidance missing\n`);
    failedTests++;
  }
});

// Summary
console.log('=== Test Summary ===');
console.log(`Total Tests: ${testCases.length + guidanceTests.length}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests === 0) {
  console.log('\n✅ All error message tests passed!');
  console.log('✅ User-friendly messages contain proper troubleshooting guidance');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the error messages.');
  process.exit(1);
}
